import {useRef,useState} from 'react'
import * as XLSX from 'xlsx'
import {fields,photoURL,setPhoto,exportPDF,save} from '../lib/data'
export default function DataDrawer({doc,rows,setRows,photos,setPhotos,cur,setCur,height}){
 const F=fields(doc),fx=useRef(),fd=useRef(),fi=useRef(),fr=useRef(),tg=useRef(),[note,setNote]=useState('Tick "Input field" on a text or photo element, then import or type rows.'),[busy,setBusy]=useState(''),[dpi,setDpi]=useState(300),[sheet,setSheet]=useState(false)
 const addPhotos=fs=>{const p={...photos};let n=0;[...fs].forEach(f=>{if(f.type.startsWith('image/')){setPhoto(p,f.name,URL.createObjectURL(f));n++}});setPhotos(p);setNote(n+' photo(s) loaded. Matched by filename in the photo column, or a filename equal to any other cell in the row.')}
 const imp=async f=>{try{const wb=XLSX.read(await f.arrayBuffer()),js=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:'',raw:false}),map={},H=js.length?Object.keys(js[0]):[]
  H.forEach(h=>{const m=F.find(x=>x.n.toLowerCase()===h.trim().toLowerCase());if(m)map[h]=m.n})
  setRows(js.map(o=>{const r={};for(const h in map)r[map[h]]=String(o[h]).trim();return r}));setCur(0)
  setNote(`Imported ${js.length} rows. Matched: ${Object.keys(map).join(', ')||'none'}. Ignored: ${H.filter(h=>!map[h]).join(', ')||'none'}.`)}catch{setNote('Could not read that file.')}}
 const pdf=async()=>{if(!rows.length)return setNote('Add or import rows first.');setBusy('Rendering…');await exportPDF(doc,rows,photos,{dpi,sheet},i=>setBusy(`Rendering ${i}/${rows.length}`));setBusy('')}
 const set=(i,f,v)=>setRows(rows.map((r,j)=>j===i?{...r,[f]:v}:r))
 return <div className="flex flex-col bg-[#25262a] border-t border-[#3c3f45] overflow-hidden" style={{height}}>
  <div className="flex flex-wrap items-center gap-2 px-2 py-1 border-b border-[#3c3f45]">
   <button onClick={()=>fx.current.click()}>Import spreadsheet</button><button onClick={()=>fd.current.click()}>Photo folder</button><button onClick={()=>fi.current.click()}>Photos</button>
   <button onClick={()=>setRows([...rows,{}])}>+ Row</button><button onClick={()=>F.length&&save('template.csv',new Blob([F.map(f=>`"${f.n}"`).join(',')+'\n']))}>Template CSV</button><button onClick={()=>{setRows([]);setCur(0)}}>Clear</button>
   <span className="ml-auto flex items-center gap-2"><select className="bg-[#2b2d31]" value={sheet?'s':'o'} onChange={e=>setSheet(e.target.value==='s')}><option value="o">One per page</option><option value="s">A4 sheet</option></select>
   <select className="bg-[#2b2d31]" value={dpi} onChange={e=>setDpi(+e.target.value)}><option>150</option><option>300</option></select>
   <button className="!bg-[#0f6b5c]" disabled={!!busy} onClick={pdf}>{busy||'Export PDF'}</button></span>
   <input ref={fx} type="file" hidden accept=".xlsx,.xls,.csv" onChange={e=>{e.target.files[0]&&imp(e.target.files[0]);e.target.value=''}}/>
   <input ref={fd} type="file" hidden multiple webkitdirectory="" onChange={e=>{addPhotos(e.target.files);e.target.value=''}}/>
   <input ref={fi} type="file" hidden multiple accept="image/*" onChange={e=>{addPhotos(e.target.files);e.target.value=''}}/>
   <input ref={fr} type="file" hidden accept="image/*" onChange={e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const p={...photos};setPhoto(p,f.name,URL.createObjectURL(f));setPhotos(p);set(tg.current.i,tg.current.f,f.name)}}/>
  </div>
  <div className="text-[#999] px-2 text-xs">{note}</div>
  <div className="flex-1 overflow-auto"><table className="w-full text-xs"><thead className="sticky top-0 bg-[#25262a] text-[#999]"><tr><th className="text-left px-1">#</th>{F.map(f=><th key={f.n} className="text-left">{f.n}</th>)}<th/></tr></thead>
   <tbody>{rows.map((r,i)=><tr key={i} onClick={()=>setCur(i)} className={i===cur?'bg-[#2f3a38]':''}><td className="px-1">{i+1}</td>
    {F.map(f=><td key={f.n}><input className="w-32" value={r[f.n]??''} onChange={e=>set(i,f.n,e.target.value)}/>{f.p&&<button className="!py-0" onClick={()=>{tg.current={i,f:f.n};fr.current.click()}}>{photoURL(r,f.n,photos)?'✓':'+'}</button>}</td>)}
    <td><button className="!py-0" onClick={e=>{e.stopPropagation();setRows(rows.filter((_,j)=>j!==i));setCur(Math.min(cur,Math.max(0,rows.length-2)))}}>×</button></td></tr>)}</tbody></table></div>
 </div>}
