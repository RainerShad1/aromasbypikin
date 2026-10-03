import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir=new URL('../database/migrations/',import.meta.url);
let sql=`-- Aromas By Pikin: ejecutar completo en el SQL Editor de Supabase.\n-- Reejecutable: respeta las migraciones ya aplicadas y sus checksums.\nBEGIN;\nSELECT pg_advisory_xact_lock(41872001);\nCREATE SCHEMA IF NOT EXISTS aromas;\nREVOKE ALL ON SCHEMA aromas FROM PUBLIC;\nCREATE TABLE IF NOT EXISTS aromas.schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());\n`;
for(const name of (await readdir(dir)).filter(x=>x.endsWith('.sql')).sort()){
 const content=await readFile(new URL(name,dir),'utf8'),sha=createHash('sha256').update(content).digest('hex');
 sql+=`\nDO $install$ BEGIN\n IF NOT EXISTS(SELECT 1 FROM aromas.schema_migrations WHERE name='${name}') THEN\n EXECUTE '${content.replaceAll("'","''")}';\n INSERT INTO aromas.schema_migrations(name,checksum) VALUES('${name}','${sha}');\n ELSIF NOT EXISTS(SELECT 1 FROM aromas.schema_migrations WHERE name='${name}' AND checksum='${sha}') THEN\n RAISE EXCEPTION 'La migración ${name} cambió. No continúes hasta revisar la versión instalada.';\n END IF;\nEND $install$;\n`;
}
sql+=`\nALTER TABLE aromas.schema_migrations ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM PUBLIC;\nDO $secure$ BEGIN\n IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN\n REVOKE ALL ON SCHEMA aromas FROM anon; REVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM anon;\n END IF;\n IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN\n REVOKE ALL ON SCHEMA aromas FROM authenticated; REVOKE ALL ON ALL TABLES IN SCHEMA aromas FROM authenticated;\n END IF;\nEND $secure$;\nCOMMIT;\n`;
await writeFile(new URL('../database/INSTALAR-EN-SUPABASE.sql',import.meta.url),sql);
console.log('SQL de instalación generado.');
