import { useRef, useState, type FormEvent } from 'react';
import { UploadCloud, Check, X, FileImage, Music2, LoaderCircle } from 'lucide-react';
import { Dialog } from './Dialog';
import { bytes, today, upload } from '../lib';
type Item = { file: File; status: 'pending' | 'uploading' | 'done' | 'error'; progress: number; error?: string };
export function UploadDialog({ type, maxFile, albums, onClose, onChanged }: { type: 'memories' | 'music'; maxFile: number; albums: string[]; onClose: () => void; onChanged: (message: string) => Promise<void> }) {
  const [items, setItems] = useState<Item[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [title, setTitle] = useState(''), [date, setDate] = useState(today()), [album, setAlbum] = useState(''), [tags, setTags] = useState(''), [artist, setArtist] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const addFiles = (files: FileList | null) => {
    if (!files || busy) return;
    const added = Array.from(files).map(file => ({ file, status: file.size > maxFile ? 'error' as const : 'pending' as const, progress: 0, error: file.size > maxFile ? 'Supera ' + bytes(maxFile) : undefined }));
    setItems(old => [...old, ...added].slice(0, 20));
    if (items.length + added.length > 20) setError('Podés subir hasta 20 archivos por tanda.');
  };
  const change = (index: number, patch: Partial<Item>) => setItems(old => old.map((item, i) => i === index ? { ...item, ...patch } : item));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!items.length) { setError('Primero elegí al menos un archivo.'); return; }
    setBusy(true); setError(''); let succeeded = 0, failed = 0;
    const tagList = [...new Set(tags.split(',').map(s => s.trim()).filter(Boolean))];
    if (tagList.length > 10 || tagList.some(t => t.length > 30)) { setError('Usá hasta 10 etiquetas de 30 caracteres.'); setBusy(false); return; }
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;
      if (items[i].file.size > maxFile) { failed++; continue; }
      change(i, { status: 'uploading', error: undefined, progress: 0 });
      try {
        await upload(items[i].file, { title: items.length === 1 && title.trim() ? title.trim() : items[i].file.name.replace(/\.[^.]+$/, '').slice(0, 150), date, album, tags: JSON.stringify(tagList), artist }, n => change(i, { progress: n }));
        change(i, { status: 'done', progress: 100 }); succeeded++;
      } catch (e) { change(i, { status: 'error', error: (e as Error).message }); failed++; }
    }
    if (succeeded) { try { await onChanged(succeeded === 1 ? 'Un recuerdo más para nosotros.' : succeeded + ' archivos guardados con amor.'); } catch (e) { setError((e as Error).message); failed++; } }
    setBusy(false);
    if (!failed) onClose(); else setError('Algunos archivos no se guardaron. Los que tienen ✓ ya están seguros; podés reintentar los demás.');
  };
  return <Dialog title={type === 'music' ? 'Una canción para nosotros' : 'Guardar un momento'} onClose={onClose} busy={busy}><form onSubmit={submit}>
    <div className="dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
      <UploadCloud size={32} /><strong>{type === 'music' ? 'Nuestra próxima canción favorita' : 'Los recuerdos empiezan acá'}</strong><p>Elegí archivos o arrastralos hasta acá.</p>
      <button type="button" className="button secondary" disabled={busy} onClick={() => input.current?.click()}>Elegir {type === 'music' ? 'canciones' : 'fotos y videos'}</button>
      <input ref={input} type="file" aria-label={type === 'music' ? 'Archivos de música' : 'Fotos y videos'} className="sr-only" multiple accept={type === 'music' ? '.mp3,.wav,.ogg,.opus,.m4a' : '.jpg,.jpeg,.png,.webp,.gif,.avif,.mp4,.webm'} disabled={busy} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} /><small>Hasta {bytes(maxFile)} por archivo · 20 por tanda</small>
    </div>
    {items.length > 0 && <ul className="upload-list">{items.map((item, i) => <li key={i} className={item.status}><span className="file-icon">{item.status === 'done' ? <Check size={18} /> : type === 'music' ? <Music2 size={18} /> : <FileImage size={18} />}</span><div><strong>{item.file.name}</strong><small>{item.error || (item.status === 'uploading' ? item.progress === 100 ? 'Procesando…' : item.progress + '%' : item.status === 'done' ? 'Guardado' : bytes(item.file.size))}</small>{item.status === 'uploading' && <progress value={item.progress} max={100} aria-label={'Subiendo ' + item.file.name} />}</div>{!busy && item.status !== 'done' && <button type="button" className="icon-button" aria-label={'Quitar ' + item.file.name} onClick={() => setItems(old => old.filter((_, j) => j !== i))}><X size={17} /></button>}</li>)}</ul>}
    {items.length === 1 && <label>Título<input value={title} onChange={e => setTitle(e.target.value)} maxLength={150} placeholder="Un nombre para este momento" disabled={busy} /></label>}
    {type === 'memories' ? <><div className="form-row"><label>Fecha del recuerdo<input type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={busy} /></label><label>Álbum<input list="albums" value={album} onChange={e => setAlbum(e.target.value)} maxLength={80} placeholder="Por ejemplo, Viajes" disabled={busy} /><datalist id="albums">{albums.map(a => <option key={a} value={a} />)}</datalist></label></div><label>Etiquetas<input value={tags} onChange={e => setTags(e.target.value)} placeholder="playa, vacaciones, juntos" disabled={busy} /><small>Separadas por comas.</small></label></> : <label>Artista<input value={artist} onChange={e => setArtist(e.target.value)} maxLength={100} placeholder="¿Quién la canta?" disabled={busy} /></label>}
    {error && <p role="alert" className="form-error">{error}</p>}<button className="button primary full-width" disabled={busy || !items.length}>{busy ? <LoaderCircle className="spin" size={18} /> : <UploadCloud size={18} />}{busy ? 'Guardando nuestros recuerdos…' : 'Guardar en nuestro rincón'}</button>
  </form></Dialog>;
}

