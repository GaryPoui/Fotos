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
  capturedAt?: string | null;
  captureOffset?: string | null;
  dateSource?: "metadata" | "upload" | "manual" | null;
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
  media: Media[];
  notes: Note[];
  settings: Settings;
  storage: { used: number; limit: number; maxFile: number };
}
