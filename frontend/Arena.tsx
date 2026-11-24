import React from 'react';
import {materials,Kind,Piece,Level,Frame} from './types';
export function Alpaca({x,y,rotation=0}:{x:number,y:number,rotation?:number}){
 return <g transform={`translate(${x} ${y}) rotate(${rotation})`} stroke="#443e40" strokeWidth="2" strokeLinejoin="round"><path fill="#e7d0a5" d="M-17 5q-9-7-6-12l7 4q8-7 18-2l2-15-2-9q2-5 6 5l4-8q5-2 3 11l7 6q3 6-7 6l-1 15-4 6-2 9h-5l-1-10-12 1-3 8h-5l1-13Z"/><path fill="#64c9b9" d="m1-3 12 3-2 6L0 1z"/><circle cx="12" cy="-15" r="1.7" fill="#302f33"/></g>
}
export function Glyph({kind}:{kind:Kind}){
 const m=materials[kind];
 return <svg viewBox="-25 -21 50 42" width="38" height="34" aria-hidden="true"><g transform={`scale(${Math.min(38/m.w,32/m.h)})`}><Shape kind={kind}/></g></svg>
}
function Shape({kind}:{kind:Kind}){
 const m=materials[kind],w=m.w,h=m.h;
 if(kind==='target')return <g stroke="#563b3d" strokeWidth="2"><circle r="16" fill={m.color}/><circle r="10" fill="none" stroke="#ffe2b9"/><circle r="4" fill="#ffe2b9" stroke="none"/></g>;
 if(kind==='ball')return <circle r="16" fill={m.color} stroke="#756780" strokeWidth="3"/>;
 return <g><rect x={-w/2} y={-h/2} width={w} height={h} rx="2" fill={m.color} stroke={kind==='glass'?'#bee9ea':'#4b4641'} strokeWidth="2"/>{(kind==='wood'||kind==='beam')?<path d={`M${-w*.4} ${-h*.27}q${w*.32} ${h*.15} ${w*.68} 0 M${-w*.33} ${h*.27}q${w*.38} ${-h*.12} ${w*.72} 0`} fill="none" stroke="#97623e" strokeWidth="2"/>:null}</g>
}
type Props={level:Level,frame?:Frame,trail:number[][],selected:string,grid:boolean,locked:boolean,onPlace:(k:Kind,x:number,y:number)=>void,onMove:(id:string,x:number,y:number)=>void,onSelect:(id:string)=>void};
export function Arena({level,frame,trail,selected,grid,locked,onPlace,onMove,onSelect}:Props){
 const ref=React.useRef<SVGSVGElement>(null),drag=React.useRef<string|null>(null);
 const [ghost,setGhost]=React.useState<{id:string,x:number,y:number}|null>(null);
 function point(e:{clientX:number,clientY:number}){
  const svg=ref.current!,p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
  return [Math.min(884,Math.max(16,grid?Math.round(p.x/8)*8:p.x)),Math.min(392,Math.max(16,grid?Math.round(p.y/8)*8:p.y))];
 }
 const alp=frame?.find(p=>p[0]==='@');
 return <svg ref={ref} className="arena" viewBox="0 0 900 440" aria-label="Plansza symulacji" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const k=e.dataTransfer.getData('material') as Kind;if(!locked&&k in materials){const [x,y]=point(e);onPlace(k,x,y)}}}
 onPointerMove={e=>{if(drag.current&&!locked){const [x,y]=point(e);setGhost({id:drag.current,x,y})}}}
 onPointerUp={e=>{if(drag.current&&!locked&&ghost){const [x,y]=point(e);onMove(drag.current,x,y)}drag.current=null;setGhost(null)}} onPointerCancel={()=>{drag.current=null;setGhost(null)}}>
 <defs><linearGradient id="sky" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#233949"/><stop offset=".58" stopColor="#668083"/><stop offset="1" stopColor="#d8ae8a"/></linearGradient><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#d7efe9" strokeOpacity=".14" strokeWidth=".8"/></pattern></defs>
 <rect width="900" height="440" fill="url(#sky)"/><circle cx="718" cy="105" r="35" fill="#f6d4a3" opacity=".88"/>
 <path fill="#718885" d="M0 275 80 234 149 249 250 171 293 194 336 153 411 221 501 183 578 229 678 173 752 221 829 151 900 182V422H0Z"/>
 <path fill="#536e70" d="m0 317 117-74 48 16 99-62 78 67 95-28 69 34 84-65 67 29 97-43 75 39 71-32v223H0Z"/>
 <path fill="#3e595b" d="m0 348 81-45 95 15 113-54 78 17 60 36 95-34 104 17 93-45 104 17 77-29v165H0Z"/>
 <path fill="#344c4c" d="M0 372q124-41 223-18t193-9 212 4 272-36v103H0Z"/>
 <rect y="400" width="900" height="40" fill="#3b3832"/><path d="M0 400h900" stroke="#d4ab72" strokeWidth="5"/>
 {grid&&<rect width="900" height="400" fill="url(#grid)" pointerEvents="none"/>}
 <path d="m96 397 7-40-13-35m14 38 24-40" fill="none" stroke="#4e3930" strokeWidth="13" strokeLinecap="round"/><path d="m89 324 21 11 19-15" fill="none" stroke="#b78663" strokeWidth="4"/>
 <polyline fill="none" stroke="#f4cf80" strokeWidth="2" strokeDasharray="4 5" points={trail.map(p=>p.join(',')).join(' ')}/>
 {level.objects.map(o=>{const pos=frame?.find(p=>p[0]===o.id);if(frame&&!pos)return null;
 const xy=ghost?.id===o.id?ghost:{x:pos?.[1]??o.x,y:pos?.[2]??o.y};
 return <g key={o.id} style={{cursor:locked?'default':'grab'}} transform={`translate(${xy.x} ${xy.y}) rotate(${pos?pos[3]*180/Math.PI:o.rotation})`}
 onPointerDown={e=>{if(locked)return;onSelect(o.id);drag.current=o.id;e.currentTarget.setPointerCapture(e.pointerId)}}><Shape kind={o.type}/>{selected===o.id&&!locked&&<rect x={-materials[o.type].w/2-4} y={-materials[o.type].h/2-4} width={materials[o.type].w+8} height={materials[o.type].h+8} rx="3" stroke="#bbffe8" fill="none" strokeDasharray="4 3"/>}</g>})}
 <Alpaca x={alp?.[1]??110} y={alp?.[2]??335} rotation={(alp?.[3]??0)*180/Math.PI}/></svg>
}

