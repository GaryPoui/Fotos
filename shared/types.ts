export type MediaKind = "photo" | "video" | "audio";
export interface Media {
  id: string;
  kind: MediaKind;
  title: string;
  date: string;
  album: string;
  tags: string[];
  favorite: boolean;
  artist: string;
  mime: string;
  size: number;
  createdAt: string;
}
export interface Note {
  id: string;
  type: "quote" | "letter";
  title: string;
  body: string;
  author: string;
  date: string;
  favorite: boolean;
  createdAt: string;
}
export interface Settings {
  names: string;
  since: string;
  coverId?: string;
  featuredId?: string;
  title: string;
}
export interface Library {
  places?: Place[];
  albums?: AlbumCustomization[];
  media: Media[];
  notes: Note[];
  settings: Settings;
  storage: { used: number; limit: number; maxFile: number };
}
export interface AlbumCustomization {
  album: string;
  title: string;
  coverId: string | null;
}
export type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "shopping"
  | "visit"
  | "important"
  | "park"
  | "other";
export interface PlaceCandidate {
  name: string;
  address: string;
  lat: number;
  lng: number;
  approximate?: boolean;
}
export interface Place extends Omit<PlaceCandidate, "approximate"> {
  id: string;
  category: PlaceCategory;
  note: string;
  createdAt: string;
  updatedAt: string;
}
