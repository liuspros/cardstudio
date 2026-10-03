import {useRef,useEffect,useState} from 'react'
export default function PhotoAdjuster({e,url,onChange}){
 const cv=useRef(),img=useRef(),drag=useRef(null),[,bump]=useState(0)
 const PW=280,PH=Math.max(40,Math.round(PW*e.h/e.w)),k=PW/e.w
 useEffect(()=>{const i=new Image();i.onload=()=>{img.current=i;bump(x=>x+1)};i.src=url},[url])
 const draw=()=>{const c=cv.current;if(!c)return;c.width=PW;c.height=PH;const x=c.getContext('2d')
  x.fillStyle='#111';x.fillRect(0,0,PW,PH);const im=img.current
  if(im){const base=Math.max(PW/im.naturalWidth,PH/im.naturalHeight)*(e.czoom||1),dw=im.naturalWidth*base,dh=im.naturalHeight*base
   let dx=(PW-dw)/2+(e.cox||0)*k,dy=(PH-dh)/2+(e.coy||0)*k
   dx=Math.min(0,Math.max(PW-dw,dx));dy=Math.min(0,Math.max(PH-dh,dy))
   if(Number.isFinite(dw)&&Number.isFinite(dh))x.drawImage(im,dx,dy,dw,dh)}
  x.strokeStyle='#4fb3a2';x.lineWidth=2;x.strokeRect(1,1,PW-2,PH-2)}
 useEffect(draw)
 const down=ev=>{drag.current={x:ev.clientX,y:ev.clientY,cox:e.cox||0,coy:e.coy||0}}
 const move=ev=>{if(!drag.current)return;onChange({cox:drag.current.cox+(ev.clientX-drag.current.x)/k,coy:drag.current.coy+(ev.clientY-drag.current.y)/k})}
 const up=()=>drag.current=null
 return <div className="flex flex-col items-center gap-2">
  <canvas ref={cv} style={{cursor:'move',touchAction:'none',borderRadius:4}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}/>
  <div className="flex items-center gap-2 text-xs text-[#aaa] w-full"><span>Zoom</span><input type="range" min="50" max="300" className="flex-1" value={Math.round((e.czoom||1)*100)} onChange={ev=>onChange({czoom:ev.target.value/100})}/></div>
  <div className="text-[10px] text-[#777]">Drag the photo to reposition it inside the frame.</div>
 </div>}
