import {spawnSync} from 'node:child_process';
// Solo valores públicos se copian al entorno de Vite.
const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw new Error('Configura SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY antes de compilar.');
if(new URL(url).protocol!=='https:')throw new Error('SUPABASE_URL debe usar HTTPS.');
if(!key.startsWith('sb_publishable_'))throw new Error('Usa la Publishable key de Supabase (sb_publishable_), nunca una clave secreta.');
const result=spawnSync('npm',['run','build'],{stdio:'inherit',shell:process.platform==='win32',env:{...process.env,VITE_API_URL:'/api',VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:key}});
process.exit(result.status??1);
