import qrcode from 'qrcode-generator'
try{if(qrcode.stringToBytesFuncs&&qrcode.stringToBytesFuncs['UTF-8'])qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8']}catch{}
const cache=new Map()
// Returns {n, dark(r,c)} for the given text, or null if it can't be encoded (e.g. too long)
export function qrMatrix(text,ecl='M'){
 const key=ecl+'|'+text;if(cache.has(key))return cache.get(key)
 let out=null
 try{const q=qrcode(0,ecl);q.addData(text);q.make();const n=q.getModuleCount(),bits=[]
  for(let r=0;r<n;r++){const row=new Uint8Array(n);for(let c=0;c<n;c++)row[c]=q.isDark(r,c)?1:0;bits.push(row)}
  out={n,dark:(r,c)=>bits[r][c]===1}}catch{out=null}
 if(cache.size>300)cache.clear();cache.set(key,out);return out}
