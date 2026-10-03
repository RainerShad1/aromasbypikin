import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { getPool } from './db.js';
import { adminGuard } from './auth.js';
import { baseSelect,categoryInput,productInput,parse,uuid,failure,getProduct,saveProduct } from './catalog.js';
const listInput=z.object({q:z.string().trim().max(150).default(''),category:z.string().max(80).default(''),family:z.string().max(100).default(''),brand:z.string().max(100).default(''),sort:z.enum(['selection','az','za','price_asc','price_desc']).default('selection'),page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(60).default(12),featured:z.enum(['true','false']).default('false')});
export function createApp({poolProvider=getPool,verifyUser}={}){
 const app=express();const origin=process.env.FRONTEND_ORIGIN||'http://localhost:5173';
 if(process.env.NODE_ENV==='production'&&!process.env.FRONTEND_ORIGIN)throw new Error('FRONTEND_ORIGIN obligatorio.');
 // Solo activar con el número real de proxies confiables del hosting.
 if(process.env.TRUST_PROXY_HOPS)app.set('trust proxy',Number(process.env.TRUST_PROXY_HOPS));
 app.disable('x-powered-by');app.use(helmet());app.use(cors({origin,methods:['GET','POST','PUT'],credentials:false}));
 app.use(express.json({limit:'64kb'}));app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-8',legacyHeaders:false}));
 const db=()=>{const pool=poolProvider();if(!pool)throw failure(503,'DATABASE_NOT_CONFIGURED','La base de datos todavía no está configurada.');return pool;};
 app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'aromas-api'}));
 app.get('/api/ready',async(_req,res)=>{await db().query('SELECT 1');res.json({status:'ready'});});
 app.get('/api/categories',async(_req,res)=>res.json({categories:(await db().query('SELECT id,name,slug FROM aromas.categories WHERE active ORDER BY sort_order,name')).rows}));
 app.get('/api/products',async(req,res)=>{
  const p=parse(listInput,req.query),pool=db();
  const params=[false,p.q,p.category,p.family,p.brand,p.featured==='true'];
  const where=` WHERE p.active AND c.active AND EXISTS(SELECT 1 FROM aromas.product_variants v WHERE v.product_id=p.id AND v.active)
   AND ($2='' OR strpos(lower(p.name || ' ' || p.brand),lower($2))>0)
   AND ($3='' OR c.slug=$3) AND ($4='' OR p.family=$4) AND ($5='' OR p.brand=$5) AND (NOT $6::boolean OR p.featured)`;
  const orders={selection:'p.featured DESC,p.created_at DESC,p.id',az:'p.name,p.id',za:'p.name DESC,p.id',price_asc:'p.price_cents,p.id',price_desc:'p.price_cents DESC,p.id'};
  const count=await pool.query('SELECT count(*)::integer AS total FROM aromas.products p JOIN aromas.categories c ON c.id=p.category_id'+where.replace(/\$([2-6])/g,(_,n)=>'$'+(Number(n)-1)),params.slice(1));
  const {rows}=await pool.query(baseSelect+where+` ORDER BY ${orders[p.sort]} LIMIT $7 OFFSET $8`,[...params,p.limit,(p.page-1)*p.limit]);
  res.json({products:rows,total:count.rows[0].total,page:p.page,limit:p.limit});
 });
 app.get('/api/catalog-filters',async(_req,res)=>{const {rows}=await db().query(`SELECT DISTINCT p.brand,p.family FROM aromas.products p JOIN aromas.categories c ON c.id=p.category_id WHERE p.active AND c.active`);res.json({brands:[...new Set(rows.map(r=>r.brand).filter(Boolean))].sort(),families:[...new Set(rows.map(r=>r.family).filter(Boolean))].sort()});});
 app.get('/api/products/:id',async(req,res)=>res.json({product:await getProduct(db(),parse(uuid,req.params.id))}));
 app.use('/api/admin',rateLimit({windowMs:60000,limit:60,standardHeaders:'draft-8',legacyHeaders:false}),adminGuard(db,verifyUser));
 app.get('/api/admin/me',(req,res)=>res.json({user_id:req.adminId}));
 app.get('/api/admin/categories',async(_req,res)=>res.json({categories:(await db().query('SELECT * FROM aromas.categories ORDER BY sort_order,name')).rows}));
 app.post('/api/admin/categories',async(req,res)=>{const p=parse(categoryInput,req.body);res.status(201).json({category:(await db().query('INSERT INTO aromas.categories(name,slug,active,sort_order) VALUES($1,$2,$3,$4) RETURNING *',[p.name,p.slug,p.active,p.sort_order])).rows[0]});});
 app.put('/api/admin/categories/:id',async(req,res)=>{const p=parse(categoryInput,req.body);const {rows}=await db().query('UPDATE aromas.categories SET name=$1,slug=$2,active=$3,sort_order=$4 WHERE id=$5 RETURNING *',[p.name,p.slug,p.active,p.sort_order,parse(uuid,req.params.id)]);if(!rows.length)throw failure(404,'NOT_FOUND');res.json({category:rows[0]});});
 app.get('/api/admin/products',async(req,res)=>{const p=parse(z.object({page:z.coerce.number().int().min(1).default(1),q:z.string().max(150).default('')}),req.query);const pool=db();const where=" WHERE ($2='' OR strpos(lower(p.name || ' ' || p.brand),lower($2))>0)";const {rows}=await pool.query(baseSelect+where+' ORDER BY p.updated_at DESC,p.id LIMIT 30 OFFSET $3',[true,p.q,(p.page-1)*30]);res.json({products:rows,total:(await pool.query("SELECT count(*)::int AS n FROM aromas.products WHERE ($1='' OR strpos(lower(name || ' ' || brand),lower($1))>0)",[p.q])).rows[0].n,page:p.page});});
 app.get('/api/admin/products/:id',async(req,res)=>res.json({product:await getProduct(db(),parse(uuid,req.params.id),true)}));
 app.post('/api/admin/products',async(req,res)=>res.status(201).json({product:await saveProduct(db(),null,parse(productInput,req.body))}));
 app.put('/api/admin/products/:id',async(req,res)=>res.json({product:await saveProduct(db(),parse(uuid,req.params.id),parse(productInput,req.body))}));
 app.use((_req,res)=>res.status(404).json({code:'NOT_FOUND'}));
 app.use((err,_req,res,_next)=>{
  if(err.type==='entity.parse.failed')return res.status(400).json({code:'INVALID_JSON',message:'JSON inválido.'});
  if(err.type==='entity.too.large')return res.status(413).json({code:'PAYLOAD_TOO_LARGE',message:'Solicitud demasiado grande.'});
  if(err.code==='23505')return res.status(409).json({code:'DUPLICATE',message:'Ese identificador o presentación ya existe.'});
  if(err.status)return res.status(err.status).json({code:err.code,message:err.message});
  console.error('Error de API:',err.code||'INTERNAL_ERROR');res.status(503).json({code:'SERVICE_UNAVAILABLE',message:'No fue posible completar la solicitud. Intenta de nuevo.'});
 });return app;
}
