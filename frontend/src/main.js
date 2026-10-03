// Prototipo visual. Estos perfumes son ilustrativos; todavía no se leen de la API.

const products=[{name:'Rose Lumière',family:'Floral · Suave y luminosa',key:'floral',pos:'0%',description:'La delicadeza de las rosas, un aire suave y una sensación de frescura que acompaña.',short:'Delicada, romántica, luminosa.',tag:'Floral'},{name:'Bleu Intense',family:'Fresca · Cítrica y profunda',key:'fresh',pos:'50%',description:'Una interpretación fresca de los cítricos, con carácter sereno y una presencia que perdura en el recuerdo.',short:'Fresco, vibrante, envolvente.',tag:'Fresca'},{name:'Ambre Signature',family:'Ambarada · Cálida y envolvente',key:'amber',pos:'100%',description:'Un encuentro imaginado entre flores blancas, vainilla y la calidez de las notas ambaradas.',short:'Cálida, elegante, memorable.',tag:'Ambarada'}];
const grid=document.querySelector('#grid');
grid.innerHTML=products.map((p,i)=>`<article class="card" data-key="${p.key}"><button class="card-image" data-detail="${i}" aria-label="Descubrir ${p.name}"><span class="product-photo" style="--pos:${p.pos}"></span><span class="tag">${p.tag}</span></button><div class="card-info"><h3>${p.name}</h3><p class="card-family">${p.family}</p><p class="card-description">${p.short}</p><button class="details-link" data-detail="${i}">Descubrir aroma</button></div></article>`).join('');
let selected='all';const search=document.querySelector('#search');function filter(){let count=0;document.querySelectorAll('.card').forEach((el,i)=>{const p=products[i],q=search.value.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();const text=(p.name+' '+p.family+' '+p.short).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();el.hidden=!((selected==='all'||p.key===selected)&&text.includes(q));if(!el.hidden)count++});document.querySelector('#empty').hidden=count!==0; const counter=document.querySelector('#result-count');if(counter)counter.textContent=count+' '+(count===1?'fragancia':'fragancias');}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()}));search.addEventListener('input',filter);
document.querySelector('#search-toggle').addEventListener('click',()=>{if(!document.body.classList.contains('catalog-page')){location.href='/catalogo/?buscar=1';return;}document.querySelector('#search-row').hidden=false;document.querySelector('#search-toggle').setAttribute('aria-expanded','true');document.querySelector('#catalogo').scrollIntoView();search.focus({preventScroll:true})});
const menu=document.querySelector('#menu'),nav=document.querySelector('#nav');function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú')}menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{closeMenu();nav.querySelectorAll('a').forEach(n=>n.classList.toggle('active',n===a))}));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
const dialog=document.querySelector('#detail');document.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>{const p=products[Number(b.dataset.detail)];document.querySelector('#detail-title').textContent=p.name;document.querySelector('#detail-family').textContent=p.family;document.querySelector('#detail-description').textContent=p.description;document.querySelector('#detail-image').style.setProperty('--pos',p.pos);dialog.showModal()}));document.querySelector('#close-detail').onclick=()=>dialog.close();document.querySelector('#back-catalog').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});

// Número comercial público, con opción de configuración por entorno.
const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '18296651314').replace(/[\s()+-]/g, '');
const whatsappMessage = 'Hola estoy interesado en comprar un perfume, vengo de tu pagina';
if (/^[1-9]\d{7,14}$/.test(whatsappNumber)) {
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.removeAttribute('aria-disabled');
  });
}

// Controles propios de la página de catálogo.
const sortControl = document.querySelector('#catalog-sort');
sortControl?.addEventListener('change', () => {
  const cards = [...document.querySelectorAll('.card')];
  const ordered = cards.map((card, index) => ({ card, index, name: products[index].name }));
  if (sortControl.value !== 'selection') ordered.sort((a,b) =>
    a.name.localeCompare(b.name, 'es') * (sortControl.value === 'za' ? -1 : 1));
  ordered.forEach(({card}, order) => card.style.order = order);
});
document.querySelector('#clear-catalog')?.addEventListener('click', () => {
  search.value = ''; document.querySelector('[data-filter="all"]').click(); search.focus();
});
if (document.body.classList.contains('catalog-page') && new URLSearchParams(location.search).has('buscar')) search.focus();
