// Temporary copies only. Successfully stored files and explicit logout are removed.
export type UploadItem={id:string;file:File;status:'pending'|'preparing'|'uploading'|'done'|'error';progress:number;error?:string};
export type UploadDraft={type:'memories'|'music';items:UploadItem[];title:string;date:string;album:string;tags:string;artist:string};
let sequence:Promise<unknown>=Promise.resolve();
function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('rincon-pending-uploads',1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('No pudimos guardar la tanda en este dispositivo.'));});}
async function operation<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest<T>){const db=await open();try{return await new Promise<T>((resolve,reject)=>{const transaction=db.transaction('drafts',mode),request=run(transaction.objectStore('drafts'));transaction.oncomplete=()=>resolve(request.result);transaction.onerror=transaction.onabort=()=>reject(new Error('No pudimos conservar esta tanda. Revisá el espacio del dispositivo.'));});}finally{db.close();}}
export async function loadDraft(type:UploadDraft['type']){await sequence;return operation('readonly',store=>store.get(type)) as Promise<UploadDraft|undefined>;}
export function saveDraft(draft:UploadDraft){const clean={...draft,items:draft.items.filter(i=>i.status!=='done').map(i=>({...i,status:'pending' as const,progress:0}))};const next=sequence.catch(()=>{}).then(()=>clean.items.length?operation('readwrite',store=>store.put(clean,draft.type)):operation('readwrite',store=>store.delete(draft.type)));sequence=next;return next;}
export function clearUploads(){const next=sequence.catch(()=>{}).then(()=>operation('readwrite',store=>store.clear()));sequence=next;return next;}
export async function discardPendingUploads(){
 let complete=true;
 try {
  const drafts=await Promise.all([loadDraft('memories'),loadDraft('music')]);
  const {cloudEnabled}=await import('./cloud/config');
  if(cloudEnabled){const {cloudDiscard}=await import('./cloud/client');for(const draft of drafts)for(const item of draft?.items||[]){try{await cloudDiscard(item.file,item.id);}catch{complete=false;}}}
 }catch{complete=false;}finally{await clearUploads().catch(()=>{complete=false;});}
 return complete;
}
