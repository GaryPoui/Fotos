import type { AlbumCustomization, Media } from "./types.js";
export const albumNameKey = (name: string) =>
  name.trim().toLocaleLowerCase("es");
export function albumTitle(
  album: string,
  preferences: AlbumCustomization[] = [],
) {
  return preferences.find((entry) => entry.album === album)?.title || album;
}
export function albumKey(name: string, preferences: AlbumCustomization[] = []) {
  const trimmed = name.trim();
  if (preferences.some((entry) => entry.album === trimmed)) return trimmed;
  return (
    preferences.find(
      (entry) => albumNameKey(entry.title) === albumNameKey(trimmed),
    )?.album || trimmed
  );
}
export function albumCover(
  album: string,
  items: Media[],
  preferences: AlbumCustomization[] = [],
) {
  const photos = items.filter(
    (item) => item.album === album && item.kind === "photo",
  );
  const chosen = preferences.find((entry) => entry.album === album)?.coverId;
  return photos.find((photo) => photo.id === chosen) || photos[0];
}
