import {useEffect,useRef,useState,useCallback} from 'react'
import {draw,pathP} from '../lib/render'
import {importSVG,importPDF,importImage,importPSD} from '../lib/import'
import {booleanOp} from '../lib/bool'
import {traceImage,TRACE_PRESETS} from '../lib/trace'
import {toPath,fromAbs,absOf,bez,splitSeg,rotA} from '../lib/path'
import DataDrawer from './DataDrawer'
import Icon from './Icons'
import PhotoAdjuster from './PhotoAdjuster'
import {exportRaster,exportFrontBack} from '../lib/rasterExport'
import {photoURL,save as dlFile} from '../lib/data'
import {packProject,unpackProject,idbPut,idbGet} from '../lib/project'
const start={w:856,h:540,bg:'#ffffff',guides:[],els:[
{id:1,t:'rect',x:0,y:0,w:856,h:110,fill:'#0f6b5c',fill2:'#0b4a40',ang:0},
{id:2,t:'photo',x:40,y:150,w:240,h:300,field:'Photo',radius:20},
{id:3,t:'text',x:310,y:170,w:506,h:70,text:'Full Name',size:56,color:'#111111',bold:true,field:'Name'},
{id:4,t:'text',x:310,y:260,w:506,h:50,text:'Role',size:36,color:'#555555',field:'Role'}]}
const rows0=[{Name:'Amaka Obi',Role:'Designer'},{Name:'Tola Bello',Role:'Manager'}]
const R=24,SH=['rect','ellipse','tri','star','path'],FT=[{description:'Card Studio project',accept:{'application/zip':['.cstudio']}}]
const DEF={text:{t:'text',w:400,h:60,text:'Text',size:40,color:'#111111',align:'left',wrap:false},photo:{t:'photo',w:240,h:300,field:'Photo',radius:0},rect:{t:'rect',w:300,h:100,fill:'#0f6b5c',radius:0},ellipse:{t:'ellipse',w:240,h:240,fill:'#0f6b5c'},tri:{t:'tri',w:240,h:220,fill:'#0f6b5c'},star:{t:'star',w:260,h:260,fill:'#e0a800'},qr:{t:'qr',w:220,h:260,qcolor:'#12492f',qbg:'#ffffff',url:'https://example.com',caption:'',ecl:'M'}}
const FONTS=['Arial','Georgia','Verdana','Trebuchet MS','Times New Roman','Courier New','Impact','Poppins','Lexend','Inter','Montserrat','Open Sans','Raleway','Playfair Display','Merriweather','DM Sans','Work Sans','Oswald','Nunito','Product Sans']
const UNITS={mm:10,cm:100,in:254,pt:254/72,px:254/96}
const PRESETS=[['CR80 landscape',856,540],['CR80 portrait',540,856],['A6 landscape',1480,1050],['A5 landscape',2100,1480],['A4 landscape',2970,2100],['A4 portrait',2100,2970]]
const rotP=(e,x,y)=>{const cx=e.x+e.w/2,cy=e.y+e.h/2,r=(e.r||0)*Math.PI/180,co=Math.cos(r),sn=Math.sin(r);return{x:cx+(x-cx)*co-(y-cy)*sn,y:cy+(x-cx)*sn+(y-cy)*co}}
const handlePts=e=>{const {x,y,w,h}=e,cx=x+w/2,cy=y+h/2;return{tl:rotP(e,x,y),tr:rotP(e,x+w,y),bl:rotP(e,x,y+h),br:rotP(e,x+w,y+h),t:rotP(e,cx,y),b:rotP(e,cx,y+h),l:rotP(e,x,cy),r:rotP(e,x+w,cy)}}
const loc=(e,p)=>{const cx=e.x+e.w/2,cy=e.y+e.h/2,r=-(e.r||0)*Math.PI/180,co=Math.cos(r),sn=Math.sin(r),dx=p.x-cx,dy=p.y-cy;return{x:cx+dx*co-dy*sn,y:cy+dx*sn+dy*co}}
const inside=(e,p)=>{const q=loc(e,p);return q.x>=e.x&&q.x<=e.x+e.w&&q.y>=e.y&&q.y<=e.y+e.h}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
const groupBBox=(doc,ids)=>{const S=doc.els.filter(e=>ids.includes(e.id)),x0=Math.min(...S.map(e=>e.x)),y0=Math.min(...S.map(e=>e.y));return{x:x0,y:y0,w:Math.max(...S.map(e=>e.x+e.w))-x0,h:Math.max(...S.map(e=>e.y+e.h))-y0}}
const bboxHandles=b=>({tl:{x:b.x,y:b.y},tr:{x:b.x+b.w,y:b.y},bl:{x:b.x,y:b.y+b.h},br:{x:b.x+b.w,y:b.y+b.h},t:{x:b.x+b.w/2,y:b.y},b:{x:b.x+b.w/2,y:b.y+b.h},l:{x:b.x,y:b.y+b.h/2},r:{x:b.x+b.w,y:b.y+b.h/2}})
const getRadii=e=>e.radii||[e.radius||0,e.radius||0,e.radius||0,e.radius||0]
export default function Editor(){
 const [doc,setDoc]=useState(start),[ids,setIds]=useState([]),[cur,setCur]=useState(0),[view,setView]=useState({z:.8,x:80,y:60}),[tool,setTool]=useState('sel'),[mode,setMode]=useState('scale'),[band,setBand]=useState(null)
 const [rows,setRows]=useState(rows0),[photos,setPhotos]=useState({}),[tick,setTick]=useState(0),IC=useRef({}),H=useRef({u:[],r:[]}),clip=useRef([]),drag=useRef(null),space=useRef(false)
 const [pageMenu,setPageMenu]=useState(false),[traceMenu,setTraceMenu]=useState(false),[busy,setBusy]=useState(''),[unit,setUnit]=useState('mm'),[editText,setEditText]=useState(null),[drawerH,setDrawerH]=useState(208),[exportOpen,setExportOpen]=useState(false),[rCtx,setRCtx]=useState(null),[placing,setPlacing]=useState(null),[editPhoto,setEditPhoto]=useState(null),[side,setSide]=useState('front'),[hasBack,setHasBack]=useState(false),[newDialogOpen,setNewDialogOpen]=useState(false),[exFmt,setExFmt]=useState('png'),[exDpi,setExDpi]=useState(300),[exQ,setExQ]=useState(90),[exCmyk,setExCmyk]=useState(false),[exScope,setExScope]=useState('current')
 const toDisp=v=>{const n=(v||0)/UNITS[unit];return Number.isFinite(n)?+n.toFixed(unit==='px'?0:2):0},toInt=v=>{const n=(parseFloat(v)||0)*UNITS[unit];return Number.isFinite(n)?n:0}
 const cv=useRef(),rt=useRef(),rl=useRef(),box=useRef(),nid=useRef(100),sidesRef=useRef({front:null,back:null})
 const selId=ids[ids.length-1]??null,sel=doc.els.find(e=>e.id===selId),setSel=id=>setIds(id==null?[]:[id]),guides=doc.guides||[]
 useEffect(()=>{if(ids.length!==1)setMode('scale')},[ids])
 const commit=useCallback(fn=>{H.current.u.push(doc);H.current.r=[];setDoc(fn(doc))},[doc])
 const snapH=()=>{H.current.u.push(doc);H.current.r=[]}
 const upd=(id,p)=>commit(d=>({...d,els:d.els.map(e=>e.id===id?{...e,...p}:e)}))
 const mapSel=f=>commit(d=>({...d,els:d.els.map(e=>ids.includes(e.id)?{...e,...f(e)}:e)}))
 const add=t=>{const e={id:nid.current++,x:60,y:60,...DEF[t]};commit(d=>({...d,els:[...d.els,e]}));setSel(e.id);setTool('sel')}
 const clone=list=>{const gm={};return list.map(e=>{const n={...e,id:nid.current++,x:e.x+30,y:e.y+30};if(e.g){gm[e.g]=gm[e.g]||'g'+nid.current++;n.g=gm[e.g]}return n})}
 const paste=list=>{if(!list.length)return;const n=clone(list);commit(d=>({...d,els:[...d.els,...n]}));setIds(n.map(e=>e.id))}
 const del=()=>{commit(d=>({...d,els:d.els.filter(e=>!ids.includes(e.id))}));setIds([])}
 const align=m=>{const S=doc.els.filter(e=>ids.includes(e.id));if(!S.length)return
  const b=S.length>1?{x0:Math.min(...S.map(e=>e.x)),y0:Math.min(...S.map(e=>e.y)),x1:Math.max(...S.map(e=>e.x+e.w)),y1:Math.max(...S.map(e=>e.y+e.h))}:{x0:0,y0:0,x1:doc.w,y1:doc.h}
  mapSel(e=>({l:{x:b.x0},r:{x:b.x1-e.w},cx:{x:Math.round((b.x0+b.x1-e.w)/2)},t:{y:b.y0},b:{y:b.y1-e.h},cy:{y:Math.round((b.y0+b.y1-e.h)/2)}}[m]))}
 const group=()=>{if(ids.length>1){const g='g'+nid.current++;mapSel(()=>({g}))}}
 const flip=k=>mapSel(e=>({[k]:!e[k]}))
 const makeClipEl=(container,contentEls)=>({id:nid.current++,t:'clip',x:container.x,y:container.y,w:container.w,h:container.h,r:container.r||0,
  mtype:container.t,mradius:container.radius,mradii:container.radii,mpts:container.pts,mclosed:container.closed,mmore:container.more,
  mfill:container.fill,mfill2:container.fill2,mgtype:container.gtype,mang:container.ang,mgr:container.gr,mstroke:container.stroke,msw:container.sw,children:contentEls.map(c=>({...c}))})
 const switchSide=ns=>{if(ns===side||!hasBack)return
  sidesRef.current[side]={doc,hist:H.current}
  const t=sidesRef.current[ns]
  H.current=t?t.hist:{u:[],r:[]};setDoc(t?t.doc:{w:doc.w,h:doc.h,bg:'#ffffff',guides:[],els:[]})
  setIds([]);setSide(ns);setTimeout(fit,50)}
 const getBothDocs=()=>({front:side==='front'?doc:(sidesRef.current.front?.doc||start),back:!hasBack?null:(side==='back'?doc:(sidesRef.current.back?.doc||null))})
 const startPlacing=()=>{if(!ids.length)return alert('Select the content you want to place first, then click PowerClip, then click the frame shape to drop it into.')
  setPlacing([...ids])}
 const extractClip=()=>{const e=sel;if(!e||e.t!=='clip')return
  const mask={id:nid.current++,t:e.mtype,x:e.x,y:e.y,w:e.w,h:e.h,r:e.r,fill:e.mfill||'#cccccc',fill2:e.mfill2,gtype:e.mgtype,ang:e.mang,gr:e.mgr,stroke:e.mstroke,sw:e.msw,radius:e.mradius,radii:e.mradii,pts:e.mpts,closed:e.mclosed,more:e.mmore}
  const kids=(e.children||[]).map(ch=>({...ch,id:nid.current++}))
  commit(d=>({...d,els:d.els.flatMap(x=>x.id===e.id?[mask,...kids]:[x])}));setIds([mask.id,...kids.map(k=>k.id)])}
 const rAction=act=>{if(!rCtx)return;const {draggedId,targetId,orig}=rCtx,dragged=doc.els.find(x=>x.id===draggedId),target=doc.els.find(x=>x.id===targetId)
  setRCtx(null);if(!dragged||!target)return
  if(act==='cancel'){upd(draggedId,{x:orig.x,y:orig.y});return}
  if(act==='move')return // already at the drop position from the live drag
  if(act==='fill'){const v=target.fill??target.color;if(v==null)return upd(draggedId,{x:orig.x,y:orig.y})
   commit(d=>({...d,els:d.els.map(e=>e.id===draggedId?{...e,x:orig.x,y:orig.y,...(dragged.t==='text'?{color:v}:{fill:v})}:e)}));return}
  if(act==='copy'){const nw={...dragged,id:nid.current++};commit(d=>({...d,els:d.els.map(e=>e.id===draggedId?{...e,x:orig.x,y:orig.y}:e).concat([nw])}));setSel(nw.id);return}
  if(act==='clip'){if(!SH.includes(target.t))return alert("That can't be used as a PowerClip frame — pick a shape, ellipse, triangle, star, or curve.")
   const clipEl=makeClipEl(target,[dragged]);const idx=doc.els.findIndex(e=>e.id===targetId)
   commit(d=>{const rest=d.els.filter(e=>e.id!==draggedId&&e.id!==targetId);rest.splice(Math.min(idx,rest.length),0,clipEl);return{...d,els:rest}});setIds([clipEl.id])}}
 const setColor=hex=>{if(sel)upd(sel.id,sel.t==='text'?{color:hex}:{fill:hex})}
 const eye=async()=>{if(window.EyeDropper){try{setColor((await new EyeDropper().open()).sRGBHex)}catch{}}else setTool('eye')}
 const bool=async op=>{const S=doc.els.filter(e=>ids.includes(e.id));if(S.length<2||S.some(e=>!SH.includes(e.t)))return alert('Select two or more shapes or paths first (text, photos and images cannot be combined).')
  try{const els=await booleanOp(S,op,()=>nid.current++);if(!els)return alert('Nothing is left after that operation.');const first=doc.els.findIndex(e=>ids.includes(e.id));commit(d=>{const rest=d.els.filter(e=>!ids.includes(e.id));rest.splice(Math.min(first,rest.length),0,...els);return{...d,els:rest}});setIds(els.map(e=>e.id))}catch(err){alert('Could not combine these shapes: '+err.message)}}
 const breakApart=()=>{const e=sel;if(!e||e.t!=='path'||!e.more)return;const els=[{pts:e.pts,closed:e.closed},...e.more].map(c=>({...e,id:nid.current++,more:undefined,rule:undefined,closed:c.closed,...fromAbs(absOf({...e,pts:c.pts}))}));commit(d=>({...d,els:d.els.flatMap(x=>x.id===e.id?els:[x])}));setIds(els.map(x=>x.id))}
 const trace=async preset=>{if(!sel||sel.t!=='image')return;setTraceMenu(false);setBusy('Tracing…')
  try{const {svg}=await traceImage(sel.src,preset);const raw=importSVG(svg,{w:sel.w,h:sel.h},()=>nid.current++)||[]
   const area=sel.w*sel.h,kept=raw.filter(e=>e.w*e.h>area*0.001).map(e=>({...e,x:e.x+sel.x,y:e.y+sel.y}))
   if(!kept.length)return alert('The trace produced no shapes worth keeping. Try a different preset, or a cleaner source image (flat colors, no photo noise or dithering work best).')
   if(raw.length>kept.length+50)alert(`Traced into ${kept.length} shapes (dropped ${raw.length-kept.length} tiny speckles). If this still looks rough, bitmap tracing works best on simple logos, not photos or dithered/low-quality images.`)
   commit(d=>({...d,els:d.els.flatMap(x=>x.id===sel.id?kept:[x])}));setIds(kept.map(e=>e.id))}
  catch(err){alert('Trace failed: '+err.message)}finally{setBusy('')}}
 const finishPen=closed=>{if(penPts.length>=2){const e={id:nid.current++,t:'path',closed:!!closed,fill:'#0f6b5c',stroke:'#0b4a40',sw:closed?0:8,...fromAbs(penPts)};commit(d=>({...d,els:[...d.els,e]}));setSel(e.id);setTool('node')}setPen([])}
 const convert=()=>{if(sel&&SH.includes(sel.t)&&sel.t!=='path'){upd(sel.id,{t:'path',closed:true,r:0,...fromAbs(rotA(toPath(sel),sel))});setTool('node')}}
 const fit=()=>{if(!box.current)return;const b=box.current.getBoundingClientRect(),z=Math.min((b.width-R-60)/doc.w,(b.height-R-60)/doc.h);setView({z,x:(b.width-R-doc.w*z)/2,y:(b.height-R-doc.h*z)/2})}
 useEffect(fit,[]);useEffect(fit,[doc.w,doc.h])
 useEffect(()=>{document.fonts?.ready?.then(()=>setTick(t=>t+1)).catch(()=>{})},[])
 const [nsel,setNsel]=useState(null),[penPts,setPen]=useState([]),[rnSel,setRnSel]=useState([])
 const roundable=e=>e&&(e.t==='rect'||(e.t==='photo'&&(!e.frameShape||e.frameShape==='rect')))
 const cornerPts=e=>{const rr=getRadii(e),m=Math.min(e.w,e.h)/2
  return[{x:e.x+Math.min(rr[0],m),y:e.y},{x:e.x+e.w-Math.min(rr[1],m),y:e.y},{x:e.x+e.w-Math.min(rr[2],m),y:e.y+e.h},{x:e.x+Math.min(rr[3],m),y:e.y+e.h}]}
 useEffect(()=>{setRnSel([])},[selId,tool])
 useEffect(()=>{
  if(!box.current)return
  const b=box.current.getBoundingClientRect(),c=cv.current,cx=c.getContext('2d');c.width=b.width-R;c.height=b.height-R
  cx.fillStyle='#2a2b2f';cx.fillRect(0,0,c.width,c.height);cx.save();cx.translate(view.x,view.y);cx.scale(view.z,view.z)
  cx.shadowColor='#000a';cx.shadowBlur=20;cx.fillStyle='#fff';cx.fillRect(0,0,doc.w,doc.h);cx.shadowBlur=0
  const row=rows[cur]||{},imgs={},im=u=>IC.current[u]||(IC.current[u]=Object.assign(new Image(),{onload:()=>setTick(t=>t+1),src:u}))
  doc.els.forEach(e=>{if(e.t==='photo'&&e.field){const u=photoURL(row,e.field,photos);if(u)imgs[e.field]=im(u)}if(e.t==='image')imgs['#'+e.id]=im(e.src)})
  const dDoc=editText?{...doc,els:doc.els.map(e=>e.id===editText.id?{...e,op:0}:e)}:doc
  try{draw(cx,dDoc,rows[cur],true,imgs)}catch(err){console.error('Card Studio render error (state was kept; this frame was skipped):',err)}
  cx.lineWidth=1/view.z;cx.strokeStyle='#26c6da';guides.forEach(g=>{cx.beginPath();if(g.o==='v'){cx.moveTo(g.p,-1e5);cx.lineTo(g.p,1e5)}else{cx.moveTo(-1e5,g.p);cx.lineTo(1e5,g.p)}cx.stroke()})
  cx.lineWidth=2/view.z;cx.strokeStyle='#4fb3a2';doc.els.filter(e=>ids.includes(e.id)).forEach(e=>{cx.save();cx.translate(e.x+e.w/2,e.y+e.h/2);cx.rotate((e.r||0)*Math.PI/180);cx.translate(-e.x-e.w/2,-e.y-e.h/2);cx.strokeRect(e.x,e.y,e.w,e.h);cx.restore()})
  if(tool==='node'&&roundable(sel)){const pts=cornerPts(sel).map(q=>rotP(sel,q.x,q.y)),r=6/view.z;cx.save();cx.lineWidth=1.5/view.z
   pts.forEach((q,i)=>{cx.beginPath();cx.arc(q.x,q.y,r,0,7);cx.fillStyle=rnSel.includes(i)?'#4fb3a2':'#fff';cx.fill();cx.strokeStyle='#4fb3a2';cx.stroke()});cx.restore()}
  if(tool==='pen'&&penPts.length||tool==='node'&&sel?.t==='path'&&!sel.more){const nodes=tool==='pen'?penPts:absOf(sel),r=5/view.z;cx.setLineDash([]);cx.lineWidth=1.5/view.z;cx.strokeStyle='#4fb3a2'
   cx.save();if(tool==='node'){cx.translate(sel.x+sel.w/2,sel.y+sel.h/2);cx.rotate((sel.r||0)*Math.PI/180);cx.translate(-sel.x-sel.w/2,-sel.y-sel.h/2)}
   pathP(cx,tool==='pen'?{x:0,y:0,w:1,h:1,pts:penPts,closed:false}:sel);cx.stroke();cx.restore()
   nodes.forEach((n,i)=>{[n.a,n.b].forEach(h=>{if(h){cx.beginPath();cx.moveTo(n.x,n.y);cx.lineTo(h[0],h[1]);cx.stroke();cx.beginPath();cx.arc(h[0],h[1],r*.8,0,7);cx.fillStyle='#fff';cx.fill();cx.stroke()}})
    cx.fillStyle=i===nsel&&tool==='node'?'#4fb3a2':'#fff';cx.fillRect(n.x-r,n.y-r,2*r,2*r);cx.strokeRect(n.x-r,n.y-r,2*r,2*r)})}
  if(ids.length>1&&tool==='sel'){const Hp=bboxHandles(groupBBox(doc,ids));cx.save();cx.fillStyle='#4fb3a2';['tl','tr','bl','br','t','b','l','r'].forEach(k=>{const q=Hp[k],s=7/view.z;cx.fillRect(q.x-s/2,q.y-s/2,s,s)});cx.restore()}
  if(sel&&ids.length===1&&tool==='sel'){const Hp=handlePts(sel);cx.save()
   if(mode==='scale'){cx.fillStyle='#4fb3a2';['tl','tr','bl','br','t','b','l','r'].forEach(k=>{const q=Hp[k],s=7/view.z;cx.fillRect(q.x-s/2,q.y-s/2,s,s)})
    if(sel.t==='rect'||sel.t==='photo'){const rp=rotP(sel,sel.x+getRadii(sel)[0],sel.y);cx.beginPath();cx.arc(rp.x,rp.y,6/view.z,0,7);cx.fillStyle='#fff';cx.fill();cx.strokeStyle='#4fb3a2';cx.stroke()}}
   else{cx.fillStyle='#e0a800';cx.strokeStyle='#e0a800';['tl','tr','bl','br'].forEach(k=>{const q=Hp[k];cx.beginPath();cx.arc(q.x,q.y,6/view.z,0,7);cx.fill()})
    ;['t','b','l','r'].forEach(k=>{const q=Hp[k],s=5/view.z;cx.strokeRect(q.x-s,q.y-s,2*s,2*s)})}
   cx.restore()}
  if(doc.bg2&&ids.length===0&&tool==='sel'){const p1=doc.bgP1||{x:0,y:doc.h/2},p2=doc.bgP2||{x:doc.w,y:doc.h/2}
   cx.save();cx.strokeStyle='#e0a800';cx.lineWidth=1.5/view.z;cx.beginPath();cx.moveTo(p1.x,p1.y);cx.lineTo(p2.x,p2.y);cx.stroke()
   const nd=(q,sq)=>{cx.beginPath();if(sq)cx.rect(q.x-6/view.z,q.y-6/view.z,12/view.z,12/view.z);else cx.arc(q.x,q.y,6/view.z,0,7);cx.fillStyle='#fff';cx.fill();cx.strokeStyle='#e0a800';cx.lineWidth=2/view.z;cx.stroke()}
   nd(p1,true);nd(p2,false);cx.restore()}
  if(band){cx.setLineDash([6/view.z,4/view.z]);cx.strokeStyle='#8ab4f8';cx.strokeRect(band.x0,band.y0,band.x1-band.x0,band.y1-band.y0)}
  cx.restore()
  const ruler=(el,horiz)=>{const c=el.current;c.width=horiz?b.width-R:R;c.height=horiz?R:b.height-R;const x=c.getContext('2d');x.fillStyle='#2b2d31';x.fillRect(0,0,c.width,c.height);x.fillStyle='#aaa';x.strokeStyle='#777';x.font='10px Arial'
   const off=horiz?view.x:view.y,len=horiz?c.width:c.height,step=view.z*10>=6?1:view.z*10>=2?5:10
   for(let mm=Math.floor(-off/(view.z*10));mm*view.z*10+off<len;mm+=step){const p=mm*view.z*10+off;if(p<0)continue;const big=mm%10===0;x.beginPath()
    if(horiz){x.moveTo(p,big?6:16);x.lineTo(p,R);if(big)x.fillText(mm,p+2,10)}else{x.moveTo(big?6:16,p);x.lineTo(R,p);if(big){x.save();x.translate(10,p+2);x.rotate(-Math.PI/2);x.fillText(mm,0,0);x.restore()}}x.stroke()}}
  ruler(rt,true);ruler(rl,false)
 },[doc,view,ids,cur,rows,photos,tick,band,penPts,tool,nsel,mode,placing,rnSel])
 const wpt=ev=>{const r=cv.current.getBoundingClientRect();return{x:(ev.clientX-r.left-view.x)/view.z,y:(ev.clientY-r.top-view.y)/view.z}}
 const rulerDown=h=>ev=>{const p=wpt(ev);snapH();drag.current={m:'guide',i:guides.length};setDoc(d=>({...d,guides:[...(d.guides||[]),{o:h?'h':'v',p:h?p.y:p.x}]}))}
 const down=ev=>{const p=wpt(ev),hs=14/view.z
  if(doc.bg2&&ids.length===0&&tool==='sel'){const p1=doc.bgP1||{x:0,y:doc.h/2},p2=doc.bgP2||{x:doc.w,y:doc.h/2},hs2=16/view.z
   if(Math.hypot(p.x-p1.x,p.y-p1.y)<hs2){snapH();drag.current={m:'bgP1'};return}
   if(Math.hypot(p.x-p2.x,p.y-p2.y)<hs2){snapH();drag.current={m:'bgP2'};return}}
  if(placing){const hit=[...doc.els].reverse().find(e=>inside(e,p))
   if(!hit||placing.includes(hit.id)||!SH.includes(hit.t)){setPlacing(null);return}
   const content=doc.els.filter(e=>placing.includes(e.id)),idx=doc.els.findIndex(e=>e.id===hit.id),clipEl=makeClipEl(hit,content)
   commit(d=>{const rest=d.els.filter(e=>!placing.includes(e.id)&&e.id!==hit.id);rest.splice(Math.min(idx,rest.length),0,clipEl);return{...d,els:rest}})
   setIds([clipEl.id]);setPlacing(null);return}
  if(tool.startsWith('draw:')){drag.current={m:'draw',kind:tool.slice(5),p};return}
  if(tool==='sel'&&ev.detail===2){const hit=[...doc.els].reverse().find(e=>e.t==='text'&&inside(e,p));if(hit){setEditText({id:hit.id,value:hit.text});return}}
  if(ev.button===2){if(tool!=='sel')return;const hit=[...doc.els].reverse().find(e=>inside(e,p));if(!hit)return
   snapH();setSel(hit.id);drag.current={m:'rdrag',id:hit.id,orig:{x:hit.x,y:hit.y},start:p};return}
  if(space.current||ev.button===1){drag.current={m:'pan',sx:ev.clientX,sy:ev.clientY,v:view};return}
  if(tool==='eye'){const r=cv.current.getBoundingClientRect(),d=cv.current.getContext('2d').getImageData(Math.round(ev.clientX-r.left),Math.round(ev.clientY-r.top),1,1).data;setColor('#'+[...d.slice(0,3)].map(v=>v.toString(16).padStart(2,'0')).join(''));setTool('sel');return}
  if(tool==='pen'){if(penPts.length>2&&Math.hypot(p.x-penPts[0].x,p.y-penPts[0].y)<10/view.z){finishPen(true);return}
   setPen([...penPts,{x:p.x,y:p.y,sm:1}]);drag.current={m:'penh',i:penPts.length,ax:p.x,ay:p.y};return}
  if(tool==='node'&&roundable(sel)){const world=cornerPts(sel).map(q=>rotP(sel,q.x,q.y))
   const hi=world.findIndex(q=>Math.hypot(p.x-q.x,p.y-q.y)<hs)
   if(hi>=0){snapH();const link=sel.radLink||(sel.rlink===false?[0,1,2,3]:[0,0,0,0]);drag.current={m:'radN',e:sel,corner:hi,group:link[hi]};return}
   drag.current={m:'radBand',p};return}
  if(tool==='node'&&sel?.t==='path'&&!sel.more){const A=absOf(sel)
   if(ev.detail===2){let best=null;A.forEach((m,i)=>{const j=(i+1)%A.length;if(!sel.closed&&j===0)return;const n=A[j],p0=[m.x,m.y],p3=[n.x,n.y];for(let t=0;t<=1;t+=.05){const q=bez(p0,m.b||p0,n.a||p3,p3,t),dd=Math.hypot(q[0]-p.x,q[1]-p.y);if(!best||dd<best.d)best={d:dd,i,j,t}}})
    if(best&&best.d<12/view.z){snapH();setDoc(o=>({...o,els:o.els.map(x=>x.id===sel.id?{...x,...fromAbs(splitSeg(A,best.i,best.j,best.t))}:x)}));setNsel(best.i+1)}return}
   for(let i=A.length-1;i>=0;i--){const n=A[i];for(const kk of ['a','b']){const h=n[kk];if(h&&Math.hypot(p.x-h[0],p.y-h[1])<hs){snapH();setNsel(i);drag.current={m:'node',k:kk,i,A,e:sel};return}}
    if(Math.hypot(p.x-n.x,p.y-n.y)<hs){snapH();setNsel(i);drag.current={m:'node',k:'p',i,A,e:sel,p};return}}}
  if(ids.length>1&&tool==='sel'){const b=groupBBox(doc,ids),Hp=bboxHandles(b),near=q=>Math.abs(p.x-q.x)<hs&&Math.abs(p.y-q.y)<hs
   for(const k of['tl','tr','bl','br','t','b','l','r'])if(near(Hp[k])){snapH();drag.current={m:'scaleG',key:k,b,orig:Object.fromEntries(doc.els.filter(e=>ids.includes(e.id)).map(e=>[e.id,{x:e.x,y:e.y,w:e.w,h:e.h}]))};return}}
  if(sel&&ids.length===1&&tool==='sel'){const Hp=handlePts(sel),near=q=>Math.abs(p.x-q.x)<hs&&Math.abs(p.y-q.y)<hs
   if(mode==='scale'){if((sel.t==='rect'||sel.t==='photo')){const lp=loc(sel,p);if(Math.abs(lp.x-(sel.x+getRadii(sel)[0]))<hs&&Math.abs(lp.y-sel.y)<hs){snapH();drag.current={m:'rad',e:sel};return}}
    for(const k of['tl','tr','bl','br','t','b','l','r'])if(near(Hp[k])){snapH();drag.current={m:'scaleH',key:k,ex:sel.x,ey:sel.y,ew:sel.w,eh:sel.h,e:sel};return}}
   else{for(const k of['tl','tr','bl','br'])if(near(Hp[k])){snapH();const cx0=sel.x+sel.w/2,cy0=sel.y+sel.h/2;drag.current={m:'rot',e:sel,a0:Math.atan2(p.y-cy0,p.x-cx0),r0:sel.r||0,A:sel.t==='path'?absOf(sel):null};return}
    if(sel.t!=='path')for(const k of['t','b','l','r'])if(near(Hp[k])){snapH();drag.current={m:'skewH',edge:k,e:sel};return}}}
  const hit=[...doc.els].reverse().find(e=>inside(e,p))
  if(hit){const already=ids.length===1&&ids[0]===hit.id&&tool==='sel';setMode(already?(mode==='scale'?'rotate':'scale'):'scale')
   const g=hit.g?doc.els.filter(e=>e.g===hit.g).map(e=>e.id):[hit.id]
   const n=ev.shiftKey?(ids.includes(hit.id)?ids.filter(i=>!g.includes(i)):[...ids,...g]):(ids.includes(hit.id)?ids:g);setIds(n);snapH()
   drag.current={m:'mv',p,o:Object.fromEntries(doc.els.filter(e=>n.includes(e.id)).map(e=>[e.id,{x:e.x,y:e.y,w:e.w,h:e.h,children:e.t==='clip'?e.children:null}]))};return}
  const gi=guides.findIndex(g=>Math.abs((g.o==='v'?p.x:p.y)-g.p)<6/view.z);if(gi>=0){snapH();drag.current={m:'guide',i:gi};return}
  drag.current={m:'band',p,add:ev.shiftKey?ids:[]};if(!ev.shiftKey)setIds([])}
 const move=ev=>{const d=drag.current;if(!d)return;const p=wpt(ev),tol=6/view.z
  const TX=[0,doc.w,...guides.filter(g=>g.o==='v').map(g=>g.p)],TY=[0,doc.h,...guides.filter(g=>g.o==='h').map(g=>g.p)]
  const sd=(v,T)=>{let b=0,bd=tol;for(const t of T)if(Math.abs(t-v)<bd){bd=Math.abs(t-v);b=t-v}return[b,bd]}
  const fs=(x0,bw,T)=>{let r=[0,tol];for(const o of [0,bw/2,bw]){const s=sd(x0+o,T);if(s[1]<r[1])r=s}return r[0]}
  if(d.m==='bgP1'){setDoc(o=>({...o,bgP1:{x:Math.round(p.x),y:Math.round(p.y)}}));return}
  if(d.m==='bgP2'){setDoc(o=>({...o,bgP2:{x:Math.round(p.x),y:Math.round(p.y)}}));return}
  if(d.m==='drawer'){setDrawerH(clamp(d.startH-(ev.clientY-d.startY),28,Math.round(window.innerHeight*.7)));return}
  if(d.m==='draw'){setBand({x0:Math.min(d.p.x,p.x),y0:Math.min(d.p.y,p.y),x1:Math.max(d.p.x,p.x),y1:Math.max(d.p.y,p.y)});return}
  if(d.m==='radBand'){setBand({x0:Math.min(d.p.x,p.x),y0:Math.min(d.p.y,p.y),x1:Math.max(d.p.x,p.x),y1:Math.max(d.p.y,p.y)});return}
  if(d.m==='radN'){const e=d.e,lp=loc(e,p),m=Math.min(e.w,e.h)/2,v=Math.round(clamp(d.corner===1||d.corner===2?(e.x+e.w-lp.x):(lp.x-e.x),0,m))
   const link=e.radLink||(e.rlink===false?[0,1,2,3]:[0,0,0,0]),nr=[...getRadii(e)];link.forEach((g,i)=>{if(g===d.group)nr[i]=v})
   setDoc(o=>({...o,els:o.els.map(x=>x.id===e.id?{...x,radii:nr,radius:undefined}:x)}));return}
  if(d.m==='rdrag'){const dx=p.x-d.start.x,dy=p.y-d.start.y;setDoc(o=>({...o,els:o.els.map(el=>el.id===d.id?{...el,x:Math.round(d.orig.x+dx),y:Math.round(d.orig.y+dy)}:el)}));return}
  if(d.m==='pan'){setView({...d.v,x:d.v.x+ev.clientX-d.sx,y:d.v.y+ev.clientY-d.sy});return}
  if(d.m==='guide'){setDoc(o=>({...o,guides:o.guides.map((g,i)=>i===d.i?{...g,p:g.o==='v'?p.x:p.y}:g)}));return}
  if(d.m==='band'){const b={x0:Math.min(d.p.x,p.x),y0:Math.min(d.p.y,p.y),x1:Math.max(d.p.x,p.x),y1:Math.max(d.p.y,p.y)};setBand(b)
   const hit=doc.els.filter(e=>e.x<b.x1&&e.x+e.w>b.x0&&e.y<b.y1&&e.y+e.h>b.y0),gs=new Set(hit.map(e=>e.g).filter(Boolean))
   setIds([...new Set([...d.add,...doc.els.filter(e=>hit.includes(e)||gs.has(e.g)).map(e=>e.id)])]);return}
  if(d.m==='rad'){const e=d.e,lp=loc(e,p),v=Math.round(Math.max(0,Math.min(lp.x-e.x,e.w/2,e.h/2))),nr=e.rlink===false?[...getRadii(e)]:[v,v,v,v];if(e.rlink===false)nr[0]=v;setDoc(o=>({...o,els:o.els.map(x=>x.id===e.id?{...x,radii:nr,radius:undefined}:x)}));return}
  if(d.m==='rot'){const e=d.e,cx=e.x+e.w/2,cy=e.y+e.h/2;let deg=(Math.atan2(p.y-cy,p.x-cx)-d.a0)*180/Math.PI;if(ev.shiftKey)deg=Math.round(deg/15)*15
   setDoc(o=>({...o,els:o.els.map(x=>x.id!==e.id?x:e.t==='path'?{...x,...fromAbs(rotA(d.A,{...e,r:deg}))}:{...x,r:Math.round((((d.r0+deg)%360)+360)%360*10)/10})}));return}
  if(d.m==='skewH'){const e=d.e,lp=loc(e,p),cx=e.x+e.w/2,cy=e.y+e.h/2
   if(d.edge==='t'||d.edge==='b')upd(e.id,{skx:Math.round(clamp((lp.x-cx)/e.h*90,-60,60))})
   else upd(e.id,{sky:Math.round(clamp((lp.y-cy)/e.w*90,-60,60))});return}
  if(d.m==='scaleG'){const {b,key,orig}=d;let x=b.x,y=b.y,w=b.w,h=b.h,cx0=b.x+b.w/2,cy0=b.y+b.h/2
   if(key.includes('r')){if(ev.ctrlKey){w=Math.max(20,2*Math.abs(p.x-cx0));x=cx0-w/2}else{w=Math.max(20,p.x-b.x);x=b.x}}
   if(key.includes('l')){if(ev.ctrlKey){w=Math.max(20,2*Math.abs(p.x-cx0));x=cx0-w/2}else{w=Math.max(20,b.x+b.w-p.x);x=p.x}}
   if(key.includes('t')){if(ev.ctrlKey){h=Math.max(20,2*Math.abs(p.y-cy0));y=cy0-h/2}else{h=Math.max(20,b.y+b.h-p.y);y=p.y}}
   if(key.includes('b')){if(ev.ctrlKey){h=Math.max(20,2*Math.abs(p.y-cy0));y=cy0-h/2}else{h=Math.max(20,p.y-b.y);y=b.y}}
   if(ev.shiftKey&&key.length===2){h=Math.max(20,w*(b.h/b.w));if(ev.ctrlKey)y=cy0-h/2;else y=key[0]==='t'?b.y+b.h-h:b.y}
   const sx=w/b.w,sy=h/b.h
   if(!Number.isFinite(sx)||!Number.isFinite(sy))return
   setDoc(o=>({...o,els:o.els.map(el=>{const g=orig[el.id];if(!g)return el;const nx=x+(g.x-b.x)*sx,ny=y+(g.y-b.y)*sy,nw=g.w*sx,nh=g.h*sy
    if(![nx,ny,nw,nh].every(Number.isFinite))return el
    const kids=el.t==='clip'&&el.children?el.children.map(ch=>({...ch,x:Math.round(nx+(ch.x-g.x)*sx),y:Math.round(ny+(ch.y-g.y)*sy),w:Math.max(4,Math.round(ch.w*sx)),h:Math.max(4,Math.round(ch.h*sy))})):undefined
    return{...el,x:Math.round(nx),y:Math.round(ny),w:Math.max(4,Math.round(nw)),h:Math.max(4,Math.round(nh)),...(kids?{children:kids}:{})}})}));return}
  if(d.m==='scaleH'){const {ex,ey,ew,eh,key,e}=d,lp=loc(e,p),cx=ex+ew/2,cy=ey+eh/2;let x=ex,y=ey,w=ew,h=eh
   if(key.includes('r')){if(ev.ctrlKey){w=Math.max(20,2*Math.abs(lp.x-cx));x=cx-w/2}else{w=Math.max(20,lp.x-ex);x=ex}}
   if(key.includes('l')){if(ev.ctrlKey){w=Math.max(20,2*Math.abs(lp.x-cx));x=cx-w/2}else{w=Math.max(20,ex+ew-lp.x);x=lp.x}}
   if(key.includes('t')){if(ev.ctrlKey){h=Math.max(20,2*Math.abs(lp.y-cy));y=cy-h/2}else{h=Math.max(20,ey+eh-lp.y);y=lp.y}}
   if(key.includes('b')){if(ev.ctrlKey){h=Math.max(20,2*Math.abs(lp.y-cy));y=cy-h/2}else{h=Math.max(20,lp.y-ey);y=ey}}
   if(ev.shiftKey&&key.length===2){h=Math.max(20,w*(eh/ew));if(ev.ctrlKey)y=cy-h/2;else y=key[0]==='t'?ey+eh-h:ey}
   if(![x,y,w,h].every(Number.isFinite))return
   let extra={}
   if(e.t==='clip'&&e.children){const sx=w/ew,sy=h/eh;extra.children=e.children.map(ch=>({...ch,x:Math.round(x+(ch.x-ex)*sx),y:Math.round(y+(ch.y-ey)*sy),w:Math.max(4,Math.round(ch.w*sx)),h:Math.max(4,Math.round(ch.h*sy))}))}
   setDoc(o=>({...o,els:o.els.map(el=>el.id===e.id?{...el,x:Math.round(x),y:Math.round(y),w:Math.round(w),h:Math.round(h),...extra}:el)}));return}
  if(d.m==='penh'){if(Math.hypot(p.x-d.ax,p.y-d.ay)>4/view.z)setPen(k=>k.map((n,i)=>i===d.i?{...n,b:[p.x,p.y],a:[2*d.ax-p.x,2*d.ay-p.y]}:n));return}
  if(d.m==='node'){const A=d.A.map(z=>({...z})),n=A[d.i]
   if(d.k==='p'){const dx=p.x-d.p.x,dy=p.y-d.p.y;n.x+=dx;n.y+=dy;if(n.a)n.a=[n.a[0]+dx,n.a[1]+dy];if(n.b)n.b=[n.b[0]+dx,n.b[1]+dy]}
   else{n[d.k]=[p.x,p.y];const o=d.k==='a'?'b':'a';if(n.sm&&n[o])n[o]=[2*n.x-p.x,2*n.y-p.y]}
   setDoc(o=>({...o,els:o.els.map(x=>x.id===d.e.id?{...x,...fromAbs(A)}:x)}));return}
  let dx=p.x-d.p.x,dy=p.y-d.p.y
  if(!d.o)return
  const O=Object.values(d.o),x0=Math.min(...O.map(o=>o.x)),y0=Math.min(...O.map(o=>o.y)),bw=Math.max(...O.map(o=>o.x+o.w))-x0,bh=Math.max(...O.map(o=>o.y+o.h))-y0
  dx+=fs(x0+dx,bw,TX);dy+=fs(y0+dy,bh,TY)
  setDoc(o=>({...o,els:o.els.map(e=>{const g=d.o[e.id];if(!g)return e
   const nx=Math.round(g.x+dx),ny=Math.round(g.y+dy)
   const kids=g.children?g.children.map(ch=>({...ch,x:Math.round(ch.x+dx),y:Math.round(ch.y+dy)})):undefined
   return{...e,x:nx,y:ny,...(kids?{children:kids}:{})}})}))}
 const up=ev=>{const d=drag.current;drag.current=null;if(!d)return
  if(d.m==='rdrag'){const p2=wpt(ev),target=[...doc.els].reverse().find(e=>e.id!==d.id&&inside(e,p2))
   if(!target){setDoc(o=>({...o,els:o.els.map(el=>el.id===d.id?{...el,x:d.orig.x,y:d.orig.y}:el)}));return}
   setRCtx({x:ev.clientX,y:ev.clientY,draggedId:d.id,targetId:target.id,orig:d.orig});return}
  if(d.m==='radBand'){setBand(null);if(!sel)return
   const world=cornerPts(sel).map(q=>rotP(sel,q.x,q.y)),p2=wpt(ev)
   const bx0=Math.min(d.p.x,p2.x),by0=Math.min(d.p.y,p2.y),bx1=Math.max(d.p.x,p2.x),by1=Math.max(d.p.y,p2.y)
   const hits=world.map((q,i)=>i).filter(i=>world[i].x>=bx0&&world[i].x<=bx1&&world[i].y>=by0&&world[i].y<=by1)
   setRnSel(hits)
   if(hits.length>=2){const g=Date.now()+Math.random(),link=[...(sel.radLink||(sel.rlink===false?[0,1,2,3]:[0,0,0,0]))];hits.forEach(i=>link[i]=g);upd(sel.id,{radLink:link})}
   return}
  if(d.m==='draw'){const p2=wpt(ev),x0=Math.min(d.p.x,p2.x),y0=Math.min(d.p.y,p2.y),bw=Math.abs(p2.x-d.p.x),bh=Math.abs(p2.y-d.p.y),small=bw<10&&bh<10,base=DEF[d.kind]||{w:200,h:150}
   const el={...base,id:nid.current++,x:small?d.p.x:x0,y:small?d.p.y:y0,w:small?base.w:Math.max(10,bw),h:small?base.h:Math.max(10,bh)}
   commit(dd=>({...dd,els:[...dd.els,el]}));setSel(el.id);setBand(null);setTool('sel');return}
  if(d.m==='band')setBand(null)
  if(d.m==='guide'){const r=cv.current.getBoundingClientRect(),g=guides[d.i];if(g&&(g.o==='h'?ev.clientY<r.top:ev.clientX<r.left))setDoc(o=>({...o,guides:o.guides.filter((_,i)=>i!==d.i)}))}}
 useEffect(()=>{window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)}})
 useEffect(()=>{const el=cv.current;if(!el)return
  const wheel=ev=>{ev.preventDefault();const r=el.getBoundingClientRect(),mx=ev.clientX-r.left,my=ev.clientY-r.top,f=ev.deltaY<0?1.1:1/1.1
   setView(v=>{const z=Math.min(8,Math.max(.05,v.z*f));return{z,x:mx-(mx-v.x)*z/v.z,y:my-(my-v.y)*z/v.z}})}
  el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel)},[])
 const [fname,setFname]=useState(''),[dirty,setDirty]=useState(false),[recover,setRecover]=useState(null),[menu,setMenu]=useState(false),fh=useRef(null),L=useRef(null),fo=useRef(),fi=useRef()
 const apply=(p,name)=>{const back=p.back||null
  L.current={doc:p.doc,rows:p.rows,photos:p.photos};H.current={u:[],r:[]}
  sidesRef.current={front:{doc:p.doc,hist:{u:[],r:[]}},back:back?{doc:back,hist:{u:[],r:[]}}:null}
  setHasBack(!!back);setSide('front')
  setDoc(p.doc);setRows(p.rows);setPhotos(p.photos);setIds([]);setCur(0)
  nid.current=Math.max(100,...[...p.doc.els,...(back?back.els:[])].map(e=>e.id+1))
  setFname(name);setDirty(false);setTimeout(fit,50)}
 const load=async(f,name)=>{const p=await unpackProject(f);p?apply(p,name):alert('Not a valid Card Studio project, or made by a newer version.')}
 const newDoc=()=>{if(dirty&&!confirm('Discard unsaved changes?'))return;setNewDialogOpen(true)}
 const startNew=withBack=>{fh.current=null;const back=withBack?{w:start.w,h:start.h,bg:'#ffffff',guides:[],els:[]}:null;apply({doc:{...start},rows:[],photos:{},back},'');setNewDialogOpen(false)}
 const openDlg=async()=>{if(dirty&&!confirm('Discard unsaved changes?'))return
  if(window.showOpenFilePicker){try{const [h]=await showOpenFilePicker({types:FT});fh.current=h;await load(await h.getFile(),h.name.replace(/\.cstudio$/,''))}catch{}}else fo.current.click()}
 const saveP=async as=>{try{const {front,back}=getBothDocs();const b=await packProject(front,rows,photos,back);let h=fh.current,n=fname
  if(window.showSaveFilePicker&&(as||!h)){h=await showSaveFilePicker({suggestedName:(fname||'untitled')+'.cstudio',types:FT});fh.current=h;n=h.name.replace(/\.cstudio$/,'');setFname(n)}
  if(h){const w=await h.createWritable();await w.write(b);await w.close()}else dlFile((n||'untitled')+'.cstudio',b)
  L.current={doc,rows,photos};setDirty(false);idbPut('autosave',null)}catch(e){if(e.name!=='AbortError')alert('Save failed: '+e.message)}}
 useEffect(()=>{idbGet('autosave').then(b=>b&&setRecover(b)).catch(()=>{})},[])
 useEffect(()=>{if(!L.current){L.current={doc,rows,photos};return}
  if(L.current.doc===doc&&L.current.rows===rows&&L.current.photos===photos)return
  setDirty(true);const t=setTimeout(async()=>{try{const {front,back}=getBothDocs();idbPut('autosave',await packProject(front,rows,photos,back))}catch{}},2500);return()=>clearTimeout(t)},[doc,rows,photos])
 useEffect(()=>{document.title=(fname||'Untitled')+(dirty?' •':'')+' – Card Studio';const f=e=>{if(dirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',f);return()=>window.removeEventListener('beforeunload',f)},[dirty,fname])
 const doImport=async f=>{const n=f.name.toLowerCase(),pdf=n.endsWith('.pdf');try{
  if(n.endsWith('.svg')||f.type==='image/svg+xml'){const els=importSVG(await f.text(),doc,()=>nid.current++);if(!els||!els.length)return alert('Could not read any shapes from that SVG.');commit(d=>({...d,els:[...d.els,...els]}));setIds(els.map(e=>e.id));return}
  if(n.endsWith('.psd')){setBusy('Importing PSD…');const els=await importPSD(f,doc,()=>nid.current++);setBusy('');if(!els.length)return alert('No visible layers found in that PSD.');commit(d=>({...d,els:[...d.els,...els]}));setIds(els.map(e=>e.id));return}
  const r=pdf?await importPDF(f,doc):await importImage(f,doc);if(!r)return;const e={id:nid.current++,t:'image',...r};commit(d=>({...d,els:pdf?[e,...d.els]:[...d.els,e]}));setSel(e.id)}catch(err){setBusy('');alert('Import failed: '+err.message)}}
 useEffect(()=>{
  const kd=ev=>{const k=ev.key,c=ev.ctrlKey||ev.metaKey,s=ev.shiftKey,k0=k.toLowerCase()
   if(c&&['+','-','='].includes(k)){ev.preventDefault();return}
   if(c&&k==='0'){ev.preventDefault();fit();return}
   if(c&&(k0==='s'||k0==='o'||k0==='n'||k0==='i'||k0==='e')){ev.preventDefault();if(k0==='i')fi.current.click();if(k0==='s')saveP(s);if(k0==='o')openDlg();if(k0==='n')newDoc();if(k0==='e')setExportOpen(true);return}
   if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return
   if(k===' '){space.current=true;ev.preventDefault();return}
   if(c&&k0==='z'&&!s){const u=H.current.u.pop();if(u){H.current.r.push(doc);setDoc(u)}ev.preventDefault();return}
   if(c&&(k0==='y'||(k0==='z'&&s))){const r=H.current.r.pop();if(r){H.current.u.push(doc);setDoc(r)}ev.preventDefault();return}
   if(c&&k0==='a'){setIds(doc.els.map(e=>e.id));ev.preventDefault();return}
   if(c&&k0==='g'){ev.preventDefault();s?mapSel(()=>({g:undefined})):group();return}
   if(c&&k0==='u'){ev.preventDefault();if(sel?.t==='clip')extractClip();else mapSel(()=>({g:undefined}));return}
   if(c&&k0==='c'){clip.current=doc.els.filter(e=>ids.includes(e.id));ev.preventDefault();return}
   if(c&&k0==='x'){clip.current=doc.els.filter(e=>ids.includes(e.id));del();ev.preventDefault();return}
   if(c&&k0==='v'){paste(clip.current);ev.preventDefault();return}
   if(c&&k0==='d'){paste(doc.els.filter(e=>ids.includes(e.id)));ev.preventDefault();return}
   if(c&&k0==='q'){ev.preventDefault();convert();return}
   if(c&&k0==='k'){ev.preventDefault();breakApart();return}
   if(k==='Enter'&&tool==='pen'){finishPen(false);return}
   if(!c&&k0==='c'&&tool==='node'&&sel?.t==='path'&&nsel!=null){const A=absOf(sel),n=A[nsel],pv=A[(nsel+A.length-1)%A.length],nx=A[(nsel+1)%A.length]
    if(n.a||n.b){n.a=n.b=null;n.sm=0}else{const dx=(nx.x-pv.x)/6,dy=(nx.y-pv.y)/6;n.a=[n.x-dx,n.y-dy];n.b=[n.x+dx,n.y+dy];n.sm=1}upd(sel.id,fromAbs(A));return}
   if(!c&&k0==='f'&&ids.length){flip(s?'flipY':'flipX');return}
   if(!c&&k0==='p'){setTool('pen');return}
   if(!c&&(k0==='n'||k==='F10')){setTool('node');return}
   if(!c&&k0==='i'){eye();return}
   if(!c&&k0==='v'){setTool('sel');return}
   if((k==='Delete'||k==='Backspace')&&tool==='node'&&sel?.t==='path'&&nsel!=null){const A=absOf(sel);A.splice(nsel,1);if(A.length<2)del();else upd(sel.id,fromAbs(A));setNsel(null);return}
   if((k==='Delete'||k==='Backspace')&&ids.length){del();return}
   if(k==='Escape'&&placing){setPlacing(null);return}
   if(k==='Escape'&&tool==='pen'&&penPts.length){finishPen(false);return}
   if(k==='Escape'){setIds([]);setTool('sel');return}
   if(k.startsWith('Arrow')&&ids.length){const n=s?10:1,m={ArrowLeft:[-n,0],ArrowRight:[n,0],ArrowUp:[0,-n],ArrowDown:[0,n]}[k];mapSel(e=>({x:e.x+m[0],y:e.y+m[1]}));ev.preventDefault();return}
   if(k==='PageUp'||k==='PageDown'){ev.preventDefault();const up=k==='PageUp'
    if(c||s){if(!sel)return;const i=doc.els.findIndex(e=>e.id===sel.id),a=[...doc.els],[e]=a.splice(i,1);const j=s?(up?a.length:0):Math.max(0,Math.min(a.length,i+(up?1:-1)));a.splice(j,0,e);commit(d=>({...d,els:a}))}
    else if(rows.length)setCur(v=>(v+(up?1:-1)+rows.length)%rows.length);return}
   if(k==='F4'){fit();ev.preventDefault()}}
  const ku=ev=>{if(ev.key===' ')space.current=false}
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)}})
 const N=(k,l)=><label className="flex items-center gap-1">{l}<input type="number" step={unit==='px'?1:.1} className="w-16" value={sel?toDisp(sel[k]):''} disabled={!sel} onChange={e=>upd(sel.id,{[k]:toInt(e.target.value)})}/></label>
 const NI=(k,l,st=1,def=0)=><label className="flex items-center gap-1">{l}<input type="number" step={st} className="w-14" value={Number.isFinite(sel?.[k])?sel[k]:def} onChange={e=>upd(sel.id,{[k]:parseFloat(e.target.value)||0})}/></label>
 const GradUI=(fk,f2k)=><>{C(f2k,sel[f2k])}<select className="bg-[#2b2d31]" value={sel.gtype||'linear'} onChange={e=>upd(sel.id,{gtype:e.target.value})}><option value="linear">Linear</option><option value="radial">Radial</option></select>{sel.gtype==='radial'?NI('gr','Size',.1,1):NI('ang','Angle')}</>
 const RAD=i=><input key={i} type="number" className="w-11" title={['Top-left','Top-right','Bottom-right','Bottom-left'][i]} value={getRadii(sel)[i]} onChange={e=>{const v=parseFloat(e.target.value)||0,nr=sel.rlink===false?[...getRadii(sel)]:[v,v,v,v];if(sel.rlink===false)nr[i]=v;upd(sel.id,{radii:nr,radius:undefined})}}/>
 const C=(k,v)=><input type="color" value={v&&v[0]==='#'?v:'#000000'} onChange={e=>upd(sel.id,{[k]:e.target.value})}/>
 const shape=sel&&SH.includes(sel.t)
 return <div className="h-screen flex flex-col select-none" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];f&&doImport(f)}}>
  <input ref={fi} type="file" hidden accept=".svg,.pdf,.psd,image/*" onChange={e=>{const f=e.target.files[0];e.target.value='';f&&doImport(f)}}/>
  <input ref={fo} type="file" hidden accept=".cstudio" onChange={e=>{const f=e.target.files[0];e.target.value='';f&&load(f,f.name.replace(/\.cstudio$/,''))}}/>
  {recover&&<div className="flex gap-3 items-center px-3 py-1 bg-[#4a3d16] text-[#f3e3a5]">Unsaved work from your last session was found.<button onClick={()=>{load(recover,'Recovered');setRecover(null)}}>Restore</button><button onClick={()=>{idbPut('autosave',null);setRecover(null)}}>Discard</button></div>}
  <div className="flex gap-4 px-3 py-1 bg-[#2b2d31] border-b border-[#3c3f45] text-[#bbb]">
   <div className="relative"><span className="cursor-pointer" onClick={()=>setMenu(!menu)}>File</span>{menu&&<div className="absolute z-20 top-5 left-0 w-56 bg-[#2b2d31] border border-[#3c3f45] rounded py-1" onClick={()=>setMenu(false)}>{[['New','Ctrl+N',newDoc],['Open…','Ctrl+O',openDlg],['Save','Ctrl+S',()=>saveP(false)],['Save As…','Ctrl+Shift+S',()=>saveP(true)],['Import… (SVG, PDF, PSD, image)','Ctrl+I',()=>fi.current.click()]].map(([l,k,f])=><div key={l} onClick={f} className="flex justify-between px-3 py-1 hover:bg-[#34554f] cursor-pointer"><span>{l}</span><span className="text-[#888]">{k}</span></div>)}</div>}</div>
   <div className="relative"><span className="cursor-pointer" onClick={()=>setPageMenu(!pageMenu)}>Layout</span>{pageMenu&&<div className="absolute z-20 top-5 left-0 w-64 bg-[#2b2d31] border border-[#3c3f45] rounded p-2 flex flex-col gap-2">
    <select className="bg-[#25262a]" onChange={e=>{const p=PRESETS[e.target.value];if(p)commit(d=>({...d,w:p[1],h:p[2]}));setPageMenu(false)}} defaultValue=""><option value="" disabled>Preset size…</option>{PRESETS.map((p,i)=><option key={p[0]} value={i}>{p[0]} ({(p[1]/10)}×{(p[2]/10)}mm)</option>)}</select>
    <div className="flex gap-2 items-center"><label className="flex items-center gap-1">Units<select className="bg-[#25262a]" value={unit} onChange={e=>setUnit(e.target.value)}>{Object.keys(UNITS).map(u=><option key={u}>{u}</option>)}</select></label></div>
    <div className="flex gap-2 items-center"><label className="flex items-center gap-1">W({unit})<input type="number" step={unit==='px'?1:.5} className="w-16" value={toDisp(doc.w)} onChange={e=>commit(d=>({...d,w:Math.max(UNITS[unit],toInt(e.target.value))}))}/></label>
     <label className="flex items-center gap-1">H({unit})<input type="number" step={unit==='px'?1:.5} className="w-16" value={toDisp(doc.h)} onChange={e=>commit(d=>({...d,h:Math.max(UNITS[unit],toInt(e.target.value))}))}/></label>
     <label className="flex items-center gap-1">Bg<input type="color" value={doc.bg} onChange={e=>commit(d=>({...d,bg:e.target.value}))}/></label></div>
    <label className="flex items-center gap-1"><input type="checkbox" checked={!!doc.bg2} onChange={e=>commit(d=>({...d,bg2:e.target.checked?'#ffffff':undefined,bgP1:d.bgP1||{x:0,y:d.h/2},bgP2:d.bgP2||{x:d.w,y:d.h/2}}))}/> Page background gradient</label>
    {doc.bg2&&<div className="flex gap-2 items-center"><input type="color" value={doc.bg2} onChange={e=>commit(d=>({...d,bg2:e.target.value}))}/><select className="bg-[#25262a]" value={doc.bgGtype||'linear'} onChange={e=>commit(d=>({...d,bgGtype:e.target.value}))}><option value="linear">Linear</option><option value="radial">Radial</option></select></div>}
    {doc.bg2&&<div className="text-[#e0a800] text-[10px] leading-snug">Deselect everything, then drag the square and round handles on the canvas to set the gradient's direction — just like dragging fountain-fill nodes in CorelDRAW.</div>}
    <div className="text-[#777] text-[10px]">Rulers stay in mm regardless of this setting.</div></div>}</div>
   {['Edit','View','Object','Data','Help'].map(m=><span key={m}>{m}</span>)}{hasBack&&<span className="flex gap-1 ml-3">{['front','back'].map(sd=><button key={sd} className={side===sd?'!border-[#4fb3a2] !text-[#4fb3a2]':''} onClick={()=>switchSide(sd)}>{sd==='front'?'Front':'Back'}</button>)}</span>}<b className="ml-auto text-[#4fb3a2]">{(fname||'Untitled')+(dirty?' •':'')}{busy?' · '+busy:''}</b></div>
  <div className="flex flex-wrap items-center gap-3 px-3 py-1 bg-[#25262a] border-b border-[#3c3f45] min-h-9">
   {N('x','X')}{N('y','Y')}{N('w','W')}{N('h','H')}
   {sel?.t==='text'&&<>{NI('size','Size')}{C('color',sel.color)}<select className="bg-[#2b2d31] max-w-[9rem]" value={sel.font||'Arial'} onChange={e=>upd(sel.id,{font:e.target.value})} style={{fontFamily:sel.font||'Arial'}}>{FONTS.map(f=><option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}</select><select className="bg-[#2b2d31]" value={sel.align||'left'} onChange={e=>upd(sel.id,{align:e.target.value})}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select><label className="flex items-center gap-1"><input type="checkbox" checked={!!sel.wrap} onChange={e=>upd(sel.id,{wrap:e.target.checked})}/> Wrap</label><label className="flex items-center gap-1"><input type="checkbox" checked={!!sel.bold} onChange={e=>upd(sel.id,{bold:e.target.checked})}/> Bold</label><select title="Letter casing" className="bg-[#2b2d31]" value={sel.case||'none'} onChange={e=>upd(sel.id,{case:e.target.value})}><option value="none">As typed</option><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="title">Title Case</option></select>{NI('lh','Line ht',.1,1.2)}{NI('ls','Spacing',.5)}<label className="flex items-center gap-1"><input type="checkbox" checked={!!sel.color2} onChange={e=>upd(sel.id,{color2:e.target.checked?'#ffffff':undefined})}/> Gradient</label>{sel.color2&&GradUI('color','color2')}</>}
   {shape&&<>{C('fill',sel.fill)}<label><input type="checkbox" checked={!!sel.fill2} onChange={e=>upd(sel.id,{fill2:e.target.checked?'#ffffff':undefined})}/> Gradient</label>{sel.fill2&&GradUI('fill','fill2')}{NI('sw','Stroke')}{sel.sw>0&&C('stroke',sel.stroke)}</>}
   {sel?.t==='photo'&&<label className="flex items-center gap-1">Frame<select className="bg-[#2b2d31]" value={sel.frameShape||'rect'} onChange={e=>upd(sel.id,{frameShape:e.target.value})}><option value="rect">Rectangle</option><option value="rounded">Rounded square</option><option value="ellipse">Circle / Oval</option><option value="hexagon">Hexagon</option><option value="octagon">Octagon</option><option value="pentagon">Pentagon</option><option value="diamond">Diamond</option><option value="star">Star</option><option value="heart">Heart</option><option value="shield">Shield</option><option value="arch">Arch</option></select></label>}
   {(sel?.t==='rect'||(sel?.t==='photo'&&(!sel.frameShape||sel.frameShape==='rect')))&&<label className="flex items-center gap-1" title="Corner radius: top-left, top-right, bottom-right, bottom-left">⌐{[0,1,2,3].map(RAD)}<button title={sel.rlink===false?"Corners independent — click to link them together":"Corners linked — click to set them independently"} onClick={()=>upd(sel.id,{rlink:sel.rlink===false?true:false})}><Icon name={sel.rlink===false?'unlink':'link'}/></button></label>}
   {sel?.t==='photo'&&<button title="Reposition/zoom the photo inside its frame (or double-click the frame)" onClick={()=>{snapH();setEditPhoto(sel.id)}}><Icon name="edit"/></button>}
   {sel?.t==='qr'&&<>
    <label className="flex items-center gap-1"><input type="checkbox" checked={!!sel.field} onChange={e=>upd(sel.id,{field:e.target.checked?'Link':''})}/> Link from column</label>
    {sel.field?<input className="w-24" value={sel.field} onChange={e=>upd(sel.id,{field:e.target.value})}/>:<input className="w-40" placeholder="https://..." value={sel.url||''} onChange={e=>upd(sel.id,{url:e.target.value})}/>}
    <label className="flex items-center gap-1"><input type="checkbox" checked={!!sel.capField} onChange={e=>upd(sel.id,{capField:e.target.checked?'Caption':undefined})}/> Caption from column</label>
    {sel.capField?<input className="w-24" value={sel.capField} onChange={e=>upd(sel.id,{capField:e.target.value})}/>:<input className="w-28" placeholder="Caption text" value={sel.caption||''} onChange={e=>upd(sel.id,{caption:e.target.value})}/>}
    <label className="flex items-center gap-1">Color{C('qcolor',sel.qcolor||'#12492f')}</label>
    <label className="flex items-center gap-1">BG<input type="color" value={sel.qbg&&sel.qbg!=='none'?sel.qbg:'#ffffff'} onChange={e=>upd(sel.id,{qbg:e.target.value})}/><button title="Transparent background" onClick={()=>upd(sel.id,{qbg:'none'})}>none</button></label>
    <select className="bg-[#2b2d31]" title="Error correction: higher levels survive more damage/dirt but make a denser code" value={sel.ecl||'M'} onChange={e=>upd(sel.id,{ecl:e.target.value})}><option value="L">EC: Low</option><option value="M">EC: Medium</option><option value="Q">EC: Quartile</option><option value="H">EC: High</option></select>
   </>}
   {sel&&<label className="flex items-center gap-1">Opacity<input type="range" min="0" max="100" value={Math.round((sel.op??1)*100)} onChange={e=>upd(sel.id,{op:e.target.value/100})}/></label>}
   {sel&&sel.t!=='path'&&NI('r','Angle')}
   {sel&&<><button title="Flip horizontal (F)" onClick={()=>flip('flipX')}><Icon name="flipH"/></button><button title="Flip vertical (Shift+F)" onClick={()=>flip('flipY')}><Icon name="flipV"/></button></>}
   {sel&&<>{NI('blur','Blur')}{NI('mblur','Motion')}{sel.mblur>0&&NI('mang','°')}</>}
   {sel&&sel.t==='image'&&<div className="relative"><button onClick={()=>setTraceMenu(!traceMenu)} className="flex items-center gap-1"><Icon name="convert"/>Trace</button>{traceMenu&&<div className="absolute z-20 top-7 left-0 bg-[#2b2d31] border border-[#3c3f45] rounded py-1 w-44">{Object.keys(TRACE_PRESETS).map(p=><div key={p} className="px-3 py-1 hover:bg-[#34554f] cursor-pointer" onClick={()=>trace(p)}>{p}</div>)}</div>}</div>}
   {sel&&sel.t!=='rect'&&SH.indexOf(sel.t)<0&&<label><input type="checkbox" checked={!!sel.field} onChange={e=>upd(sel.id,{field:e.target.checked?(sel.t==='photo'?'Photo':'Field'):''})}/> Input field</label>}
   {sel?.field&&<input className="w-24" value={sel.field} onChange={e=>upd(sel.id,{field:e.target.value})}/>}
   <span className="ml-auto flex gap-1">{[['l','alignL'],['cx','alignCH'],['r','alignR'],['t','alignT'],['cy','alignCV'],['b','alignB']].map(([m,ic])=><button key={m} title={'Align '+m} onClick={()=>align(m)}><Icon name={ic}/></button>)}<button title="Group (Ctrl+G)" onClick={group}><Icon name="group"/></button>{[['unite','unite','Weld (union)'],['intersect','intersect','Intersect'],['subtract','subtract','Subtract'],['exclude','exclude','Exclude overlap']].map(([o,ic,t])=><button key={o} title={t} onClick={()=>bool(o)}><Icon name={ic}/></button>)}<button title="Break apart (Ctrl+K)" onClick={breakApart}><Icon name="break"/></button><button title="PowerClip: select content, click this, then click the frame shape to place it inside" className={placing?'!border-[#e0a800]':''} onClick={startPlacing}><Icon name="clip"/></button>{sel?.t==='clip'&&<button title="Extract PowerClip contents (Ctrl+U)" onClick={extractClip}><Icon name="extract"/></button>}</span>
  </div>
  <div className="flex items-center gap-1 px-2 py-1 bg-[#25262a] border-b border-[#3c3f45] flex-wrap">
   <button title="Select (V)" className={tool==='sel'?'!border-[#4fb3a2]':''} onClick={()=>setTool('sel')}><Icon name="select"/></button>
   <button title="Eyedropper (I)" className={tool==='eye'?'!border-[#4fb3a2]':''} onClick={eye}><Icon name="eye"/></button>
   <button title="Pen (P): click for corners, drag for curves, click first point to close, Enter to finish" className={tool==='pen'?'!border-[#4fb3a2]':''} onClick={()=>setTool('pen')}><Icon name="pen"/></button>
   <button title="Node edit (N)" className={tool==='node'?'!border-[#4fb3a2]':''} onClick={()=>setTool('node')}><Icon name="node"/></button>
   <button title="Convert to curves (Ctrl+Q)" onClick={convert}><Icon name="convert"/></button>
   <span className="w-px h-5 bg-[#3c3f45] mx-1"/>
   <button title="Draw a text box (click, or drag to size)" className={tool==='draw:text'?'!border-[#4fb3a2]':''} onClick={()=>setTool('draw:text')}><Icon name="text"/></button>
   <button title="Draw a photo frame" className={tool==='draw:photo'?'!border-[#4fb3a2]':''} onClick={()=>setTool('draw:photo')}><Icon name="photo"/></button>
   <button title="Draw a rectangle" className={tool==='draw:rect'?'!border-[#4fb3a2]':''} onClick={()=>setTool('draw:rect')}><Icon name="rect"/></button>
   <button title="Draw an ellipse" className={tool==='draw:ellipse'?'!border-[#4fb3a2]':''} onClick={()=>setTool('draw:ellipse')}><Icon name="ellipse"/></button>
   <button title="Draw a triangle" className={tool==='draw:tri'?'!border-[#4fb3a2]':''} onClick={()=>setTool('draw:tri')}><Icon name="tri"/></button>
   <button title="Draw a star" className={tool==='draw:star'?'!border-[#4fb3a2]':''} onClick={()=>setTool('draw:star')}><Icon name="star"/></button>
   <button title="Draw a QR code" className={tool==='draw:qr'?'!border-[#4fb3a2]':''} onClick={()=>setTool('draw:qr')}><Icon name="qr"/></button>
   <span className="w-px h-5 bg-[#3c3f45] mx-1"/>
   <button title="Fit to window (F4 / Ctrl+0)" onClick={fit}><Icon name="fit"/></button>
   <button title="Export image… (Ctrl+E)" className="ml-auto flex items-center gap-1" onClick={()=>setExportOpen(true)}>Export</button>
  </div>
  <div className="flex flex-1 min-h-0">
   <div ref={box} className="flex-1 relative min-w-0">
    <canvas ref={rt} className="absolute top-0 cursor-row-resize" style={{left:R}} onPointerDown={rulerDown(true)}/><canvas ref={rl} className="absolute left-0 cursor-col-resize" style={{top:R}} onPointerDown={rulerDown(false)}/>
    <div className="absolute left-0 top-0 bg-[#2b2d31]" style={{width:R,height:R}}/>
    <canvas ref={cv} className="absolute" style={{left:R,top:R,cursor:placing?'crosshair':tool==='sel'?'default':'crosshair'}} onPointerDown={down} onContextMenu={ev=>ev.preventDefault()} onDoubleClick={ev=>{const p=wpt(ev)
    if(tool==='node'&&roundable(sel)){const world=cornerPts(sel).map(q=>rotP(sel,q.x,q.y)),hi=world.findIndex(q=>Math.hypot(p.x-q.x,p.y-q.y)<14/view.z)
     if(hi>=0){const link=[...(sel.radLink||(sel.rlink===false?[0,1,2,3]:[0,0,0,0]))];link[hi]=Date.now()+Math.random();upd(sel.id,{radLink:link});setRnSel([hi])}
     return}
    if(tool!=='sel')return;const hit=[...doc.els].reverse().find(e=>(e.t==='text'||e.t==='photo')&&inside(e,p));if(!hit)return
    if(hit.t==='text')setEditText({id:hit.id,value:hit.text});else{snapH();setSel(hit.id);setEditPhoto(hit.id)}}}/>
   </div>
   <div className="w-44 bg-[#25262a] border-l border-[#3c3f45] p-2 overflow-auto"><div className="text-[#888] mb-1">LAYERS</div>
    {[...doc.els].reverse().map(e=><div key={e.id} onClick={ev=>setIds(ev.shiftKey?(ids.includes(e.id)?ids.filter(i=>i!==e.id):[...ids,e.id]):[e.id])} className={'flex items-center gap-1 px-2 py-1 rounded cursor-pointer '+(ids.includes(e.id)?'bg-[#34554f]':'')}>{e.g&&<Icon name="group" size={12}/>}<span>{e.t}{e.field?` · ${e.field}`:''}</span></div>)}</div>
  </div>
  {editText&&(()=>{const e=doc.els.find(x=>x.id===editText.id);if(!e)return null
    const left=R+view.x+e.x*view.z,top=R+view.y+e.y*view.z,w=e.w*view.z,h=e.h*view.z,fz=Math.max(6,e.size*view.z)
    const commitEdit=()=>{upd(editText.id,{text:editText.value});setEditText(null)}
    return <textarea key={e.id} autoFocus className="absolute" style={{left,top,width:w,height:h,transform:`rotate(${e.r||0}deg)`,transformOrigin:'center',
      fontFamily:e.font||'Arial',fontSize:fz,fontWeight:e.bold?700:400,lineHeight:1.2,color:e.color,textAlign:e.align||'left',
      background:'transparent',border:'none',boxShadow:'0 0 0 1px rgba(79,179,162,.6)',outline:'none',resize:'none',padding:0,margin:0,caretColor:e.color,
      whiteSpace:e.wrap?'pre-wrap':'nowrap',overflow:'hidden',zIndex:25,textTransform:e.case==='upper'?'uppercase':e.case==='lower'?'lowercase':e.case==='title'?'capitalize':'none'}}
      value={editText.value} onChange={ev=>setEditText({...editText,value:ev.target.value})}
      onBlur={commitEdit}
      onKeyDown={ev=>{ev.stopPropagation();if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();commitEdit()}if(ev.key==='Escape'){setEditText(null)}}}/>})()}
  {newDialogOpen&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={()=>setNewDialogOpen(false)}>
   <div className="bg-[#2b2d31] border border-[#3c3f45] rounded p-5 w-80 flex flex-col gap-2" onClick={e=>e.stopPropagation()}>
    <div className="text-[#4fb3a2] font-bold">New project</div>
    <button className="text-left px-3 py-2 rounded hover:bg-[#34554f]" onClick={()=>startNew(false)}>ID Card — Front only</button>
    <button className="text-left px-3 py-2 rounded hover:bg-[#34554f]" onClick={()=>startNew(true)}>ID Card — Front and Back</button>
    <div className="text-[#888] text-xs leading-snug">Front and Back share one spreadsheet — each row supplies both sides of a card (e.g. a barcode field for the back, name and photo for the front). Design each side under the Front/Back tabs; exporting "all rows" then gives every card as a front+back pair.</div>
    <button className="self-end mt-1" onClick={()=>setNewDialogOpen(false)}>Cancel</button>
   </div></div>}
  {editPhoto&&(()=>{const e=doc.els.find(x=>x.id===editPhoto);if(!e)return null
   const url=photoURL(rows[cur]||{},e.field,photos)
   return <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={()=>setEditPhoto(null)}>
    <div className="bg-[#2b2d31] border border-[#3c3f45] rounded p-4 flex flex-col gap-2 items-center" onClick={ev=>ev.stopPropagation()}>
     <div className="text-[#4fb3a2] font-bold self-start">Adjust photo</div>
     {!url?<div className="text-[#888] text-sm p-8">No photo loaded for this row yet — showing record {cur+1} of {rows.length||1}.</div>
      :<PhotoAdjuster e={e} url={url} onChange={p=>setDoc(o=>({...o,els:o.els.map(x=>x.id===e.id?{...x,...p}:x)}))}/>}
     <div className="flex gap-2 mt-1"><button onClick={()=>upd(e.id,{cox:0,coy:0,czoom:1})}>Reset</button><button className="!bg-[#0f6b5c]" onClick={()=>setEditPhoto(null)}>Done</button></div>
    </div></div>})()}
  {rCtx&&<div className="fixed inset-0 z-50" onClick={()=>rAction('cancel')} onContextMenu={ev=>ev.preventDefault()}>
   <div className="absolute bg-[#2b2d31] border border-[#3c3f45] rounded py-1 text-sm shadow-lg" style={{left:rCtx.x,top:rCtx.y}} onClick={e=>e.stopPropagation()}>
    <div className="px-3 py-1.5 hover:bg-[#34554f] cursor-pointer" onClick={()=>rAction('clip')}>PowerClip Inside</div>
    <div className="px-3 py-1.5 hover:bg-[#34554f] cursor-pointer" onClick={()=>rAction('fill')}>Copy Fill Here</div>
    <div className="px-3 py-1.5 hover:bg-[#34554f] cursor-pointer" onClick={()=>rAction('copy')}>Copy Here</div>
    <div className="px-3 py-1.5 hover:bg-[#34554f] cursor-pointer" onClick={()=>rAction('move')}>Move Here</div>
    <div className="border-t border-[#3c3f45] my-1"/>
    <div className="px-3 py-1.5 hover:bg-[#34554f] cursor-pointer text-[#e08a8a]" onClick={()=>rAction('cancel')}>Cancel</div>
   </div></div>}
  {exportOpen&&<div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={()=>setExportOpen(false)}>
   <div className="bg-[#2b2d31] border border-[#3c3f45] rounded p-4 w-[26rem] flex flex-col gap-2" onClick={e=>e.stopPropagation()}>
    <div className="text-[#4fb3a2] font-bold mb-1">Export image</div>
    <label className="flex items-center justify-between">Format<select value={exFmt} onChange={e=>setExFmt(e.target.value)}><option value="png">PNG</option><option value="jpeg">JPEG</option></select></label>
    <label className="flex items-center justify-between">Resolution<span className="flex items-center gap-1"><input type="number" className="w-16" value={exDpi} onChange={e=>setExDpi(Math.max(36,parseFloat(e.target.value)||300))}/> dpi</span></label>
    <div className="text-[#888] text-xs text-right">≈ {Math.round(doc.w/10/25.4*exDpi)} × {Math.round(doc.h/10/25.4*exDpi)} px</div>
    {exFmt==='jpeg'&&<label className="flex items-center justify-between">Quality<span className="flex items-center gap-2"><input type="range" min="10" max="100" value={exQ} onChange={e=>setExQ(+e.target.value)}/>{exQ}%</span></label>}
    <label className="flex items-center justify-between">Color mode<select value={exCmyk?'cmyk':'rgb'} onChange={e=>setExCmyk(e.target.value==='cmyk')}><option value="rgb">RGB (screen — recommended)</option><option value="cmyk">CMYK-approximate (print preview)</option></select></label>
    {exCmyk&&<div className="text-[#e0a800] text-xs leading-snug">Browsers can only truly output RGB files. This runs a standard RGB→CMYK→RGB conversion to approximate how colors may shift in print — it is not a real CMYK separation or ICC profile. For press-ready CMYK, convert the exported file in Photoshop/Illustrator or your printer's software.</div>}
    {rows.length>0&&<label className="flex items-center justify-between">Cards<select value={exScope} onChange={e=>setExScope(e.target.value)}><option value="current">Current card only</option><option value="all">All {rows.length} rows (as a .zip)</option></select></label>}
    {hasBack&&<div className="text-[#888] text-xs leading-snug">Front + Back: {exScope==='all'&&rows.length>1?`each card's front and back go into their own .zip, and all of those are bundled into one outer .zip (${rows.length} cards)`:'front and back images are bundled into one .zip'}.</div>}
    <div className="flex justify-end gap-2 mt-2">
     <button onClick={()=>setExportOpen(false)}>Cancel</button>
     <button className="!bg-[#0f6b5c]" disabled={!!busy} onClick={async()=>{setBusy('Exporting…');try{
      if(hasBack){const {front,back}=getBothDocs();await exportFrontBack(front,back,exScope==='all'?rows:[rows[cur]||{}],photos,{format:exFmt,dpi:exDpi,quality:exQ,cmyk:exCmyk})}
      else await exportRaster(doc,exScope==='all'?rows:[rows[cur]||{}],photos,{format:exFmt,dpi:exDpi,quality:exQ,cmyk:exCmyk})
     }catch(err){alert('Export failed: '+err.message)}setBusy('');setExportOpen(false)}}>{busy||'Export'}</button>
    </div>
   </div></div>}
  <div className="h-1.5 cursor-row-resize bg-[#1e1f22] hover:bg-[#4fb3a2]" onPointerDown={ev=>{drag.current={m:'drawer',startY:ev.clientY,startH:drawerH}}} title="Drag to resize"/>
  <DataDrawer doc={doc} rows={rows} setRows={setRows} photos={photos} setPhotos={setPhotos} cur={cur} setCur={setCur} height={drawerH}/>
  <div className="flex gap-4 px-3 py-1 bg-[#2b2d31] border-t border-[#3c3f45] text-[#999] flex-wrap"><span>Record {rows.length?cur+1:0}/{rows.length} (PgUp/PgDn)</span><span>Zoom {Math.round(view.z*100)}%</span><span>{ids.length} selected · {mode} mode</span><span className="ml-auto">{placing?'PowerClip: click the shape to place the content inside (Esc to cancel)':'Drag a shape tool to draw · click selected shape again for rotate/skew · Ctrl+drag = scale from center · right-drag onto another object for more options · F flip · Ctrl+E export · Ctrl+0/F4 fit'}</span></div>
 </div>}
