export const TRACE_PRESETS={
 'Line Art':{ltres:1,qtres:1,pathomit:14,numberofcolors:2,blurradius:2,blurdelta:20,strokewidth:0,rightangleenhance:false},
 'Logo':{ltres:1,qtres:1,pathomit:10,numberofcolors:4,blurradius:2,blurdelta:20,strokewidth:0},
 'Detailed Logo':{ltres:.5,qtres:.5,pathomit:5,numberofcolors:10,blurradius:1,blurdelta:20,strokewidth:0},
 'Clipart':{ltres:1,qtres:1,pathomit:10,numberofcolors:6,blurradius:2,blurdelta:20,strokewidth:0},
 'Low Quality Image':{ltres:2,qtres:2,pathomit:35,numberofcolors:5,blurradius:3,blurdelta:24,strokewidth:0},
 'High Quality Image':{ltres:.5,qtres:.5,pathomit:3,numberofcolors:16,blurradius:1,blurdelta:20,strokewidth:0}}
export async function traceImage(src,preset){
 const IT=(await import('imagetracerjs')).default
 const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=src})
 const max=700,k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight))
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*k));c.height=Math.max(1,Math.round(img.naturalHeight*k))
 const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(img,0,0,c.width,c.height)
 const data=x.getImageData(0,0,c.width,c.height)
 const svg=IT.imagedataToSVG(data,{...TRACE_PRESETS[preset],scale:1,viewbox:true})
 return{svg,w:c.width,h:c.height}}
