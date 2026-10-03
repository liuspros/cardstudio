import {qrMatrix} from './qr'
const SH=['rect','ellipse','tri','star','path']
export function bgFill(c,doc){if(!doc.bg2)return doc.bg
 if(doc.bgGtype==='radial'){const cx=doc.bgP1?.x??doc.w/2,cy=doc.bgP1?.y??doc.h/2,ex=doc.bgP2?.x??doc.w,ey=doc.bgP2?.y??doc.h/2,r=Math.max(1,Math.hypot(ex-cx,ey-cy))
  const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,doc.bg);g.addColorStop(1,doc.bg2);return g}
 const p1=doc.bgP1||{x:0,y:doc.h/2},p2=doc.bgP2||{x:doc.w,y:doc.h/2},g=c.createLinearGradient(p1.x,p1.y,p2.x,p2.y);g.addColorStop(0,doc.bg);g.addColorStop(1,doc.bg2);return g}
export function pathP(c,e){const X=q=>e.x+q*e.w,Y=q=>e.y+q*e.h;c.beginPath()
 const one=(p,cl)=>{if(!p.length)return;const seg=(m,n)=>c.bezierCurveTo(X(m.b?m.b[0]:m.x),Y(m.b?m.b[1]:m.y),X(n.a?n.a[0]:n.x),Y(n.a?n.a[1]:n.y),X(n.x),Y(n.y))
  c.moveTo(X(p[0].x),Y(p[0].y));for(let i=1;i<p.length;i++)seg(p[i-1],p[i]);if(cl&&p.length>1){seg(p[p.length-1],p[0]);c.closePath()}}
 one(e.pts,e.closed);(e.more||[]).forEach(m=>one(m.pts,m.closed))}
const POLY={hexagon:[[.25,0],[.75,0],[1,.5],[.75,1],[.25,1],[0,.5]],octagon:[[.3,0],[.7,0],[1,.3],[1,.7],[.7,1],[.3,1],[0,.7],[0,.3]],pentagon:[[.5,0],[1,.38],[.81,1],[.19,1],[0,.38]],diamond:[[.5,0],[1,.5],[.5,1],[0,.5]],tri:[[.5,0],[1,1],[0,1]]}
function P(c,e){const {x,y,w,h}=e,sh=e.t==='photo'?(e.frameShape||'rect'):e.t;c.beginPath()
 if(sh==='path')pathP(c,e)
 else if(sh==='ellipse')c.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,7)
 else if(POLY[sh]){POLY[sh].forEach(([px,py],i)=>{const X=x+px*w,Y=y+py*h;i?c.lineTo(X,Y):c.moveTo(X,Y)});c.closePath()}
 else if(sh==='star'){for(let i=0;i<10;i++){const r=i%2?.4:1,a=-Math.PI/2+i*Math.PI/5;c.lineTo(x+w/2+Math.cos(a)*r*w/2,y+h/2+Math.sin(a)*r*h/2)}c.closePath()}
 else if(sh==='heart'){c.moveTo(x+w/2,y+h*.3);c.bezierCurveTo(x+w/2,y+h*.05,x,y,x,y+h*.35);c.bezierCurveTo(x,y+h*.65,x+w/2,y+h*.8,x+w/2,y+h);c.bezierCurveTo(x+w/2,y+h*.8,x+w,y+h*.65,x+w,y+h*.35);c.bezierCurveTo(x+w,y,x+w/2,y+h*.05,x+w/2,y+h*.3);c.closePath()}
 else if(sh==='shield'){c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y+h*.55);c.quadraticCurveTo(x+w,y+h*.9,x+w/2,y+h);c.quadraticCurveTo(x,y+h*.9,x,y+h*.55);c.closePath()}
 else if(sh==='arch'){const r=Math.min(w/2,h);c.moveTo(x,y+h);c.lineTo(x,y+r);c.ellipse(x+w/2,y+r,w/2,r,0,Math.PI,2*Math.PI);c.lineTo(x+w,y+h);c.closePath()}
 else{const m=Math.min(w,h)/2,rr=sh==='rounded'?[m*.36,m*.36,m*.36,m*.36]:(e.radii||[e.radius||0,e.radius||0,e.radius||0,e.radius||0])
  const[rtl,rtr,rbr,rbl]=rr.map(v=>Math.max(0,Math.min(v,m)))
  c.moveTo(x+rtl,y);c.lineTo(x+w-rtr,y);c.arcTo(x+w,y,x+w,y+rtr,rtr);c.lineTo(x+w,y+h-rbr);c.arcTo(x+w,y+h,x+w-rbr,y+h,rbr)
  c.lineTo(x+rbl,y+h);c.arcTo(x,y+h,x,y+h-rbl,rbl);c.lineTo(x,y+rtl);c.arcTo(x,y,x+rtl,y,rtl);c.closePath()}}
export {P as shapePath}
function wrapLines(c,s,w){const out=[];s.split('\n').forEach(p=>{let l='';p.split(' ').forEach(t=>{const n=l?l+' '+t:t;if(l&&c.measureText(n).width>w){out.push(l);l=t}else l=n});out.push(l)});return out}
function fillOf(c,e){if(!e.fill2)return e.fill
 if(e.gtype==='radial'){const cx=e.x+e.w/2,cy=e.y+e.h/2,r=Math.max(1,Math.max(e.w,e.h)/2*(e.gr||1))
  const g=c.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,e.fill);g.addColorStop(1,e.fill2);return g}
 const a=(e.ang||0)*Math.PI/180,cx=e.x+e.w/2,cy=e.y+e.h/2,d=(Math.abs(Math.cos(a)*e.w)+Math.abs(Math.sin(a)*e.h))/2
 const g=c.createLinearGradient(cx-Math.cos(a)*d,cy-Math.sin(a)*d,cx+Math.cos(a)*d,cy+Math.sin(a)*d);g.addColorStop(0,e.fill);g.addColorStop(1,e.fill2);return g}
function applyXform(c,e){const cx=e.x+e.w/2,cy=e.y+e.h/2;c.translate(cx,cy);if(e.r)c.rotate(e.r*Math.PI/180)
 if(e.skx||e.sky)c.transform(1,Math.tan((e.sky||0)*Math.PI/180),Math.tan((e.skx||0)*Math.PI/180),1,0,0)
 if(e.flipX||e.flipY)c.scale(e.flipX?-1:1,e.flipY?-1:1);c.translate(-cx,-cy)}
export function drawEl(c,e,row,edit,imgs,alpha){c.save();c.globalAlpha=alpha??(e.op??1);applyXform(c,e)
 if(e.t==='clip'){const mk={t:e.mtype,x:e.x,y:e.y,w:e.w,h:e.h,radius:e.mradius,radii:e.mradii,pts:e.mpts,closed:e.mclosed,more:e.mmore,fill:e.mfill,fill2:e.mfill2,gtype:e.mgtype,ang:e.mang,gr:e.mgr}
  P(c,mk);if(mk.fill&&mk.fill!=='none'){c.fillStyle=fillOf(c,mk);c.fill(e.mmore?'evenodd':'nonzero')}
  const ga=c.globalAlpha;c.save();P(c,mk);c.clip();(e.children||[]).forEach(ch=>drawEl(c,ch,row,edit,imgs,(ch.op??1)*ga));c.restore()
  if(e.msw>0){P(c,mk);c.strokeStyle=e.mstroke||'#000000';c.lineWidth=e.msw;c.stroke()}}
 else if(SH.includes(e.t)){P(c,e);if(e.fill!=='none'){c.fillStyle=fillOf(c,e);c.fill(e.rule||(e.more?'evenodd':'nonzero'))}if(e.sw>0){c.strokeStyle=e.stroke||'#000000';c.lineWidth=e.sw;c.stroke()}}
 else if(e.t==='photo'){const i=imgs&&imgs[e.field];P(c,e)
  if(i&&i.complete&&i.naturalWidth>0&&e.w>0&&e.h>0){c.clip();const q=Math.max(e.w/i.naturalWidth,e.h/i.naturalHeight)*(e.czoom||1),dw=i.naturalWidth*q,dh=i.naturalHeight*q
   if(Number.isFinite(dw)&&Number.isFinite(dh)&&dw>0&&dh>0){let dx=e.x+(e.w-dw)/2+(e.cox||0),dy=e.y+(e.h-dh)/2+(e.coy||0)
    dx=Math.min(e.x,Math.max(e.x+e.w-dw,dx));dy=Math.min(e.y,Math.max(e.y+e.h-dh,dy));c.drawImage(i,dx,dy,dw,dh)}}
  else if(edit){c.fillStyle='#d9d6cf';c.fill();c.fillStyle='#8a877d';c.font='36px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('PHOTO',e.x+e.w/2,e.y+e.h/2)}}
 else if(e.t==='image'){const i=imgs&&imgs['#'+e.id];if(i&&i.complete&&i.naturalWidth>0&&e.w>0&&e.h>0)c.drawImage(i,e.x,e.y,e.w,e.h)}
 else if(e.t==='qr'){const q=qrTexts(e,row);drawQR(c,e,q.txt,q.cap,edit)}
 else if(e.t==='text'){c.beginPath();c.rect(e.x,e.y,e.w,e.h);c.clip();let s=e.field&&row?String(row[e.field]??''):e.text
  if(e.case==='upper')s=s.toUpperCase();else if(e.case==='lower')s=s.toLowerCase();else if(e.case==='title')s=s.replace(/\S+/g,w=>w[0].toUpperCase()+w.slice(1).toLowerCase())
  const align=e.align||'left',ax=align==='left'?e.x:align==='center'?e.x+e.w/2:e.x+e.w,lh=e.lh||1.2
  c.fillStyle=e.color2?fillOf(c,{x:e.x,y:e.y,w:e.w,h:e.h,fill:e.color,fill2:e.color2,gtype:e.gtype,ang:e.ang,gr:e.gr}):e.color
  c.textBaseline='top';c.textAlign=align;let z=e.size,L
  const f=z=>`${e.bold?'bold ':''}${z}px ${e.font||'Arial'}`
  for(;;){c.font=f(z);try{c.letterSpacing=(e.ls||0)+'px'}catch{};L=e.wrap?wrapLines(c,s,e.w):[s.replace(/\n/g,' ')]
   if((L.every(l=>c.measureText(l).width<=e.w)&&L.length*z*lh<=e.h+.5)||z<=e.size*.35)break;z-=Math.max(.5,e.size*.03)}
  if(!e.wrap){let t=L[0];if(c.measureText(t).width>e.w){while(t.length>1&&c.measureText(t+'…').width>e.w)t=t.slice(0,-1);L=[t+'…']}}
  else L=L.slice(0,Math.max(1,Math.floor(e.h/(z*lh))))
  const y0=e.y+(e.wrap?0:(e.h-L.length*z*lh)/2);L.forEach((l,i)=>c.fillText(l,ax,y0+i*z*lh))}
 c.restore()}
function drawOne(c,e,row,edit,imgs,alpha){c.save();if(e.blur>0){const t=c.getTransform(),s=Math.hypot(t.a,t.b)||1;c.filter=`blur(${e.blur*s}px)`}
 drawEl(c,e,row,edit,imgs,alpha);c.restore()}
export function draw(c,doc,row,edit,imgs){
 c.fillStyle=bgFill(c,doc);c.fillRect(0,0,doc.w,doc.h)
 for(const e of doc.els){
  if(e.mblur>0){const n=12,a=(e.mang||0)*Math.PI/180,ux=Math.cos(a),uy=Math.sin(a),base=e.op??1
   for(let i=0;i<n;i++){const t=(i/(n-1)-.5)*e.mblur;c.save();c.translate(ux*t,uy*t);drawOne(c,e,row,edit,imgs,base/n);c.restore()}}
  else drawOne(c,e,row,edit,imgs,e.op??1)}}

// ---- QR codes ----
export function qrTexts(e,row){const r=row||{}
 return{txt:String(e.field?(r[e.field]??''):(e.url||'')).trim(),cap:String(e.capField?(r[e.capField]??''):(e.caption||'')).trim()}}
export function drawQR(c,e,txt,cap,edit){
 const {x,y,w,h}=e,m=Math.min(w,h),pad=m*.06,capH=cap?m*.15:0,gap=cap?pad*.6:0,ga=c.globalAlpha
 c.save()
 if(e.qbg&&e.qbg!=='none'){c.fillStyle=e.qbg;c.fillRect(x,y,w,h)}
 let t=txt,sample=false;if(!t&&edit){t='https://example.com';sample=true}
 const mat=t?qrMatrix(t,e.ecl||'M'):null
 const qs=Math.max(4,Math.min(w-2*pad,h-2*pad-capH-gap)),qx=x+(w-qs)/2,qy=y+pad
 if(mat){c.globalAlpha=ga*(sample?.3:1);c.fillStyle=e.qcolor||'#12492f';c.beginPath()
  const n=mat.n,cell=qs/n;for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(mat.dark(r,k))c.rect(qx+k*cell,qy+r*cell,cell,cell)
  c.fill();c.globalAlpha=ga}
 else if(edit&&t){c.strokeStyle='#999';c.setLineDash([6,4]);c.strokeRect(qx,qy,qs,qs);c.setLineDash([]);c.fillStyle='#999';c.font=`${Math.max(8,qs*.1)}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText('Link too long',qx+qs/2,qy+qs/2)}
 if(cap){const T=cap.toUpperCase();c.fillStyle=e.qcolor||'#12492f';c.textAlign='center';c.textBaseline='top';let z=capH*.85
  do{c.font=`700 ${z}px ${e.font||'Arial'}`;z-=.5}while(c.measureText(T).width>w-2*pad&&z>3)
  c.fillText(T,x+w/2,qy+qs+gap+(capH-z)*.3)}
 c.restore()}
