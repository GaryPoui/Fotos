export type MediaKind = 'photo' | 'video' | 'audio';
export interface Media { id: string; kind: MediaKind; title: string; date: string; album: string; tags: string[]; favorite: boolean; artist: string; mime: string; size: number; createdAt: string; }
export interface Note { id: string; type: 'quote' | 'letter'; title: string; body: string; author: string; date: string; favorite: boolean; createdAt: string; }
export interface Settings { names: string; since: string; title: string; }
export interface Library { media: Media[]; notes: Note[]; settings: Settings; storage: { used: number; limit: number; maxFile: number }; }

