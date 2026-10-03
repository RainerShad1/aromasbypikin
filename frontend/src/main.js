import './common.js';
import {api,escapeHTML as esc,money,safeImage,whatsapp} from './api.js';
const catalog=document.body.classList.contains('catalog-page');
const grid=document.querySelector('#grid'),empty=document.querySelector('#empty'),dialog=document.querySelector('#detail');
const search=document.querySelector('#search');
const params=new URLSearchParams(location.search);
const state={q:params.get('q')||'',category:params.get('categoria')||'',family:params.get('familia')||'',brand:params.get('marca')||'',sort:params.get('orden')||'selection',page:1};
let controller,request=0,debounce;
if(search)search.value=state.q;
function picture(product,cls=''){const url=safeImage(product.images?.[0]);return url?`<img class="${cls}" src="${esc(url)}" alt="${esc(product.name)}" loading="lazy">`:'<span class="no-photo">Sin fotografía</span>';}
function cards(products){grid.innerHTML=products.map(p=>{
 const variants=p.variants.filter(v=>v.active),price=variants.length?Math.min(...variants.map(v=>v.price_cents)):null;
 return `<article class="card"><button class="card-image real-photo" data-product="${esc(p.id)}" aria-label="Ver ${esc(p.name)}">${picture(p)}<span class="tag">${esc(p.category_name)}</span></button><div class="card-info"><p class="card-family">${esc(p.brand)}</p><h3>${esc(p.name)}</h3><p class="card-description">${esc(p.family||p.concentration)}</p><p class="product-price">${price===null?'Consultar precio':(variants.length>1?'Desde ':'')+money(price)}</p><span class="availability">${variants.some(v=>v.stock>0)?'Disponible':'Agotado'}</span><button class="details-link" data-product="${esc(p.id)}">Ver perfume</button></div></article>`;
 }).join('');grid.querySelectorAll('[data-product]').forEach(b=>b.onclick=()=>openProduct(b.dataset.product));
 grid.querySelectorAll('img').forEach(img=>img.onerror=()=>{img.replaceWith(Object.assign(document.createElement('span'),{className:'no-photo',textContent:'Imagen no disponible'}));});
}
function setUrl(){if(!catalog)return;const p=new URLSearchParams();for(const [k,v]of Object.entries({q:state.q,categoria:state.category,familia:state.family,marca:state.brand,orden:state.sort==='selection'?'':state.sort}))if(v)p.set(k,v);history.replaceState(null,'',location.pathname+(p.size?'?'+p:''));}
async function load(){
 const id=++request;controller?.abort();controller=new AbortController();grid.setAttribute('aria-busy','true');empty.hidden=true;
 document.querySelector('#pagination')?.replaceChildren();grid.innerHTML='<p class="catalog-loading" role="status">Buscando fragancias…</p>';
 try{
  const p=new URLSearchParams({...state,limit:catalog?'12':'3',featured:catalog?'false':'true'});
  const data=await api('/products?'+p,{signal:controller.signal});if(id!==request)return;
  cards(data.products);setUrl();
  const count=document.querySelector('#result-count');if(count)count.textContent=data.total+' '+(data.total===1?'fragancia':'fragancias');
  if(!data.products.length){empty.hidden=false;empty.innerHTML=`<h2>${catalog?'No hay perfumes para mostrar':'Nuestra selección está en camino'}</h2><p>${catalog?'Prueba otros filtros o vuelve pronto para descubrir novedades.':'Pronto encontrarás aquí nuestros perfumes destacados.'}</p>${catalog?'<button class="button" id="reset-empty">Limpiar filtros</button>':''}`;document.querySelector('#reset-empty')?.addEventListener('click',reset);}
  const pagination=document.querySelector('#pagination');if(pagination&&data.total>12){const pages=Math.ceil(data.total/12);pagination.innerHTML=`<button class="button subtle" id="previous" ${state.page===1?'disabled':''}>Anterior</button><span>Página ${state.page} de ${pages}</span><button class="button subtle" id="next" ${state.page>=pages?'disabled':''}>Siguiente</button>`;pagination.querySelector('#previous').onclick=()=>{state.page--;load();};pagination.querySelector('#next').onclick=()=>{state.page++;load();};}
 }catch(e){if(e.name==='AbortError')return;grid.replaceChildren();empty.hidden=false;empty.innerHTML='<h2>No pudimos cargar el catálogo</h2><p>Inténtalo de nuevo en un momento.</p><button class="button" id="retry">Reintentar</button>';document.querySelector('#retry').onclick=load;const count=document.querySelector('#result-count');if(count)count.textContent='';}
 finally{if(id===request)grid.setAttribute('aria-busy','false');}
}
function change(key,value){state[key]=value;state.page=1;load();}
function reset(){Object.assign(state,{q:'',category:'',family:'',brand:'',sort:'selection',page:1});search.value='';document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='')));for(const id of ['family-filter','brand-filter'])document.querySelector('#'+id).value='';document.querySelector('#catalog-sort').value='selection';load();}
async function metadata(){if(!catalog)return;try{
 const [c,f]=await Promise.all([api('/categories'),api('/catalog-filters')]);
 const bar=document.querySelector('#category-filters');bar.innerHTML=[{slug:'',name:'Todos'},...c.categories].map(x=>`<button class="filter" data-category="${esc(x.slug)}" aria-pressed="${state.category===x.slug}">${esc(x.name)}</button>`).join('');bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));change('category',b.dataset.category);});
 for(const [id,values,key,label]of [['family-filter',f.families,'family','Todas las familias'],['brand-filter',f.brands,'brand','Todas las marcas']]){const el=document.querySelector('#'+id);el.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option>${esc(v)}</option>`).join('');el.value=state[key];el.onchange=()=>change(key,el.value);}
 }catch{document.querySelector('#category-filters').textContent='Las categorías no están disponibles en este momento.';}}
search?.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>change('q',search.value),300);});
const sort=document.querySelector('#catalog-sort');if(sort){sort.value=state.sort;if(!sort.value){state.sort='selection';sort.value='selection';}sort.onchange=()=>change('sort',sort.value);}
let detailRequest=0;
async function openProduct(id){
 const current=++detailRequest;dialog.innerHTML='<button class="dialog-close icon-button" aria-label="Cerrar">×</button><p class="detail-loading">Cargando perfume…</p>';dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();
 try{const {product:p}=await api('/products/'+id);if(current!==detailRequest||!dialog.open)return;
 const variants=p.variants.filter(v=>v.active);
 dialog.innerHTML=`<button class="dialog-close icon-button" aria-label="Cerrar">×</button><div class="detail-layout"><div class="detail-gallery"><div class="detail-real-image">${picture(p)}</div><div class="gallery-thumbs">${p.images.map((url,i)=>safeImage(url)?`<button data-image="${i}" aria-label="Fotografía ${i+1}"><img src="${esc(url)}" alt=""></button>`:'').join('')}</div></div><div class="detail-copy"><p class="eyebrow">${esc(p.brand)}</p><h2 id="detail-title">${esc(p.name)}</h2><p>${esc(p.description)}</p><p>${esc(p.family)}${p.concentration?' · '+esc(p.concentration):''}</p>${p.notes?`<p><strong>Notas olfativas</strong><br>${esc(p.notes)}</p>`:''}<label class="variant-label">Presentación<select id="variant">${variants.map((v,i)=>`<option value="${i}">${esc(v.label)}</option>`).join('')}</select></label><p id="variant-price" class="product-price"></p><p id="variant-stock"></p><a id="product-whatsapp" class="button" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></div></div>`;
 dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
 dialog.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>{dialog.querySelector('.detail-real-image img').src=safeImage(p.images[Number(b.dataset.image)]);});
 const update=()=>{const v=variants[Number(dialog.querySelector('#variant').value)];dialog.querySelector('#variant-price').textContent=money(v.price_cents);dialog.querySelector('#variant-stock').textContent=v.stock>0?'Disponible':'Agotado · consulta cuándo vuelve';dialog.querySelector('#product-whatsapp').href=whatsapp(`Hola estoy interesado en ${p.brand} ${p.name}, presentación ${v.label} (${money(v.price_cents)}). Vengo de tu pagina.`);};dialog.querySelector('#variant').onchange=update;update();
 }catch{if(current!==detailRequest||!dialog.open)return;dialog.innerHTML='<button class="dialog-close icon-button" aria-label="Cerrar">×</button><p class="detail-loading">No pudimos cargar el perfume. Cierra e inténtalo de nuevo.</p>';dialog.querySelector('button').onclick=()=>dialog.close();}
}
dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
metadata();load();if(catalog&&params.has('buscar'))search.focus();
