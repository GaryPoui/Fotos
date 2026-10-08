import { z } from 'zod';
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(v);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, 'Fecha inválida');
export const mediaInput = z.object({
  title: z.string().trim().min(1).max(150), date,
  album: z.string().trim().max(80).default(''),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  artist: z.string().trim().max(100).default(''), favorite: z.boolean().default(false),
}).strict();
export const noteInput = z.object({
  type: z.enum(['quote', 'letter']), title: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(30000), author: z.string().trim().max(100).default(''),
  date, favorite: z.boolean().default(false),
}).strict();
export const settingsInput = z.object({
  names: z.string().trim().min(1).max(100), title: z.string().trim().min(1).max(80),
  since: z.union([date, z.literal('')]),
}).strict();

// Signature checks are client-side. Storage separately enforces membership, MIME and size.
export async function inspect(file: File) {
  const b = new Uint8Array(await file.slice(0, 4100).arrayBuffer());
  const s = (a: number, n: number) => String.fromCharCode(...b.slice(a, a + n));
  let ext = '', mime = '', kind: 'photo' | 'video' | 'audio' = 'photo';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) { ext = 'jpg'; mime = 'image/jpeg'; }
  else if (b[0] === 137 && s(1, 3) === 'PNG') { ext = 'png'; mime = 'image/png'; }
  else if (s(0, 3) === 'GIF') { ext = 'gif'; mime = 'image/gif'; }
  else if (s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP') { ext = 'webp'; mime = 'image/webp'; }
  else if (s(4, 4) === 'ftyp') {
    const brands = s(8, 40);
    if (/avif|avis/.test(brands)) { ext = 'avif'; mime = 'image/avif'; }
    else if (/M4A|M4B/.test(brands)) { ext = 'm4a'; mime = 'audio/mp4'; kind = 'audio'; }
    else if (/isom|iso2|mp41|mp42|avc1/.test(brands)) { ext = 'mp4'; mime = 'video/mp4'; kind = 'video'; }
  } else if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 && s(0, b.length).includes('webm')) {
    ext = 'webm'; mime = 'video/webm'; kind = 'video';
  } else if (s(0, 4) === 'RIFF' && s(8, 4) === 'WAVE') { ext = 'wav'; mime = 'audio/wav'; kind = 'audio'; }
  else if (s(0, 4) === 'OggS') { ext = 'ogg'; mime = 'audio/ogg'; kind = 'audio'; }
  else if (s(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) { ext = 'mp3'; mime = 'audio/mpeg'; kind = 'audio'; }
  if (!ext) throw new Error('Formato no compatible. Usá JPEG, PNG, WebP, GIF, AVIF, MP4, WebM o audio compatible.');
  return { ext, mime, kind };
}
export async function thumbnail(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > 80_000_000) throw new Error('La imagen es demasiado grande.');
    const scale = Math.min(1, 700 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('No pudimos procesar la foto.')), 'image/webp', 0.8));
  } finally { image.close(); }
}
