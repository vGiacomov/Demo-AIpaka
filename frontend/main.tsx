import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Arena,Glyph,Alpaca} from './Arena';
import {Chart,Analysis} from './Analysis';
import {api,materials,defaults,Kind,Piece,Level,Config,Row,State,Result} from './types';
import './style.css';

const initial:Level={name:'Moja arena',objects:[]};
const idle:State={status:'idle',run:null,episodes:0,total:0,seconds:0,updates:0,gradient_steps:0,best:null,evaluation:null,error:null};
const labels:Record<string,string>={idle:'Gotowy',running:'Trening',pausing:'Wstrzymywanie',paused:'Pauza',stopping:'Zatrzymywanie',stopped:'Zatrzymany',complete:'Ukończony',failed:'Błąd'};
const configNames:Record<keyof Config,string>={total:'Epizody',seed:'Seed',lr:'Learning rate',rollout:'Rollout',epochs:'Epoki PPO',max_steps:'Limit kroków fizyki',angle_min:'Kąt min.',angle_max:'Kąt maks.',power_min:'Siła min.',power_max:'Siła maks.'};
type Experiment={level:Level,config:Config};
type Playback={result:Result,level:Level,title:string,index:number,angle:number,power:number};
function App(){
 const [level,setLevel]=useState(initial),[config,setConfig]=useState(defaults),[choices,setChoices]=useState<{id:string,name:string}[]>([]);
 const [selected,select]=useState(''),[past,setPast]=useState<Level[]>([]),[future,setFuture]=useState<Level[]>([]);
 const [state,setState]=useState(idle),[rows,setRows]=useState<Row[]>([]),[online,setOnline]=useState(false),[message,note]=useState('');
 const [grid,setGrid]=useState(true),[analysis,setAnalysis]=useState(false),[speed,setSpeed]=useState(1),[busy,setBusy]=useState(false);
 const [angle,setAngle]=useState(45),[power,setPower]=useState(70),[play,setPlay]=useState<Playback|null>(null);
 const exp=useRef<Experiment|null>(null),run=useRef<string|null>(null),ticket=useRef(0),auto=useRef(0),importer=useRef<HTMLInputElement>(null);
 const active=['running','paused','pausing','stopping'].includes(state.status),locked=active||busy;
 const chosen=level.objects.find(o=>o.id===selected),last=rows.at(-1);
 function fail(e:unknown){note(e instanceof Error?e.message:String(e))}
 async function refresh(){setChoices(await api('levels'))}
 useEffect(()=>{refresh().catch(fail);let closed=false,timer=0,ws:WebSocket;
  function connect(){let first=true;ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws/training`);
   ws.onopen=()=>setOnline(true);
   ws.onmessage=e=>{const d=JSON.parse(e.data) as {state:State,rows:Row[],experiment:Experiment|null};
    const changed=run.current!==d.state.run;
    if(changed||first){setRows(d.rows);if(changed){auto.current=0;setPlay(null)}if(d.experiment&&(changed||['running','paused','pausing','stopping'].includes(d.state.status))){setLevel(d.experiment.level);setConfig(d.experiment.config)}}
    else if(d.rows.length)setRows(prev=>prev.concat(d.rows));
    first=false;run.current=d.state.run;exp.current=d.experiment;setState(d.state);
   };ws.onclose=()=>{setOnline(false);if(!closed)timer=window.setTimeout(connect,1200)};
  } connect();return()=>{closed=true;clearTimeout(timer);ws.close()}
 },[]);
 function clearReplay(){ticket.current++;setPlay(null)}
 function edit(next:Level){if(locked)return;clearReplay();setPast(p=>[...p.slice(-59),level]);setFuture([]);setLevel(next)}
 function add(type:Kind,x=450,y=350){if(level.objects.length>=32){note('Limit 32 obiektów.');return}const id=crypto.randomUUID();edit({...level,objects:[...level.objects,{type,id,x,y,rotation:0}]});select(id)}
 function change(id:string,fields:Partial<Piece>){edit({...level,objects:level.objects.map(o=>o.id===id?{...o,...fields}:o)})}
 async function shot(a:number,p:number,title:string,source:Experiment={level,config},stability=false){
  const id=++ticket.current;
  try{const result=await api<Result>('simulation/shot',{...source,angle:a,power:p,stability});
   if(ticket.current!==id)return;
   setPlay({result,level:source.level,title,index:0,angle:a,power:p});
   if(stability)note(result.unstable?'Uwaga: konstrukcja przemieszcza się pod własnym ciężarem.':'Konstrukcja stabilna w badanym czasie.');
  }catch(e){if(ticket.current===id)fail(e)}
 }
 function replay(r:Row){if(exp.current)void shot(r.angle,r.power,'Epizod '+r.episode,exp.current)}
 const animating=!!play&&play.index<play.result.frames.length-1;
 useEffect(()=>{if(!animating||!speed)return;const t=setInterval(()=>setPlay(s=>s?{...s,index:Math.min(s.index+1,s.result.frames.length-1)}:null),50/speed);return()=>clearInterval(t)},[animating,speed]);
 useEffect(()=>{if(state.status==='running'&&speed&&last&&!animating&&last.episode>auto.current){auto.current=last.episode;replay(last)}},[state.status,speed,last,animating]);
 async function start(){setBusy(true);clearReplay();note('');try{await api('training/start',{level,config})}catch(e){fail(e)}finally{setBusy(false)}}
 async function compare(){setBusy(true);try{const r=await api<{best:Row,mean:number}>('simulation/grid',{level,config});note(`Siatka 126 akcji · średnia ${r.mean.toFixed(1)} · najlepsza ${r.best.reward.toFixed(1)} pkt (${r.best.angle.toFixed(1)}°, ${r.best.power.toFixed(1)}%).`)}catch(e){fail(e)}finally{setBusy(false)}}
 async function load(id:string){if(!id)return;try{edit(await api<Level>('levels/'+id));select('');note('')}catch(e){fail(e)}}
 function download(data:unknown,name:string){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 const frame=play?.result.frames[play.index],trail=play?.result.frames.slice(0,play.index+1).flatMap(f=>{const p=f.find(v=>v[0]==='@');return p?[[p[1],p[2]]]:[]})??[];
 return <><header><div className="identity"><svg viewBox="-26 -38 54 66"><Alpaca x={0} y={0}/></svg><b>Alpaca <em>RL</em></b></div><nav><button className={!analysis?'tab on':'tab'} onClick={()=>setAnalysis(false)}>Laboratorium</button><button className={analysis?'tab on':'tab'} onClick={()=>setAnalysis(true)}>Analiza</button></nav><span className="connection"><i className={online?'lit':''}/>{online?'Silnik online':'Łączenie…'}</span></header>
 <main><div className="heading"><div><small>UCZENIE ZE WZMOCNIENIEM</small><h1>{analysis?'Analiza eksperymentu':'Laboratorium alpaki'}</h1></div><span className="model">PPO <span> / </span> Matter.js</span></div>
 {message||state.error?<div role="status" className="notice">{state.error||message}<button onClick={()=>note('')}>×</button></div>:null}
 <div className="workspace"><aside className="panel"><small>EDYTOR</small><h2>Elementy</h2><p>Przeciągnij na planszę lub kliknij element.</p><div className="palette">{(Object.keys(materials) as Kind[]).map(k=><button key={k} draggable={!locked} onDragStart={e=>e.dataTransfer.setData('material',k)} disabled={locked} onClick={()=>add(k)}><Glyph kind={k}/>{materials[k].name}<span>+</span></button>)}</div><hr/><h3>Obiekty <em>{level.objects.length}/32</em></h3><select value={chosen?.id??''} onChange={e=>select(e.target.value)}><option value="">Wybierz obiekt</option>{level.objects.map((o,i)=><option key={o.id} value={o.id}>{i+1}. {materials[o.type].name}</option>)}</select>
 {chosen&&<fieldset disabled={locked}>{(['x','y','rotation'] as const).map(k=><label key={k}>{k==='rotation'?'Obrót':k.toUpperCase()}<input type="number" value={chosen[k]} onChange={e=>change(chosen.id,{[k]:Math.min(k==='x'?900:k==='y'?400:360,Math.max(k==='rotation'?-360:0,+e.target.value))})}/></label>)}<button onClick={()=>edit({...level,objects:level.objects.filter(o=>o.id!==selected)})}>Usuń element</button></fieldset>}
 </aside><div className="center"><section className="panel stage"><div className="stagehead"><div><small>ŚRODOWISKO 2D</small><h2>{play?.level.name??level.name}</h2></div><select aria-label="Scenariusz" disabled={locked} value="" onChange={e=>load(e.target.value)}><option value="">Wczytaj poziom</option>{choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><Arena level={play?.level??level} frame={frame} trail={trail} selected={selected} grid={grid} locked={locked||!!play} onPlace={add} onMove={(id,x,y)=>change(id,{x,y})} onSelect={select}/>
 <div className="stagefoot"><span>{play?play.title:'Tryb budowy'}</span><button onClick={()=>setGrid(!grid)}>Siatka {grid?'✓':'○'}</button><button disabled={locked||!past.length} onClick={()=>{clearReplay();setFuture([level,...future]);setLevel(past[past.length-1]);setPast(past.slice(0,-1))}}>↶ Cofnij</button><button disabled={locked||!future.length} onClick={()=>{clearReplay();setPast([...past,level]);setLevel(future[0]);setFuture(future.slice(1))}}>↷ Ponów</button></div></section>
 {play&&<section className="panel"><h3>{play.title} <em>{play.result.reward.toFixed(1)} pkt</em></h3><p>{play.angle.toFixed(1)}° · {play.power.toFixed(1)}% siły · zniszczone cele {(play.result.destroyed*100).toFixed(0)}%</p><p>{Object.entries(play.result.parts).map(([k,v])=>k+' '+v.toFixed(1)).join(' · ')}</p><button onClick={clearReplay}>Wróć do konstrukcji</button></section>}
 <section className="panel"><div className="sectionhead"><h2>Sterowanie</h2><select aria-label="Szybkość odtwarzania" value={speed} onChange={e=>{setSpeed(+e.target.value);if(+e.target.value===0)clearReplay()}}><option value=".5">0,5×</option><option value="1">1× animacja</option><option value="4">4× animacja</option><option value="0">Bez renderowania</option></select></div>
 <div className="actions"><button className="primary" disabled={locked||!online||!level.objects.some(o=>o.type==='target')} onClick={start}>▶ Rozpocznij trening</button><button disabled={!['running','paused'].includes(state.status)} onClick={()=>api('training/'+(state.status==='paused'?'resume':'pause'),{}).catch(fail)}>{state.status==='paused'?'Wznów':'Pauza'}</button><button disabled={!active} onClick={()=>api('training/stop',{}).catch(fail)}>Stop</button><button disabled={!state.best} onClick={()=>state.best&&replay(state.best)}>↻ Najlepszy strzał</button></div>
 <details><summary>Strzał ręczny i porównania</summary><fieldset disabled={locked}><label>Kąt · {angle}°<input type="range" min={config.angle_min} max={config.angle_max} value={angle} onChange={e=>setAngle(+e.target.value)}/></label><label>Siła · {power}%<input type="range" min={config.power_min} max={config.power_max} value={power} onChange={e=>setPower(+e.target.value)}/></label><div className="actions"><button onClick={()=>shot(angle,power,'Strzał ręczny')}>Strzał ręczny</button><button onClick={()=>shot(config.angle_min+Math.floor(Math.random()*14)*(config.angle_max-config.angle_min)/13,config.power_min+Math.floor(Math.random()*9)*(config.power_max-config.power_min)/8,'Strzał losowy')}>Strzał losowy</button><button onClick={compare}>Przeszukaj siatkę</button></div></fieldset></details>
 </section>{analysis&&<Analysis rows={rows} replay={replay}/>}
 <details className="panel"><summary>Konstrukcja i pliki JSON</summary><fieldset disabled={locked}><label>Nazwa<input value={level.name} maxLength={80} onChange={e=>edit({...level,name:e.target.value})}/></label><div className="actions"><button onClick={()=>shot(45,70,'Test stabilności',{level,config},true)}>Test stabilności</button><button onClick={()=>api('levels',level).then(refresh).then(()=>note('Zapisano poziom.')).catch(fail)}>Zapisz poziom</button><button onClick={()=>download(level,'poziom.json')}>Eksport JSON</button><button onClick={()=>importer.current?.click()}>Import JSON</button><button onClick={()=>edit(initial)}>Wyczyść</button></div>
 <input ref={importer} type="file" hidden accept=".json" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{const data=JSON.parse(await file.text());const saved=await api<{id:string}>('levels',data);await load(saved.id);await refresh()}catch(err){fail(err)}}}/></fieldset></details></div>
 <aside className="right"><section className="panel"><small>EKSPERYMENT</small><h2>Trening PPO</h2><p>Jedna decyzja agenta na epizod.</p><fieldset disabled={locked}><div className="fields">{(['total','seed'] as const).map(k=><label key={k}>{configNames[k]}<input type="number" value={config[k]} onChange={e=>setConfig({...config,[k]:+e.target.value})}/></label>)}</div><details><summary>Parametry zaawansowane</summary>{(Object.keys(defaults) as (keyof Config)[]).slice(2).map(k=><label key={k}>{configNames[k]}<input type="number" step="any" value={config[k]} onChange={e=>setConfig({...config,[k]:+e.target.value})}/></label>)}</details></fieldset></section>
 <section className="panel"><small>TELEMETRIA</small><h2>Postęp treningu</h2><p className="status"><i className={active?'lit':''}/>{labels[state.status]}</p><div className="big">{state.episodes}<span> / {state.total||config.total}</span></div><progress value={state.episodes} max={state.total||config.total||1}/><p>{Math.round(100*state.episodes/(state.total||1))}% · {state.seconds} s</p><h3>Nagroda <em>średnia / 20</em></h3><Chart rows={rows}/><dl>{Object.entries({'Rekord':state.best?.reward.toFixed(1),'Aktualizacje PPO':state.updates,'Kroki gradientowe':state.gradient_steps,'Ostatnia akcja':last?`${last.angle.toFixed(1)}° / ${last.power.toFixed(0)}%`:null,'Zniszczone cele':last?(last.destroyed*100).toFixed(0)+'%':null}).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v??'—'}</dd></div>)}</dl>
 {state.evaluation&&<><h3>Ocena polityki</h3><p>PPO: {state.evaluation.policy.reward.toFixed(1)} pkt · losowy (średnia z {state.evaluation.random_n}): {state.evaluation.random_mean.toFixed(1)} pkt</p></>}
 </section></aside></div></main></>
}
createRoot(document.getElementById('root')!).render(<App/>);

