export const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/,'');
export async function api(path,{token,signal,...options}={}){
 const response=await fetch(API+path,{...options,signal,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Object.assign(new Error(data.message||'No se pudo completar la solicitud.'),{status:response.status,code:data.code});
 return data;
}
export const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = cents => new Intl.NumberFormat('es-DO',{style:'currency',currency:'DOP'}).format(cents/100);
export const safeImage = value => {try{return new URL(value).protocol==='https:'?value:'';}catch{return '';}};
export function whatsapp(message){const phone=(import.meta.env.VITE_WHATSAPP_NUMBER||'18296651314').replace(/[^0-9]/g,'');return `https://wa.me/${/^[1-9]\d{7,14}$/.test(phone)?phone:'18296651314'}?text=${encodeURIComponent(message)}`;}
