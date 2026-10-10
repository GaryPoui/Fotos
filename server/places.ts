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
        address: "",
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
    let incomplete = false;
    const enrich = async (point: PlaceCandidate): Promise<PlaceCandidate[]> => {
      if (point.approximate) return [point]; // A camera center is not a place.
      try {
        const endpoint = new URL(
          "../reverse",
          options.endpoint ||
            process.env.PLACES_SEARCH_URL ||
            "https://photon.komoot.io/api/",
        );
        endpoint.search = "";
        endpoint.searchParams.set("lat", String(point.lat));
        endpoint.searchParams.set("lon", String(point.lng));
        endpoint.searchParams.set("radius", "0.1");
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
        if (!response.ok) throw new Error("Reverse unavailable");
        const json = (await response.json()) as {
          features?: {
            geometry?: { coordinates?: number[] };
            properties?: Record<string, unknown>;
          }[];
        };
        const nearby = (Array.isArray(json.features) ? json.features : [])
          .flatMap((feature) => {
            const [lng, lat] = feature.geometry?.coordinates || [];
            if (!validPoint(lat, lng)) return [];
            const radians = Math.PI / 180;
            const a =
              Math.sin(((lat - point.lat) * radians) / 2) ** 2 +
              Math.cos(lat * radians) *
                Math.cos(point.lat * radians) *
                Math.sin(((lng - point.lng) * radians) / 2) ** 2;
            const distance =
              6371000 *
              2 *
              Math.atan2(
                Math.sqrt(Math.min(1, a)),
                Math.sqrt(Math.max(0, 1 - a)),
              );
            if (distance > 100) return [];
            const p = feature.properties || {};
            const part = (key: string) =>
              typeof p[key] === "string" ? String(p[key]) : "";
            const street =
              part("street") || (p.type === "street" ? part("name") : "");
            if (!street) return [];
            const address = [
              [street, part("housenumber")].filter(Boolean).join(" "),
              part("city"),
              part("state"),
              part("country"),
            ]
              .filter(Boolean)
              .join(", ")
              .slice(0, 400);
            return [{ distance, street, address }];
          })
          .sort((a, b) => a.distance - b.distance);
        if (nearby[0])
          return [
            {
              ...point,
              name:
                point.name === "Lugar en el mapa"
                  ? nearby[0].street.slice(0, 100)
                  : point.name,
              address: nearby[0].address,
              addressApproximate: true,
            },
          ];
      } catch {
        /* Keep the exact Maps point usable when reverse lookup fails. */
      }
      incomplete = true;
      return [point];
    };
    const lookup = async () => {
      let query = input;
      let parsed: ReturnType<typeof parseMapsUrl> | undefined;
      if (/^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith("//"))
        parsed = parseMapsUrl(input);
      else if (/^(?:www\.|maps\.)\S/i.test(input)) throw invalidLink();
      if (now() < nextRequest)
        throw new PlaceLookupError(
          429,
          "Esperá un segundo antes de volver a buscar.",
        );
      nextRequest = now() + 1000;
      if (parsed?.point) return enrich(parsed.point);
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
          if (parsed.point) return enrich(parsed.point);
          if (parsed.query) break;
          if (!parsed.short || hop === 4) throw invalidLink();
        }
      }
      query = parsed?.query || query;
      const direct = coordinatePair(query);
      if (direct)
        return enrich({ ...direct, name: "Lugar en el mapa", address: "" });
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
    const promise = lookup()
      .then((results) => {
        if (incomplete) cache.delete(input); // A retry can recover a missing address.
        return results;
      })
      .catch((error) => {
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
