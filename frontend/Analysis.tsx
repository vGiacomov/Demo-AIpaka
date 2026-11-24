import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid} from 'recharts';
import {Row} from './types';
export function Chart({rows}:{rows:Row[]}){
 let sum=0;
 const series=rows.map((r,i)=>{sum+=r.reward;if(i>=20)sum-=rows[i-20].reward;return {episode:r.episode,reward:r.reward,mean:sum/Math.min(20,i+1)}});
 return <div className="plot">{rows.length?<ResponsiveContainer width="100%" height={150}><LineChart data={series.filter((_,i)=>i%Math.max(1,Math.ceil(rows.length/1500))===0||i===rows.length-1)} margin={{left:-25,right:10,top:10,bottom:0}}><CartesianGrid stroke="#293437" vertical={false}/><XAxis dataKey="episode" tick={{fontSize:10,fill:'#a5b5b1'}}/><YAxis tick={{fontSize:10,fill:'#a5b5b1'}}/><Tooltip contentStyle={{background:'#172224',border:'1px solid #3c5555'}}/><Line name="Nagroda" dataKey="reward" stroke="#718d95" dot={false} isAnimationActive={false}/><Line name="Średnia (20)" dataKey="mean" stroke="#75ddbd" dot={false} strokeWidth={2} isAnimationActive={false}/></LineChart></ResponsiveContainer>:<div className="emptyplot">Wykres pojawi się po pierwszym epizodzie.</div>}</div>
}
export function Analysis({rows,replay}:{rows:Row[],replay:(r:Row)=>void}){
 const bins=Array.from({length:126},()=>({n:0,sum:0}));
 rows.forEach(r=>{const b=bins[r.action[0]*9+r.action[1]];b.n++;b.sum+=r.reward});
 return <section className="panel"><h2>Przestrzeń akcji</h2><p>Kąt rośnie w dół, siła w prawo. Kolor oznacza średnią nagrodę.</p><div className="heat">{bins.map((b,i)=><span key={i} title={`Kąt #${Math.floor(i/9)+1}, siła #${i%9+1} · ${b.n} prób · ${b.n?(b.sum/b.n).toFixed(1):'brak danych'}`} style={{background:b.n?`hsl(${25+130*Math.min(1,Math.max(0,b.sum/b.n/165))} 55% 55%)`:undefined}}/>)}</div><p>Zbadane kombinacje: {bins.filter(b=>b.n).length} / 126 · szary = bez prób</p><h2>Historia epizodów</h2><div className="history">{rows.slice().reverse().map(r=><button key={r.episode} onClick={()=>replay(r)}>▶ #{r.episode} · {r.angle.toFixed(1)}° · {r.power.toFixed(0)}% · {r.reward.toFixed(1)} pkt</button>)}</div></section>
}

