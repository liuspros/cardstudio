const K=.5523
export const bez=(a,b,c,d,t)=>{const u=1-t;return[0,1].map(i=>u*u*u*a[i]+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i])}
export const absOf=e=>e.pts.map(n=>({x:e.x+n.x*e.w,y:e.y+n.y*e.h,sm:n.sm,a:n.a&&[e.x+n.a[0]*e.w,e.y+n.a[1]*e.h],b:n.b&&[e.x+n.b[0]*e.w,e.y+n.b[1]*e.h]}))
export function fromAbs(a){const xs=a.map(n=>n.x),ys=a.map(n=>n.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(1,Math.max(...xs)-x),h=Math.max(1,Math.max(...ys)-y),N=q=>q&&[(q[0]-x)/w,(q[1]-y)/h]
 return{x,y,w,h,pts:a.map(n=>({x:(n.x-x)/w,y:(n.y-y)/h,a:N(n.a),b:N(n.b),sm:n.sm}))}}
export function toPath(e){const {x,y,w,h}=e,cx=x+w/2,cy=y+h/2,P=l=>l.map(([px,py])=>({x:px,y:py}))
 if(e.t==='ellipse'){const kx=K*w/2,ky=K*h/2;return[{x:cx,y,sm:1,a:[cx-kx,y],b:[cx+kx,y]},{x:x+w,y:cy,sm:1,a:[x+w,cy-ky],b:[x+w,cy+ky]},{x:cx,y:y+h,sm:1,a:[cx+kx,y+h],b:[cx-kx,y+h]},{x,y:cy,sm:1,a:[x,cy+ky],b:[x,cy-ky]}]}
 if(e.t==='tri')return P([[cx,y],[x+w,y+h],[x,y+h]])
 if(e.t==='star')return P([...Array(10)].map((_,i)=>{const r=i%2?.4:1,t=-Math.PI/2+i*Math.PI/5;return[cx+Math.cos(t)*r*w/2,cy+Math.sin(t)*r*h/2]}))
 return P([[x,y],[x+w,y],[x+w,y+h],[x,y+h]])}
export function splitSeg(A,i,j,t){const m=A[i],n=A[j],p0=[m.x,m.y],p3=[n.x,n.y],p1=m.b||p0,p2=n.a||p3,L=(a,b)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
 const q0=L(p0,p1),q1=L(p1,p2),q2=L(p2,p3),r0=L(q0,q1),r1=L(q1,q2),s=L(r0,r1),cv=m.b||n.a
 const B=A.map(z=>({...z}));if(cv){B[i].b=q0;B[j].a=q2}B.splice(i+1,0,cv?{x:s[0],y:s[1],a:r0,b:r1,sm:1}:{x:s[0],y:s[1]});return B}
export const normOf=(A,b)=>A.map(n=>({x:(n.x-b.x)/b.w,y:(n.y-b.y)/b.h,sm:n.sm,a:n.a&&[(n.a[0]-b.x)/b.w,(n.a[1]-b.y)/b.h],b:n.b&&[(n.b[0]-b.x)/b.w,(n.b[1]-b.y)/b.h]}))
export const rotA=(A,e)=>{if(!e.r)return A;const cx=e.x+e.w/2,cy=e.y+e.h/2,co=Math.cos(e.r*Math.PI/180),sn=Math.sin(e.r*Math.PI/180),R=q=>q&&[cx+(q[0]-cx)*co-(q[1]-cy)*sn,cy+(q[0]-cx)*sn+(q[1]-cy)*co]
 return A.map(n=>{const r=R([n.x,n.y]);return{...n,x:r[0],y:r[1],a:R(n.a),b:R(n.b)}})}
