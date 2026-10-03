import {draw} from './render'
import {collectImgs,save} from './data'
function cmykApprox(id){const d=id.data
 for(let i=0;i<d.length;i+=4){const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,k=1-Math.max(r,g,b)
  if(k>=1){d[i]=d[i+1]=d[i+2]=0;continue}
  const c=(1-r-k)/(1-k),m=(1-g-k)/(1-k),y=(1-b-k)/(1-k)
  d[i]=Math.round(255*(1-c)*(1-k));d[i+1]=Math.round(255*(1-m)*(1-k));d[i+2]=Math.round(255*(1-y)*(1-k))}
 return id}
export async function renderCard(doc,row,photos,pxPerUnit){
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(doc.w*pxPerUnit));c.height=Math.max(1,Math.round(doc.h*pxPerUnit))
 const x=c.getContext('2d');x.setTransform(pxPerUnit,0,0,pxPerUnit,0,0)
 draw(x,doc,row,false,await collectImgs(doc,row,photos));return c}
async function toBlob(canvas,{format,quality,cmyk}){
 if(cmyk){const x=canvas.getContext('2d'),id=x.getImageData(0,0,canvas.width,canvas.height);x.putImageData(cmykApprox(id),0,0)}
 const mime=format==='png'?'image/png':'image/jpeg'
 return new Promise(r=>canvas.toBlob(r,mime,format==='jpeg'?quality/100:undefined))}
export async function exportRaster(doc,targetRows,photos,opts){
 const pxPerUnit=opts.dpi/254,ext=opts.format==='png'?'png':'jpg',rows=targetRows.length?targetRows:[{}],blobs=[]
 for(const row of rows)blobs.push(await toBlob(await renderCard(doc,row,photos,pxPerUnit),opts))
 if(blobs.length===1)save(`card.${ext}`,blobs[0])
 else{const JSZip=(await import('jszip')).default,zip=new JSZip();blobs.forEach((b,i)=>zip.file(`card-${i+1}.${ext}`,b));save('cards.zip',await zip.generateAsync({type:'blob'}))}}
export async function exportFrontBack(frontDoc,backDoc,targetRows,photos,opts){
 const JSZip=(await import('jszip')).default,pxPerUnit=opts.dpi/254,ext=opts.format==='png'?'png':'jpg',rows=targetRows.length?targetRows:[{}]
 if(rows.length===1){const zip=new JSZip()
  zip.file(`front.${ext}`,await toBlob(await renderCard(frontDoc,rows[0],photos,pxPerUnit),opts))
  zip.file(`back.${ext}`,await toBlob(await renderCard(backDoc,rows[0],photos,pxPerUnit),opts))
  save('id-card.zip',await zip.generateAsync({type:'blob'}));return}
 const mother=new JSZip()
 for(let i=0;i<rows.length;i++){const inner=new JSZip()
  inner.file(`front.${ext}`,await toBlob(await renderCard(frontDoc,rows[i],photos,pxPerUnit),opts))
  inner.file(`back.${ext}`,await toBlob(await renderCard(backDoc,rows[i],photos,pxPerUnit),opts))
  mother.file(`card-${i+1}.zip`,await inner.generateAsync({type:'blob'}))}
 save('id-cards.zip',await mother.generateAsync({type:'blob'}))}
