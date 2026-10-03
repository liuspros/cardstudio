import JSZip from 'jszip'
import {draw} from './render'
const V=1
const migrate=j=>j // future: upgrade older versions here
export async function packProject(doc,rows,photos,back){
 const z=new JSZip(),by=new Map();for(const [k,u] of Object.entries(photos)){if(!by.has(u))by.set(u,[]);by.get(u).push(k)}
 const list=[];let n=0
 for(const [u,names] of by){const b=await (await fetch(u)).blob(),ext=(names.find(x=>x.includes('.'))||'.jpg').split('.').pop(),file=`assets/${n++}.${ext}`;z.file(file,b);list.push({file,names})}
 z.file('project.json',JSON.stringify({format:'card-studio',version:V,doc,back:back||null,rows,photos:list}))
 const c=document.createElement('canvas'),k=400/doc.w;c.width=400;c.height=Math.round(doc.h*k);const x=c.getContext('2d');x.setTransform(k,0,0,k,0,0);draw(x,doc,rows[0]||{},false,{})
 z.file('preview.png',await new Promise(r=>c.toBlob(r)))
 return z.generateAsync({type:'blob',compression:'DEFLATE'})}
export async function unpackProject(file){try{const z=await JSZip.loadAsync(file),f=z.file('project.json');if(!f)return null
 let j=JSON.parse(await f.async('string'));if(j.format!=='card-studio'||j.version>V)return null;j=migrate(j)
 const photos={};for(const p of j.photos||[]){const u=URL.createObjectURL(await z.file(p.file).async('blob'));p.names.forEach(n=>{photos[n]=u})}
 return{doc:j.doc,back:j.back||null,rows:j.rows||[],photos}}catch{return null}}
const db=()=>new Promise((r,j)=>{const q=indexedDB.open('card-studio',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})
export const idbPut=async(k,v)=>{const d=await db();return new Promise(r=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>r()})}
export const idbGet=async k=>{const d=await db();return new Promise(r=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result)})}
