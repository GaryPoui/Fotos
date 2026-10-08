import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const script = readFileSync('public/private-media-sw.js','utf8');
function setup(credential: object | null, remoteStatus=206, exposed=true) {
 const handlers: Record<string, (event: unknown) => void> = {};
 const calls: {url:string;options:RequestInit}[] = [];
 class Channel {
  port1: {onmessage?: (e: {data:unknown})=>void;close:()=>void} = {close:()=>{}};
  port2 = {postMessage:(data:unknown)=>this.port1.onmessage?.({data})};
 }
 const context = { URL, Response, Headers, MessageChannel: Channel, setTimeout, clearTimeout,
  self: { location:{origin:'https://fotosconailu.web.app'}, addEventListener:(name:string,fn:(event:unknown)=>void)=>handlers[name]=fn,
   clients:{get:async()=>({postMessage:(_data:unknown,ports:{postMessage:(data:unknown)=>void}[])=>ports[0].postMessage(credential)})}},
  fetch:async(url:string,options:RequestInit)=>{ calls.push({url,options}); return new Response('1234567890',{status:remoteStatus,headers:{...(exposed ? {'Content-Range':'bytes 0-9/100'} : {}),'Accept-Ranges':'bytes','Content-Length':'10'}}); },
 };
 runInNewContext(script,context);
 async function request(path='/api/files/11111111-1111-4111-8111-111111111111') {
  let promise: Promise<Response> | undefined;
  handlers.fetch({request:new Request('https://fotosconailu.web.app'+path,{headers:{Range:'bytes=0-9'}}),clientId:'client',respondWith:(p:Promise<Response>)=>promise=p});
  return promise;
 }
 return {request,calls};
}
const credentials = {token:'test-token',key:'public-key',url:'https://test.supabase.co/storage/v1/object/authenticated/rincon/111/original.mp3',mime:'audio/mpeg',size:100};
it('proxies authenticated Range and safe headers without caching or redirects',async()=>{
 const {request,calls}=setup(credentials);
 const response = await request();
 expect(response?.status).toBe(206);
 expect(await response?.text()).toBe('1234567890');
 expect(response?.headers.get('Content-Range')).toBe('bytes 0-9/100');
 expect(response?.headers.get('Cache-Control')).toBe('no-store');
 expect(response?.headers.get('Content-Type')).toBe('audio/mpeg');
 expect(calls[0].options).toMatchObject({cache:'no-store',redirect:'error',headers:{Range:'bytes=0-9',Authorization:'Bearer test-token'}});
});
it('denies requests after logout and never forwards credentials to arbitrary URLs',async()=>{
 for(const creds of [null,{...credentials,url:'https://evil.example/collect'},{...credentials,url:'https://test.supabase.co/storage/v1/object/public/rincon/photo'}]) {
  const {request,calls}=setup(creds);
  expect((await request())?.status).toBe(creds?403:401);
  expect(calls).toHaveLength(0);
 }
});
it('preserves unsatisfiable ranges and ignores unrelated routes',async()=>{
 const {request}=setup(credentials,416);
 expect((await request())?.status).toBe(416);
 expect(await request('/api/library')).toBeUndefined();
});

it('restores Content-Range when Storage CORS hides it from media playback',async()=>{
 const {request}=setup(credentials,206,false);
 expect((await request())?.headers.get('Content-Range')).toBe('bytes 0-9/100');
 const invalid=setup({...credentials,size:5},206,false);
 expect((await invalid.request())?.status).toBe(502);
});
