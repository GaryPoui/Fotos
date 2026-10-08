import { afterAll, beforeAll, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db = new PGlite();
const claims = {iss:'https://securetoken.google.com/fotosconailu',aud:'fotosconailu',sub:'member',rincon:true,role:'authenticated'};
const ids = ['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
async function jwt(value: object) { await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(value)]); }
async function reserve(id: string, size: number) { return db.query("select public.rincon_reserve($1,$2,0,'mp3','audio/mpeg')",[id,size]); }
beforeAll(async () => {
 await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims',true)::jsonb $$;
 grant usage on schema auth,storage to authenticated,anon;
 grant execute on function auth.jwt() to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id int generated always as identity primary key,bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
 create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
 alter table storage.objects enable row level security;
 grant select,insert,delete,update on storage.objects to authenticated,anon;
 grant usage on all sequences in schema storage to authenticated,anon;`);
 await db.exec(readFileSync('supabase/storage.sql','utf8'));
 await db.exec('set role authenticated'); await jwt(claims);
});
afterAll(() => db.close());
it('reserves quota transactionally and rejects concurrent overflow', async () => {
 await db.exec('reset role');
 // Existing 850 MB, using valid individual rows.
 await db.exec(`insert into public.rincon_reservations(id,original_bytes,thumbnail_bytes,ext,mime)
 select ('00000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,50000000,0,'mp3','audio/mpeg' from generate_series(1,17) n; set role authenticated;`);
 const result = await Promise.allSettled(ids.map(id => reserve(id,40_000_000)));
 expect(result.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect(result.filter(r=>r.status==='rejected')).toHaveLength(1);
 expect((await db.query<{rincon_used:number}>('select public.rincon_used()')).rows[0].rincon_used).toBe(890_000_000);
 await db.exec('reset role; delete from public.rincon_reservations; set role authenticated');
});
it('private objects require reservation, valid size and MIME; updates and public reads fail', async () => {
 await reserve(ids[0],100);
 const insert = (name: string, size: number, mime='audio/mpeg') => db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)', ['rincon',name,JSON.stringify({size,mimetype:mime})]);
 await expect(insert(ids[0]+'/original.mp3',101)).rejects.toThrow();
 await expect(insert(ids[0]+'/original.mp3',100,'text/html')).rejects.toThrow();
 await expect(insert(ids[1]+'/original.mp3',100)).rejects.toThrow();
 // Permission probes use metadata without size and must work inside a rollback.
 await db.exec('begin');
 await db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)', ['rincon',ids[0]+'/original.mp3',JSON.stringify({contentLength:100,mimetype:'audio/mpeg'})]);
 await db.exec('rollback');
 // Completion runs as Storage superuser; trigger still rejects oversize.
 await db.exec('reset role');
 await expect(insert(ids[0]+'/original.mp3',101)).rejects.toThrow();
 await db.exec('set role authenticated');
 await insert(ids[0]+'/original.mp3',100);
 expect((await db.query('select * from storage.objects')).rows).toHaveLength(1);
 // UPDATE without a policy silently affects zero rows.
 expect((await db.query('update storage.objects set metadata=\'{"size":200}\'')).affectedRows).toBe(0);
 await expect(db.query('select public.rincon_release($1)',[ids[0]])).rejects.toThrow();
 await jwt({...claims,rincon:false});
 expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);
 await expect(reserve(ids[1],100)).rejects.toThrow();
 await jwt({...claims,iss:'https://securetoken.google.com/another-project'});
 expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);
 await jwt(claims);
 await db.exec('delete from storage.objects');
 await db.query('select public.rincon_release($1)',[ids[0]]);
 expect((await db.query<{rincon_used:number}>('select public.rincon_used()')).rows[0].rincon_used).toBe(0);
});
it('rejects empty, negative, oversized and invalid-format reservations', async () => {
 for (const size of [0,-1,50_000_001]) await expect(reserve(ids[0],size)).rejects.toThrow();
 await expect(db.query("select public.rincon_reserve($1,100,0,'html','text/html')",[ids[0]])).rejects.toThrow();
 await expect(db.query("select public.rincon_reserve($1,100,0,'png','image/png')",[ids[0]])).rejects.toThrow();
 await db.exec('reset role');
 expect((await db.query<{public:boolean}>('select public from storage.buckets')).rows[0].public).toBe(false);
 await db.exec('set role authenticated');
});
