import {fromAbs,toPath,normOf} from './path'
const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]]
const ap=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]
function tf(str){let m=[1,0,0,1,0,0];for(const [,f,a] of (str||'').matchAll(/(\w+)\s*\(([^)]*)\)/g)){const v=a.split(/[\s,]+/).filter(Boolean).map(Number);let t
 if(f==='translate')t=[1,0,0,1,v[0],v[1]||0];else if(f==='scale')t=[v[0],0,0,v[1]??v[0],0,0]
 else if(f==='rotate'){const r=v[0]*Math.PI/180,co=Math.cos(r),sn=Math.sin(r);t=[co,sn,-sn,co,0,0];if(v.length>2)t=mul(mul([1,0,0,1,v[1],v[2]],t),[1,0,0,1,-v[1],-v[2]])}
 else if(f==='matrix')t=v;else if(f==='skewX')t=[1,0,Math.tan(v[0]*Math.PI/180),1,0,0];else if(f==='skewY')t=[1,Math.tan(v[0]*Math.PI/180),0,1,0,0];else continue
 m=mul(m,t)}return m}
function arc(x1,y1,rx,ry,phi,fa,fs,x2,y2){if(!rx||!ry||(x1===x2&&y1===y2))return[[[x1,y1],[x2,y2],x2,y2]]
 rx=Math.abs(rx);ry=Math.abs(ry);const p=phi*Math.PI/180,c=Math.cos(p),s=Math.sin(p),dx=(x1-x2)/2,dy=(y1-y2)/2,xp=c*dx+s*dy,yp=-s*dx+c*dy
 const l=xp*xp/(rx*rx)+yp*yp/(ry*ry);if(l>1){rx*=Math.sqrt(l);ry*=Math.sqrt(l)}
 const sg=fa===fs?-1:1,co=sg*Math.sqrt(Math.max(0,(rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp)/(rx*rx*yp*yp+ry*ry*xp*xp))),cxp=co*rx*yp/ry,cyp=-co*ry*xp/rx
 const cx=c*cxp-s*cyp+(x1+x2)/2,cy=s*cxp+c*cyp+(y1+y2)/2,an=(ux,uy,vx,vy)=>Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy)
 const t1=an(1,0,(xp-cxp)/rx,(yp-cyp)/ry);let dt=an((xp-cxp)/rx,(yp-cyp)/ry,(-xp-cxp)/rx,(-yp-cyp)/ry)
 if(!fs&&dt>0)dt-=2*Math.PI;if(fs&&dt<0)dt+=2*Math.PI
 const n=Math.ceil(Math.abs(dt)/(Math.PI/2)),d=dt/n,k=4/3*Math.tan(d/4),out=[]
 const pt=t=>[c*rx*Math.cos(t)-s*ry*Math.sin(t)+cx,s*rx*Math.cos(t)+c*ry*Math.sin(t)+cy],dv=t=>[-c*rx*Math.sin(t)-s*ry*Math.cos(t),-s*rx*Math.sin(t)+c*ry*Math.cos(t)]
 for(let j=0;j<n;j++){const a=t1+j*d,b=a+d,p0=pt(a),p3=pt(b),d0=dv(a),d1=dv(b);out.push([[p0[0]+k*d0[0],p0[1]+k*d0[1]],[p3[0]-k*d1[0],p3[1]-k*d1[1]],p3[0],p3[1]])}
 return out}
function parseD(d){const T=d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g)||[],subs=[],isC=t=>/^[A-Za-z]$/.test(t)
 let i=0,cmd,x=0,y=0,sx=0,sy=0,cur=null,lc=null,lq=null
 const num=()=>parseFloat(T[i++])
 const mv=(px,py)=>{cur={n:[{x:px,y:py}],closed:false};subs.push(cur);x=sx=px;y=sy=py}
 const cubic=(c1,c2,px,py)=>{cur.n[cur.n.length-1].b=c1;cur.n.push({x:px,y:py,a:c2});x=px;y=py;lc=c2;lq=null}
 const line=(px,py)=>{cur.n.push({x:px,y:py});x=px;y=py;lc=lq=null}
 while(i<T.length){if(isC(T[i]))cmd=T[i++];if(!cmd)break;const r=cmd===cmd.toLowerCase(),C=cmd.toUpperCase(),ox=r?x:0,oy=r?y:0
  if(C==='Z'){if(cur){cur.closed=true;x=sx;y=sy;cur=null}continue}
  if(C==='M'){mv(num()+ox,num()+oy);cmd=r?'l':'L';continue}
  if(!cur)mv(x,y)
  if(C==='L')line(num()+ox,num()+oy)
  else if(C==='H')line(num()+ox,y)
  else if(C==='V')line(x,num()+oy)
  else if(C==='C'){const a=[num()+ox,num()+oy],b=[num()+ox,num()+oy];cubic(a,b,num()+ox,num()+oy)}
  else if(C==='S'){const a=lc?[2*x-lc[0],2*y-lc[1]]:[x,y],b=[num()+ox,num()+oy];cubic(a,b,num()+ox,num()+oy)}
  else if(C==='Q'||C==='T'){const q=C==='Q'?[num()+ox,num()+oy]:(lq?[2*x-lq[0],2*y-lq[1]]:[x,y]),px=num()+ox,py=num()+oy,x0=x,y0=y
   cubic([x0+2/3*(q[0]-x0),y0+2/3*(q[1]-y0)],[px+2/3*(q[0]-px),py+2/3*(q[1]-py)],px,py);lq=q}
  else if(C==='A'){const rx=num(),ry=num(),rot=num(),fa=num(),fs=num(),px=num()+ox,py=num()+oy;arc(x,y,rx,ry,rot,fa,fs,px,py).forEach(s=>cubic(s[0],s[1],s[2],s[3]))}
  else i++}
 return subs}
const cc=typeof document!=='undefined'?document.createElement('canvas').getContext('2d'):null
function col(v){if(!v||v==='none')return null;cc.fillStyle='#000000';cc.fillStyle=v;const r=cc.fillStyle;if(r[0]==='#')return{h:r,a:1};const m=r.match(/[\d.]+/g).map(Number);return{h:'#'+m.slice(0,3).map(q=>Math.round(q).toString(16).padStart(2,'0')).join(''),a:m[3]??1}}
const st=(el,k,p)=>{const m=(el.getAttribute('style')||'').match(new RegExp('(?:^|;)\\s*'+k+'\\s*:\\s*([^;]+)'));return m?m[1].trim():(el.getAttribute(k)??p?.[k])}
const sty=(el,p)=>Object.fromEntries(['fill','stroke','stroke-width','fill-opacity','font-size'].map(k=>[k,st(el,k,p)]))
function grad(svg,u){const id=(u.match(/#([^)'" ]+)/)||[])[1],g=id&&svg.querySelector('[id="'+id+'"]');if(!g)return null
 let sg=g;const h=g.getAttribute('href')||g.getAttribute('xlink:href');if(!g.querySelector('stop')&&h)sg=svg.querySelector('[id="'+h.slice(1)+'"]')||g
 const S=[...sg.querySelectorAll('stop')];if(!S.length)return null;const sc=s=>col(st(s,'stop-color',null)||'#000000')?.h||'#000000'
 const f=a=>parseFloat(g.getAttribute(a)),x1=f('x1')||0,y1=f('y1')||0,x2=isNaN(f('x2'))?1:f('x2'),y2=f('y2')||0
 return{c1:sc(S[0]),c2:sc(S[S.length-1]),ang:Math.round(Math.atan2(y2-y1,x2-x1)*180/Math.PI)}}
function props(S,M,op,svg){let fill='#000000',fo=1;const sf=S.fill??'black',o={}
 if(sf==='none')fill='none';else if(sf.startsWith('url(')){const g=grad(svg,sf);if(g){fill=g.c1;o.fill2=g.c2;o.ang=g.ang}}else{const c=col(sf);if(c){fill=c.h;fo=c.a}}
 o.fill=fill;o.op=Math.min(1,op*fo*(parseFloat(S['fill-opacity']??1)||1))
 const sc=col(S.stroke);if(sc){o.stroke=sc.h;o.sw=(parseFloat(S['stroke-width']??1)||1)*Math.sqrt(Math.abs(M[0]*M[3]-M[1]*M[2]))}
 return o}
const SKIP=['defs','symbol','clipPath','mask','linearGradient','radialGradient','style','title','desc','metadata','pattern','filter','marker']
export function importSVG(text,doc,nid){
 const xd=new DOMParser().parseFromString(text,'image/svg+xml'),svg=xd.documentElement
 if(svg.nodeName!=='svg'||xd.querySelector('parsererror'))return null
 let vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);if(vb.length<4||vb.some(isNaN))vb=[0,0,parseFloat(svg.getAttribute('width'))||100,parseFloat(svg.getAttribute('height'))||100]
 const s=Math.min(doc.w/vb[2],doc.h/vb[3]),M0=[s,0,0,s,(doc.w-vb[2]*s)/2-vb[0]*s,(doc.h-vb[3]*s)/2-vb[1]*s],out=[]
 const box=(M,a,b,c,d)=>{const p=ap(M,a,b),q=ap(M,c,d);return{x:Math.min(p[0],q[0]),y:Math.min(p[1],q[1]),w:Math.abs(q[0]-p[0]),h:Math.abs(q[1]-p[1])}}
 const walk=(el,pM,p,pop)=>{for(const k of el.children){const n=k.nodeName.replace(/^.*:/,'');if(SKIP.includes(n)||st(k,'display',null)==='none'||out.length>1200)continue
  const M=mul(pM,tf(k.getAttribute('transform'))),S=sty(k,p),op=pop*(parseFloat(k.getAttribute('opacity')??1)||1),num=a=>parseFloat(k.getAttribute(a))||0
  if(n==='g'||n==='a'||n==='svg'){walk(k,M,S,op);continue}
  const sp=props(S,M,op,svg),ax=!M[1]&&!M[2];let subs=null
  if(n==='path')subs=parseD(k.getAttribute('d')||'')
  else if(n==='rect'){const X=num('x'),Y=num('y'),w=num('width'),h=num('height')
   if(ax){out.push({t:'rect',...box(M,X,Y,X+w,Y+h),radius:(num('rx')||num('ry'))*Math.abs(M[0]),...sp});continue}
   subs=[{n:[[X,Y],[X+w,Y],[X+w,Y+h],[X,Y+h]].map(([a,b])=>({x:a,y:b})),closed:true}]}
  else if(n==='circle'||n==='ellipse'){const cx=num('cx'),cy=num('cy'),rx=n==='circle'?num('r'):num('rx'),ry=n==='circle'?num('r'):num('ry')
   if(ax){out.push({t:'ellipse',...box(M,cx-rx,cy-ry,cx+rx,cy+ry),...sp});continue}
   subs=[{n:toPath({t:'ellipse',x:cx-rx,y:cy-ry,w:2*rx,h:2*ry}),closed:true}]}
  else if(n==='polygon'||n==='polyline'||n==='line'){const v=n==='line'?[num('x1'),num('y1'),num('x2'),num('y2')]:(k.getAttribute('points')||'').split(/[\s,]+/).filter(Boolean).map(Number),P=[]
   for(let i=0;i+1<v.length;i+=2)P.push({x:v[i],y:v[i+1]});subs=[{n:P,closed:n==='polygon'}]}
  else if(n==='text'){const sz=(parseFloat(S['font-size'])||16)*Math.hypot(M[0],M[1]),t=k.textContent.trim().replace(/\s+/g,' '),a=ap(M,num('x'),num('y'))
   if(t)out.push({t:'text',text:t,size:sz,color:sp.fill==='none'?'#000000':sp.fill,x:a[0],y:a[1]-sz,w:Math.max(20,t.length*sz*.6),h:sz*1.3,op:sp.op});continue}
  if(subs){const C=[];for(const sb of subs){if(sb.closed&&sb.n.length>2){const f=sb.n[0],l=sb.n[sb.n.length-1];if(Math.hypot(f.x-l.x,f.y-l.y)<1e-6){if(l.a)f.a=l.a;sb.n.pop()}}
   if(sb.n.length<2)continue
   C.push({closed:sb.closed||sp.fill!=='none',A:sb.n.map(q=>{const r=ap(M,q.x,q.y),f=v=>v&&ap(M,v[0],v[1]);return{x:r[0],y:r[1],a:f(q.a),b:f(q.b)}})})}
   if(C.length){const bb=fromAbs(C.flatMap(c=>c.A));out.push({t:'path',closed:C[0].closed,x:bb.x,y:bb.y,w:bb.w,h:bb.h,pts:normOf(C[0].A,bb),more:C.length>1?C.slice(1).map(c=>({closed:c.closed,pts:normOf(c.A,bb)})):undefined,rule:st(k,'fill-rule',null)||'nonzero',...sp})}}}}
 walk(svg,M0,{},1)
 const g=out.length>1?'g'+nid():undefined;out.forEach(e=>{e.id=nid();if(g)e.g=g});return out}
const place=(src,w,h,doc)=>{const s=Math.min(doc.w/w,doc.h/h);return{src,x:(doc.w-w*s)/2,y:(doc.h-h*s)/2,w:w*s,h:h*s}}
const rd=f=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f)})
export async function importImage(f,doc){const u=await rd(f),im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=u}),k=Math.min(1,2000/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas')
 c.width=im.naturalWidth*k;c.height=im.naturalHeight*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height)
 return place(c.toDataURL(f.type==='image/png'?'image/png':'image/jpeg',.9),c.width,c.height,doc)}
export async function importPDF(f,doc){const pdfjs=await import('pdfjs-dist/build/pdf');pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/'+pdfjs.version+'/pdf.worker.min.js'
 const pdf=await pdfjs.getDocument({data:await f.arrayBuffer()}).promise;let n=1
 if(pdf.numPages>1){n=parseInt(prompt(`This PDF has ${pdf.numPages} pages. Which page to import?`,'1'))||0;if(n<1||n>pdf.numPages)return null}
 const pg=await pdf.getPage(n),v1=pg.getViewport({scale:1}),vp=pg.getViewport({scale:Math.min(2400/Math.max(v1.width,v1.height),3)}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height
 await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;return place(c.toDataURL('image/jpeg',.88),c.width,c.height,doc)}
export async function importPSD(f,doc,nid){const {readPsd}=await import('ag-psd'),psd=readPsd(await f.arrayBuffer(),{skipCompositeImageData:true,skipThumbnail:true}),s=Math.min(doc.w/psd.width,doc.h/psd.height),ox=(doc.w-psd.width*s)/2,oy=(doc.h-psd.height*s)/2,out=[]
 const hx=c=>'#'+[c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')
 const walk=(list,g)=>{for(const l of list||[]){if(l.hidden||out.length>300)continue
  if(l.children){walk(l.children,'g'+nid());continue}
  const w=(l.right-l.left)*s,h=(l.bottom-l.top)*s,base={id:nid(),g,x:ox+l.left*s,y:oy+l.top*s,w,h,op:l.opacity??1}
  if(l.text&&l.text.text){const st=l.text.style||{},sz=(st.fontSize||24)*(l.text.transform?.[3]||1)*s
   out.push({...base,t:'text',text:l.text.text.replace(/\r/g,' '),size:sz,color:hx(st.fillColor||{r:0,g:0,b:0}),bold:/bold/i.test(st.font?.name||''),font:'Arial',h:Math.max(h,sz*1.3)});continue}
  if(l.canvas&&w>0&&h>0){const k=Math.min(1,2000/Math.max(l.canvas.width,l.canvas.height));let cv=l.canvas
   if(k<1){cv=document.createElement('canvas');cv.width=l.canvas.width*k;cv.height=l.canvas.height*k;cv.getContext('2d').drawImage(l.canvas,0,0,cv.width,cv.height)}
   out.push({...base,t:'image',src:cv.toDataURL('image/png')})}}}
 walk(psd.children,undefined);return out}
