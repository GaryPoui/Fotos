import { z } from "zod";
import { validPoint } from "../shared/places.js";
import type { PlaceCandidate } from "../shared/types.js";

export const placeInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    address: z.string().trim().max(400).default(""),
    category: z.enum([
      "cafe",
      "restaurant",
      "shopping",
      "visit",
      "important",
      "park",
      "other",
    ]),
    note: z.string().trim().max(1000).default(""),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .strict();
export const savedPlace = placeInput.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export class PlaceLookupError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const invalidLink = () =>
  new PlaceLookupError(
    400,
    "Pegá un enlace de un lugar de Google Maps, o buscá su dirección.",
  );
const googleHosts = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "google.com.ar",
  "www.google.com.ar",
  "maps.google.com.ar",
  "www.google.es",
  "google.es",
  "www.google.cl",
  "www.google.com.br",
  "www.google.com.mx",
  "www.google.co.uk",
]);
function allowedMapsUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalidLink();
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw invalidLink();
  const short =
    url.hostname === "maps.app.goo.gl" ||
    (url.hostname === "goo.gl" && url.pathname.startsWith("/maps/"));
  const long =
    googleHosts.has(url.hostname) &&
    (url.pathname.startsWith("/maps") ||
      url.hostname.startsWith("maps.google."));
  if (!short && !long) throw invalidLink();
  return url;
}
function coordinatePair(
  value: string,
): { lat: number; lng: number } | undefined {
  const match = value
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return;
  const lat = Number(match[1]),
    lng = Number(match[2]);
  if (!validPoint(lat, lng)) throw invalidLink();
  return { lat, lng };
}
export function parseMapsUrl(value: string): {
  short?: string;
  query?: string;
  point?: PlaceCandidate;
} {
  const url = allowedMapsUrl(value);
  if (url.hostname === "maps.app.goo.gl" || url.hostname === "goo.gl")
    return { short: url.toString() };
  if (url.pathname.startsWith("/maps/dir"))
    throw new PlaceLookupError(
      400,
      "Este enlace es de una ruta. Compartí el enlace de un solo lugar o marcá el punto en el mapa.",
    );
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    throw invalidLink();
  }
  const query =
    url.searchParams.get("query") || url.searchParams.get("q") || "";
  const coordinates = coordinatePair(query);
  const placeName = path.match(/\/place\/([^/]+)/)?.[1]?.replace(/\+/g, " ");
  if (coordinates)
    return {
      point: {
        ...coordinates,
        name: placeName || "Lugar en el mapa",
        address: query,
      },
    };
  // Shared Maps links can contain a camera center plus the actual place's data point.
  const data = (path + url.search).match(
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  );
  if (data) {
    const point = coordinatePair(data[1] + "," + data[2])!;
    return {
      point: { ...point, name: placeName || "Lugar en el mapa", address: "" },
    };
  }
  if (placeName || query) return { query: (query || placeName!).slice(0, 400) };
  const camera = path.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (camera) {
    const point = coordinatePair(camera[1] + "," + camera[2])!;
    return {
      point: {
        ...point,
        name: "Punto aproximado",
        address: "",
        approximate: true,
      },
    };
  }
  throw new PlaceLookupError(
    400,
    "El enlace no muestra un punto o dirección. Pegá la dirección o elegí el lugar tocando el mapa.",
  );
}

export function createPlaceResolver(
  options: {
    fetcher?: typeof fetch;
    now?: () => number;
    endpoint?: string;
    origin?: string;
  } = {},
) {
  const fetcher = options.fetcher || fetch,
    now = options.now || Date.now;
  const cache = new Map<
    string,
    { expires: number; promise: Promise<PlaceCandidate[]> }
  >();
  let nextRequest = 0;
  return async (raw: string): Promise<PlaceCandidate[]> => {
    const input = raw.trim();
    const cached = cache.get(input);
    if (cached && cached.expires > now()) return cached.promise;
    const lookup = async () => {
      let query = input;
      let parsed: ReturnType<typeof parseMapsUrl> | undefined;
      if (/^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith("//"))
        parsed = parseMapsUrl(input);
      else if (/^(?:www\.|maps\.)\S/i.test(input)) throw invalidLink();
      if (parsed?.point) return [parsed.point];
      if (now() < nextRequest)
        throw new PlaceLookupError(
          429,
          "Esperá un segundo antes de volver a buscar.",
        );
      nextRequest = now() + 1000;
      if (parsed?.short) {
        let current = parsed.short;
        for (let hop = 0; hop < 5; hop++) {
          allowedMapsUrl(current);
          const response = await fetcher(current, {
            redirect: "manual",
            signal: AbortSignal.timeout(10000),
            headers: { "User-Agent": "NuestroRincon/1.0" },
          });
          await response.body?.cancel();
          const location = response.headers.get("location");
          if (response.status < 300 || response.status >= 400 || !location)
            throw invalidLink();
          current = new URL(location, current).toString();
          parsed = parseMapsUrl(current); // Validate destination before any next request.
          if (parsed.point) return [parsed.point];
          if (parsed.query) break;
          if (!parsed.short || hop === 4) throw invalidLink();
        }
      }
      query = parsed?.query || query;
      const direct = coordinatePair(query);
      if (direct)
        return [{ ...direct, name: "Lugar en el mapa", address: query }];
      const endpoint = new URL(
        options.endpoint ||
          process.env.PLACES_SEARCH_URL ||
          "https://photon.komoot.io/api/",
      );
      endpoint.searchParams.set("q", query);
      endpoint.searchParams.set("limit", "5");
      const response = await fetcher(endpoint.toString(), {
        redirect: "error",
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "NuestroRincon/1.0 (" +
            (options.origin || "private couples map") +
            ")",
          Accept: "application/json",
        },
      });
      if (!response.ok)
        throw new PlaceLookupError(
          502,
          "No pudimos buscar la dirección. Reintentá o elegí el punto tocando el mapa.",
        );
      const json = (await response.json()) as {
        features?: {
          geometry?: { coordinates?: number[] };
          properties?: Record<string, unknown>;
        }[];
      };
      return (Array.isArray(json.features) ? json.features : [])
        .slice(0, 5)
        .flatMap((feature) => {
          const [lng, lat] = feature.geometry?.coordinates || [];
          if (!validPoint(lat, lng)) return [];
          const p = feature.properties || {};
          const part = (key: string) =>
            typeof p[key] === "string" ? String(p[key]) : "";
          const address = [
            [part("street"), part("housenumber")].filter(Boolean).join(" "),
            part("city"),
            part("state"),
            part("country"),
          ]
            .filter(Boolean)
            .join(", ")
            .slice(0, 400);
          return [
            {
              lat,
              lng,
              name: (part("name") || part("street") || query).slice(0, 100),
              address: address || query.slice(0, 400),
            },
          ];
        });
    };
    const promise = lookup().catch((error) => {
      cache.delete(input);
      if (error instanceof PlaceLookupError) throw error;
      throw new PlaceLookupError(
        502,
        "La búsqueda no está disponible. Volvé a intentar o elegí el punto en el mapa.",
      );
    });
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(input, { expires: now() + 3600000, promise });
    return promise;
  };
}
