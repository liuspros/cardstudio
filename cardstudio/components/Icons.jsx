export default function Icon({name,size=16}){
 const p={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round'}
 switch(name){
  case'select':return <svg {...p}><path d="M5 3l14 8-6 1.4L11 19z"/></svg>
  case'eye':return <svg {...p}><path d="M5 19l3-1 10-10a1.6 1.6 0 00-2.2-2.2L6 16z"/><path d="M3.5 20.5L5 19l1.5 1.5L5 22z" fill="currentColor" stroke="none"/></svg>
  case'pen':return <svg {...p}><path d="M4 20l3-.8L19 7.2a1.7 1.7 0 00-2.4-2.4L4.8 17z"/><circle cx="18" cy="6" r="1.1" fill="currentColor" stroke="none"/></svg>
  case'node':return <svg {...p}><path d="M12 3l9 9-9 9-9-9z"/><circle cx="12" cy="3" r="1.3" fill="currentColor" stroke="none"/><circle cx="21" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="21" r="1.3" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>
  case'convert':return <svg {...p}><path d="M20 12A8 8 0 105.6 16.5"/><path d="M20 5.5V12h-6.5"/></svg>
  case'text':return <svg {...p}><path d="M5 6h14M12 6v13"/></svg>
  case'photo':return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-5 4 4 3-3 6 6"/></svg>
  case'rect':return <svg {...p}><rect x="4" y="6" width="16" height="12" rx="1.5"/></svg>
  case'ellipse':return <svg {...p}><ellipse cx="12" cy="12" rx="8" ry="6"/></svg>
  case'tri':return <svg {...p}><path d="M12 4.5l8.5 15h-17z"/></svg>
  case'star':return <svg {...p}><path d="M12 3l2.5 5.8L21 9.6l-4.6 4.2 1.2 7.2L12 17.6 6.4 21l1.2-7.2L3 9.6l6.5-.8z"/></svg>
  case'fit':return <svg {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
  case'flipH':return <svg {...p}><path d="M12 3v18" strokeDasharray="2 2"/><path d="M6 7l-3 5 3 5M18 7l3 5-3 5"/></svg>
  case'flipV':return <svg {...p}><path d="M3 12h18" strokeDasharray="2 2"/><path d="M7 6L2 9l5 3M7 18l-5-3 5-3M17 6l5 3-5 3M17 18l5-3-5-3"/></svg>
  case'alignL':return <svg {...p}><path d="M4 3v18"/><rect x="6" y="6" width="9" height="4"/><rect x="6" y="14" width="5" height="4"/></svg>
  case'alignCH':return <svg {...p}><path d="M12 3v18" strokeDasharray="2 2"/><rect x="7" y="6" width="10" height="4"/><rect x="9" y="14" width="6" height="4"/></svg>
  case'alignR':return <svg {...p}><path d="M20 3v18"/><rect x="9" y="6" width="9" height="4"/><rect x="13" y="14" width="5" height="4"/></svg>
  case'alignT':return <svg {...p}><path d="M3 4h18"/><rect x="6" y="6" width="4" height="9"/><rect x="14" y="6" width="4" height="5"/></svg>
  case'alignCV':return <svg {...p}><path d="M3 12h18" strokeDasharray="2 2"/><rect x="6" y="7" width="4" height="10"/><rect x="14" y="9" width="4" height="6"/></svg>
  case'alignB':return <svg {...p}><path d="M3 20h18"/><rect x="6" y="9" width="4" height="9"/><rect x="14" y="13" width="4" height="5"/></svg>
  case'group':return <svg {...p}><rect x="3" y="3" width="12" height="12" rx="1.5" strokeDasharray="3 2"/><rect x="9" y="9" width="12" height="12" rx="1.5" strokeDasharray="3 2"/></svg>
  case'unite':return <svg {...p}><circle cx="9" cy="12" r="6.5" fill="currentColor" stroke="none" opacity=".8"/><circle cx="15" cy="12" r="6.5" fill="currentColor" stroke="none" opacity=".8"/></svg>
  case'intersect':return <svg {...p}><circle cx="9" cy="12" r="6.5"/><circle cx="15" cy="12" r="6.5"/><path d="M12 5.7a6.5 6.5 0 010 12.6 6.5 6.5 0 010-12.6z" fill="currentColor" stroke="none"/></svg>
  case'subtract':return <svg {...p}><circle cx="9" cy="12" r="6.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="6.5" fill="#25262a" stroke="currentColor"/></svg>
  case'exclude':return <svg {...p}><circle cx="9" cy="12" r="6.5"/><circle cx="15" cy="12" r="6.5"/></svg>
  case'break':return <svg {...p}><circle cx="6" cy="6" r="1.8"/><circle cx="6" cy="18" r="1.8"/><path d="M19.5 4.5L8 16M13.5 12.5l6 6"/></svg>
  case'clip':return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h6a2 2 0 012 2v8" opacity=".55"/></svg>
  case'extract':return <svg {...p}><rect x="3" y="3" width="10" height="10" rx="1.5"/><path d="M14 10l6.5-6.5M14.5 3.5H21v6.5"/></svg>
  case'link':return <svg {...p}><path d="M9.5 14.5l5-5"/><path d="M8 16a3.2 3.2 0 010-4.5l2-2"/><path d="M16 8a3.2 3.2 0 010 4.5l-2 2"/></svg>
  case'unlink':return <svg {...p}><path d="M7 17a3.2 3.2 0 010-4.5l1.3-1.3"/><path d="M17 7a3.2 3.2 0 010 4.5l-1.3 1.3"/><path d="M4 4l16 16" opacity=".6"/></svg>
  case'qr':return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14.5" y="14.5" width="2.5" height="2.5" fill="currentColor" stroke="none"/><rect x="18" y="14.5" width="2.5" height="2.5" fill="currentColor" stroke="none"/><rect x="14.5" y="18" width="2.5" height="2.5" fill="currentColor" stroke="none"/><rect x="18" y="18" width="2.5" height="2.5" fill="currentColor" stroke="none"/></svg>
  case'edit':return <svg {...p}><rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M7 12h10"/></svg>
  case'linear':return <svg {...p}><path d="M4 18L20 6"/></svg>
  case'radial':return <svg {...p}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="2 2"/></svg>
  default:return null
 }}
