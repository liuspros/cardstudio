import {draw} from './render'
export const stem=s=>s.toLowerCase().replace(/\.[a-z0-9]+$/,'')
export const fields=doc=>{const s={},o=[]
 const walk=e=>{if(e.field&&!s[e.field]){s[e.field]=1;o.push({n:e.field,p:e.t==='photo'})}
  if(e.capField&&!s[e.capField]){s[e.capField]=1;o.push({n:e.capField,p:false})}
  if(e.t==='clip')(e.children||[]).forEach(walk)}
 doc.els.forEach(walk);return o}
export const setPhoto=(p,n,u)=>{p[n.toLowerCase()]=u;p[stem(n)]=u;return p}
export function photoURL(r,f,photos){const v=String(r[f]||'').trim()
 if(v)return photos[v.toLowerCase()]||photos[stem(v)]||null
 for(const k in r)if(k!==f&&r[k]){const u=photos[stem(String(r[k]))];if(u)return u}return null}
export const loadImg=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u})
export async function collectImgs(doc,row,photos){const imgs={}
 const grab=async e=>{if(e.t==='photo'&&e.field){const u=photoURL(row,e.field,photos);if(u)imgs[e.field]=await loadImg(u)}
  if(e.t==='image')imgs['#'+e.id]=imgs['#'+e.id]||await loadImg(e.src)
  if(e.t==='clip')for(const ch of e.children||[])await grab(ch)}
 for(const e of doc.els)await grab(e);return imgs}
export function save(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
export async function exportPDF(doc,rows,photos,{dpi,sheet},prog){
 const {jsPDF}=await import('jspdf'),W=doc.w,H=doc.h,mw=W/10,mh=H/10,k=dpi/254,o=mw>mh?'l':'p',m=10,g=3
 let cols=1,rw=1;if(sheet){cols=Math.floor((210-2*m+g)/(mw+g));rw=Math.floor((297-2*m+g)/(mh+g));if(cols<1||rw<1)sheet=false}
 const pdf=sheet?new jsPDF({unit:'mm',format:'a4'}):new jsPDF({unit:'mm',format:[mw,mh],orientation:o}),per=cols*rw
 const c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);const x=c.getContext('2d')
 for(let i=0;i<rows.length;i++){prog(i+1);const imgs=await collectImgs(doc,rows[i],photos)
  x.setTransform(k,0,0,k,0,0);draw(x,doc,rows[i],false,imgs);const d=c.toDataURL('image/jpeg',.92)
  if(sheet){const j=i%per;if(i&&!j)pdf.addPage();const px=(210-(cols*mw+(cols-1)*g))/2+(j%cols)*(mw+g),py=m+Math.floor(j/cols)*(mh+g)
   pdf.addImage(d,'JPEG',px,py,mw,mh);pdf.setDrawColor(190);pdf.setLineWidth(.1);pdf.rect(px,py,mw,mh)}
  else{if(i)pdf.addPage([mw,mh],o);pdf.addImage(d,'JPEG',0,0,mw,mh)}
  if(i%4===3)await new Promise(r=>setTimeout(r))}
 save('cards.pdf',pdf.output('blob'))}
