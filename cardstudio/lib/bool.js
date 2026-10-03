import {toPath,absOf,fromAbs,normOf,rotA} from './path'
export async function booleanOp(S,op,nid){
 const paper=(await import('paper/dist/paper-core')).default;paper.setup(new paper.Size(10,10))
 const pt=(x,y)=>new paper.Point(x,y)
 const ctr=(A,closed)=>{const p=new paper.Path({insert:false,closed});A.forEach(n=>p.add(new paper.Segment(pt(n.x,n.y),n.a?pt(n.a[0]-n.x,n.a[1]-n.y):null,n.b?pt(n.b[0]-n.x,n.b[1]-n.y):null)));return p}
 const item=e=>{if(e.t==='path'){const cs=[ctr(absOf(e),e.closed),...(e.more||[]).map(m=>ctr(absOf({...e,pts:m.pts}),m.closed))];return cs.length>1?new paper.CompoundPath({children:cs,insert:false,fillRule:'evenodd'}):cs[0]}
  if(e.t==='rect'&&e.radius){const p=new paper.Path.Rectangle({point:pt(e.x,e.y),size:new paper.Size(e.w,e.h),radius:e.radius,insert:false});if(e.r)p.rotate(e.r,pt(e.x+e.w/2,e.y+e.h/2));return p}
  return ctr(rotA(toPath(e),e),true)}
 let r=item(S[0]);for(const e of S.slice(1))r=r[op](item(e),{insert:false})
 const cs=(r.children?[...r.children]:[r]).filter(c=>c.segments&&c.segments.length>1).sort((a,b)=>Math.abs(b.area)-Math.abs(a.area));if(!cs.length)return null
 const As=cs.map(c=>c.segments.map(s=>({x:s.point.x,y:s.point.y,sm:0,a:s.handleIn.isZero()?null:[s.point.x+s.handleIn.x,s.point.y+s.handleIn.y],b:s.handleOut.isZero()?null:[s.point.x+s.handleOut.x,s.point.y+s.handleOut.y]})))
 const bb=fromAbs(As.flat()),b0=S[0]
 return[{t:'path',id:nid(),fill:b0.fill,fill2:b0.fill2,ang:b0.ang,stroke:b0.stroke,sw:b0.sw,op:b0.op,x:bb.x,y:bb.y,w:bb.w,h:bb.h,closed:true,rule:'evenodd',pts:normOf(As[0],bb),more:As.length>1?As.slice(1).map((A,i)=>({closed:true,pts:normOf(A,bb)})):undefined}]}
