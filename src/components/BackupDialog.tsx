import { useRef, useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import type { Library } from '../../shared/types';
import { api } from '../lib';
import { Dialog } from './Dialog';
import { backupParts, backupZip } from '../backup';
export function BackupDialog({onClose}:{onClose:()=>void}){
 const [snapshot,setSnapshot]=useState<Library|null>(null),[part,setPart]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null);
 const parts=snapshot?backupParts(snapshot.media):[];
 const run=async()=>{setBusy(true);setError('');controller.current=new AbortController();try{
  const data=snapshot||await api<Library>('/library');if(!snapshot)setSnapshot(data);
  const groups=backupParts(data.media);const zip=await backupZip(data,groups[part],part+1,groups.length,setMessage,controller.current.signal);
  const url=URL.createObjectURL(new Blob([Uint8Array.from(zip)],{type:'application/zip'}));
  const link=document.createElement('a');link.href=url;link.download='nuestro-rincon-'+new Date().toISOString().slice(0,10)+'-parte-'+(part+1)+'-de-'+groups.length+'.zip';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  setPart(part+1);setMessage('Descarga preparada. Comprobá que el ZIP se guardó en tu dispositivo.');
 }catch(e){setError((e as Error).name==='AbortError'?'Descarga cancelada. Podés volver a intentarla.':(e as Error).message);}finally{setBusy(false);}};
 return <Dialog title="Una copia de lo nuestro" onClose={onClose} busy={busy}>
  <p>Descargá fotos, videos, canciones, cartas y ajustes juntos. Los álbumes grandes se dividen en partes de aproximadamente 100 MB.</p>
  <p className="form-help">Guardá todos los ZIP en un lugar privado: contienen nuestros recuerdos y se abren sin contraseña. Para una copia consistente, evitemos editar recuerdos mientras se descarga.</p>
  {message&&<p role="status">{message}</p>}{error&&<p role="alert" className="form-error">{error}</p>}
  {snapshot&&<p>{part} de {parts.length} partes preparadas.</p>}
  {(!snapshot||part<parts.length)&&<button className="button primary full-width" disabled={busy} onClick={run}>{busy?<LoaderCircle className="spin" size={18}/>:<Download size={18}/>} {busy?'Preparando nuestra copia…':part?'Descargar siguiente parte':'Descargar nuestros recuerdos'}</button>}
  {busy&&<button className="button secondary full-width" onClick={()=>controller.current?.abort()}>Cancelar descarga</button>}
  {snapshot&&part===parts.length&&<p role="status">Todas las partes están preparadas. Revisá tus descargas antes de considerar completo el respaldo.</p>}
 </Dialog>;
}
