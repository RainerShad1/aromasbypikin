import { z } from 'zod';
export const uuid = z.string().uuid();
const text = (max) => z.string().trim().max(max);
export const categoryInput = z.object({name:text(80).min(1),slug:text(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),active:z.boolean(),sort_order:z.number().int().min(0).max(10000)}).strict();
const image = z.string().url().max(2000).refine(v=>new URL(v).protocol==='https:','La imagen debe usar HTTPS.');
export const productInput = z.object({
 name:text(150).min(1),slug:text(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),brand:text(100),description:text(5000),
 category_id:uuid,family:text(100),concentration:text(100),notes:text(1500),featured:z.boolean(),active:z.boolean(),
 images:z.array(image).max(6),version:z.number().int().positive().optional(),
 variants:z.array(z.object({id:uuid.optional(),label:text(80).min(1),volume_ml:z.number().int().min(1).max(10000).nullable(),price_cents:z.number().int().min(1).max(100000000),stock:z.number().int().min(0).max(1000000),active:z.boolean()}).strict()).min(1).max(30)
}).strict().superRefine((p,ctx)=>{
 if(new Set(p.variants.map(v=>v.label.toLowerCase())).size!==p.variants.length)ctx.addIssue({code:'custom',message:'Las presentaciones deben tener nombres diferentes.'});
 const ids=p.variants.filter(v=>v.id).map(v=>v.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'Presentación duplicada.'});
 if(p.active&&(!p.images.length||!p.variants.some(v=>v.active)))ctx.addIssue({code:'custom',message:'Para publicar, añade una foto y una presentación activa.'});
});
export function failure(status,code,message){return Object.assign(new Error(message||code),{status,code});}
export function parse(schema,value){const result=schema.safeParse(value);if(!result.success)throw failure(400,'VALIDATION_ERROR',result.error.issues.map(x=>x.message).join(' '));return result.data;}
export const baseSelect=`SELECT p.id,p.slug,p.name,p.brand,p.description,p.family,p.concentration,p.notes,p.featured,p.active,p.category_id,p.images,p.version,p.created_at,
 c.name AS category_name,c.slug AS category_slug,
 COALESCE((SELECT jsonb_agg(jsonb_build_object('id',v.id,'label',v.label,'volume_ml',v.volume_ml,'price_cents',v.price_cents,'stock',v.stock,'active',v.active) ORDER BY v.price_cents,v.label) FROM aromas.product_variants v WHERE v.product_id=p.id AND ($1::boolean OR v.active)), '[]'::jsonb) AS variants
 FROM aromas.products p JOIN aromas.categories c ON c.id=p.category_id`;
export async function getProduct(db,id,admin=false){
 const {rows}=await db.query(baseSelect+` WHERE p.id=$2 AND ($1::boolean OR (p.active AND c.active AND EXISTS(SELECT 1 FROM aromas.product_variants v WHERE v.product_id=p.id AND v.active)))`,[admin,id]);
 if(!rows[0])throw failure(404,'NOT_FOUND','Perfume no encontrado.');return rows[0];
}
export async function saveProduct(pool,id,p){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const cat=await client.query('SELECT active FROM aromas.categories WHERE id=$1 FOR SHARE',[p.category_id]);
  if(!cat.rows[0]||(p.active&&!cat.rows[0].active))throw failure(400,'CATEGORY_INVALID','Selecciona una categoría activa para publicar.');
  if(id){const old=await client.query('SELECT version FROM aromas.products WHERE id=$1 FOR UPDATE',[id]);if(!old.rows[0])throw failure(404,'NOT_FOUND');if(p.version!==old.rows[0].version)throw failure(409,'VERSION_CONFLICT','Otro cambio modificó el perfume. Recarga antes de guardar.');}
  const values=[p.name,p.slug,p.brand,p.description,p.category_id,p.family,p.concentration,p.notes,p.featured,p.active,JSON.stringify(p.images)];
  let result;
  if(id)result=await client.query(`UPDATE aromas.products SET name=$1,slug=$2,brand=$3,description=$4,category_id=$5,family=$6,concentration=$7,notes=$8,featured=$9,active=$10,images=$11::jsonb,updated_at=now(),version=version+1 WHERE id=$12 RETURNING id`,[...values,id]);
  else result=await client.query(`INSERT INTO aromas.products(name,slug,brand,description,category_id,family,concentration,notes,featured,active,images,price_cents,stock) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,0,0) RETURNING id`,values);
  id=result.rows[0].id;
  const oldVariants=await client.query('SELECT id FROM aromas.product_variants WHERE product_id=$1',[id]);const allowed=new Set(oldVariants.rows.map(v=>v.id));
  await client.query('UPDATE aromas.product_variants SET active=false WHERE product_id=$1',[id]);
  for(const v of p.variants){
   if(v.id){if(!allowed.has(v.id))throw failure(400,'VARIANT_INVALID','Presentación ajena al perfume.');await client.query('UPDATE aromas.product_variants SET label=$1,volume_ml=$2,price_cents=$3,stock=$4,active=$5 WHERE id=$6 AND product_id=$7',[v.label,v.volume_ml,v.price_cents,v.stock,v.active,v.id,id]);}
   else await client.query('INSERT INTO aromas.product_variants(product_id,label,volume_ml,price_cents,stock,active) VALUES($1,$2,$3,$4,$5,$6)',[id,v.label,v.volume_ml,v.price_cents,v.stock,v.active]);
  }
  // Compatibilidad con la estructura anterior; las presentaciones son la fuente de verdad.
  await client.query(`UPDATE aromas.products SET price_cents=COALESCE((SELECT min(price_cents) FROM aromas.product_variants WHERE product_id=$1 AND active),0),stock=COALESCE((SELECT sum(stock) FROM aromas.product_variants WHERE product_id=$1 AND active),0),image_url=$2 WHERE id=$1`,[id,p.images[0]||null]);
  const product=await getProduct(client,id,true);await client.query('COMMIT');return product;
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
