import { createClient } from '@supabase/supabase-js';
import { failure } from './catalog.js';
let client;
export async function verifySupabaseUser(token){
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)throw failure(503,'AUTH_NOT_CONFIGURED','Configura Supabase Auth en el servidor.');
 client ||= createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await client.auth.getUser(token);
 if(error||!data.user)throw failure(401,'UNAUTHORIZED','Sesión inválida o vencida.');
 return data.user;
}
export function adminGuard(db,verify=verifySupabaseUser){return async(req,_res,next)=>{
 try{
  const match=/^Bearer ([^\s]+)$/.exec(req.headers.authorization||'');
  if(!match)throw failure(401,'UNAUTHORIZED','Inicia sesión.');
  const user=await verify(match[1]);
  const {rows}=await db().query('SELECT user_id FROM aromas.admin_users WHERE user_id=$1 AND active=true',[user.id]);
  if(!rows.length)throw failure(403,'FORBIDDEN','Esta cuenta no tiene acceso administrativo.');
  req.adminId=user.id;next();
 }catch(e){next(e);}
};}
