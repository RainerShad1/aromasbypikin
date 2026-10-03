import { whatsapp } from './api.js';
const menu=document.querySelector('#menu'),nav=document.querySelector('#nav');
function close(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');}
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
document.querySelectorAll('[data-whatsapp]').forEach(a=>{a.href=whatsapp('Hola estoy interesado en comprar un perfume, vengo de tu pagina');});
document.querySelector('#search-toggle')?.addEventListener('click',()=>{if(!document.body.classList.contains('catalog-page')){location.href='/catalogo/?buscar=1';return;}document.querySelector('#search')?.focus();document.querySelector('#catalogo')?.scrollIntoView();});
