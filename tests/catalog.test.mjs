import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createApp} from '../backend/src/app.js';
import {failure} from '../backend/src/catalog.js';
const ADMIN='11111111-1111-4111-8111-111111111111',OTHER='22222222-2222-4222-8222-222222222222';
test('SQL reejecutable, permisos, catálogo y administración',async()=>{
 const pg=new PGlite();const sql=await readFile(new URL('../database/INSTALAR-EN-SUPABASE.sql',import.meta.url),'utf8');
 await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');await pg.exec(sql);await pg.exec(sql);
 assert.equal((await pg.query('SELECT count(*)::int n FROM aromas.categories')).rows[0].n,5);
 assert.equal((await pg.query('SELECT count(*)::int n FROM aromas.products')).rows[0].n,0);
 assert.equal((await pg.query("SELECT has_schema_privilege('anon','aromas','usage') ok")).rows[0].ok,false);
 const rls=await pg.query("SELECT relname,relrowsecurity FROM pg_class JOIN pg_namespace n ON relnamespace=n.oid WHERE n.nspname='aromas' AND relkind='r'");assert.ok(rls.rows.every(x=>x.relrowsecurity));
 const adapter={query:(...args)=>pg.query(...args),connect:async()=>({query:(...args)=>pg.query(...args),release(){}})};
 const verifyUser=async token=>{if(token==='admin')return{id:ADMIN};if(token==='other')return{id:OTHER};throw failure(401,'UNAUTHORIZED');};
 await pg.query('INSERT INTO aromas.admin_users(user_id) VALUES($1)',[ADMIN]);
 const app=createApp({poolProvider:()=>adapter,verifyUser});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 async function req(path,{token,method='GET',body}={}){const r=await fetch(base+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return{status:r.status,body:await r.json()};}
 try{
  assert.equal((await req('/admin/products')).status,401);assert.equal((await req('/admin/products',{token:'other'})).status,403);assert.equal((await req('/admin/products',{token:'bad'})).status,401);
  const categories=(await req('/categories')).body.categories;const category_id=categories[0].id;
  const input={name:'Prueba de perfume',slug:'prueba-perfume',brand:'Marca prueba',category_id,description:'Texto',family:'Floral',concentration:'EDP',notes:'Rosa',featured:true,active:false,images:['https://example.com/perfume.jpg'],variants:[{label:'50 ml',volume_ml:50,price_cents:150000,stock:3,active:true},{label:'100 ml',volume_ml:100,price_cents:220000,stock:0,active:true}]};
  let result=await req('/admin/products',{token:'admin',method:'POST',body:input});assert.equal(result.status,201,JSON.stringify(result));let product=result.body.product;
  assert.equal((await req('/products')).body.total,0);assert.equal((await req('/products/'+product.id)).status,404);
  const update={...input,active:true,version:product.version,variants:product.variants};result=await req('/admin/products/'+product.id,{token:'admin',method:'PUT',body:update});assert.equal(result.status,200,JSON.stringify(result));product=result.body.product;
  let list=(await req('/products')).body;assert.equal(list.total,1);assert.equal(list.products[0].variants.length,2);
  assert.equal((await req('/products?q=NO-EXISTE')).body.total,0);assert.equal((await req('/products?category='+categories[0].slug)).body.total,1);
  assert.equal((await req('/products?sort=price_asc')).status,200);assert.equal((await req('/products?page=-1')).status,400);
  assert.equal((await req('/products?q='+encodeURIComponent("'; DROP TABLE aromas.products;--"))).body.total,0);
  assert.equal((await req('/admin/products/'+product.id,{token:'admin',method:'PUT',body:update})).status,409);
  const bad={...update,version:product.version,variants:[{...product.variants[0],id:OTHER}]};assert.equal((await req('/admin/products/'+product.id,{token:'admin',method:'PUT',body:bad})).status,400);
  assert.equal((await req('/products/'+product.id)).body.product.version,product.version); // rollback total
  assert.equal((await req('/admin/products',{token:'admin',method:'POST',body:{...input,slug:'otro',images:['javascript:alert(1)']}})).status,400);
  const cat=categories[0];assert.equal((await req('/admin/categories/'+cat.id,{token:'admin',method:'PUT',body:{name:cat.name,slug:cat.slug,sort_order:1,active:false}})).status,200);
  assert.equal((await req('/products')).body.total,0);assert.equal((await req('/products/'+product.id)).status,404);
  await pg.query('UPDATE aromas.admin_users SET active=false WHERE user_id=$1',[ADMIN]);assert.equal((await req('/admin/me',{token:'admin'})).status,403);
  assert.equal((await req('/customers')).status,404);
 }finally{await new Promise(r=>server.close(r));await pg.close();}
});
