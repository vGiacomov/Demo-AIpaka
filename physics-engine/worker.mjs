import Matter from 'matter-js';
import readline from 'node:readline';
import {readFileSync} from 'node:fs';
const materials=JSON.parse(readFileSync(new URL('../shared/materials.json',import.meta.url)));
const {Engine,Bodies,Body,Composite,Events,Vector}=Matter;
const DT=1000/60;

function simulate({level,angle=45,power=70,max_steps=300,frames=false,stability=false,seed=0}){
  // Reset Matter's process-wide IDs and PRNG before constructing each isolated world.
  Matter.Common._nextId=0;
  Matter.Common._seed=seed%233280;
  const engine=Engine.create();
  const ground=Bodies.rectangle(460,430,2600,60,{isStatic:true});
  const items=new Map(), initial=new Map(), damage=new Map();
  for(const o of level.objects){
    const m=materials[o.type], options={angle:o.rotation*Math.PI/180,density:m.density,friction:0.7,restitution:0.08,isStatic:o.type==='platform'};
    const b=['ball','target'].includes(o.type)?Bodies.circle(o.x,o.y,m.w/2,options):Bodies.rectangle(o.x,o.y,m.w,m.h,options);
    b.label=o.id;
    items.set(b,o);
    initial.set(b,{...b.position});
    damage.set(b,0);
  }
  const alpaca=Bodies.circle(110,335,13,{density:0.006,restitution:0.18,frictionAir:0.001});
  const rad=angle*Math.PI/180, speed=power*0.29;
  Body.setVelocity(alpaca,{x:Math.cos(rad)*speed,y:-Math.sin(rad)*speed});
  Composite.add(engine.world,[ground,...items.keys(),...(stability?[]:[alpaca])]);
  const removed=new Set(), snapshots=[];
  let unstable=false;
  Events.on(engine,'collisionStart',({pairs})=>{
    if(stability)return;
    for(const {bodyA,bodyB,collision} of pairs){
      const impact=Math.abs(Vector.dot(Vector.sub(bodyA.velocity,bodyB.velocity),collision.normal));
      if(impact<2.8)continue;
      for(const b of [bodyA,bodyB]){
        if(!items.has(b)||b.isStatic||removed.has(b))continue;
        const m=materials[items.get(b).type];
        damage.set(b,Math.min(m.hp,damage.get(b)+(impact-2.8)*2.7));
      }
    }
  });
  function snapshot(){
    const poses=[...items].filter(([b])=>!removed.has(b)).map(([b,o])=>[o.id,b.position.x,b.position.y,b.angle]);
    if(!stability)poses.push(['@',alpaca.position.x,alpaca.position.y,alpaca.angle]);
    snapshots.push(poses);
  }
  let reason='limit', step=0, quiet=0;
  if(frames)snapshot();
  for(;step<max_steps;){
    Engine.update(engine,DT); step++;
    for(const [b,o] of items){
      if(removed.has(b))continue;
      if(Vector.magnitude(Vector.sub(b.position,initial.get(b)))>5||Math.abs(b.angle-o.rotation*Math.PI/180)>0.12)unstable=true;
      if(!stability && (damage.get(b)>=materials[o.type].hp || b.position.y>550 || b.position.x>980 || b.position.x< -100)){
        damage.set(b,materials[o.type].hp); removed.add(b); Composite.remove(engine.world,b);
      }
    }
    if(frames && step%3===0)snapshot();
    const active=Composite.allBodies(engine.world).filter(b=>!b.isStatic && b.position.y<550 && b.position.x<980 && b.position.x> -100);
    quiet=active.every(b=>b.speed<0.12 && b.angularSpeed<0.02)?quiet+1:0;
    if(!stability && [...items].filter(([,o])=>o.type==='target').every(([b])=>removed.has(b))){reason='targets';break;}
    if(quiet>=25){reason='rest';break;}
  }
  if(frames && step%3)snapshot();
  const damageList=[...items].map(([b,o])=>({id:o.id,type:o.type,ratio:damage.get(b)/materials[o.type].hp}));
  Engine.clear(engine);
  return {frames:snapshots,damage:damageList,steps:step,reason,unstable:stability&&unstable};
}
for await(const line of readline.createInterface({input:process.stdin})){
  try{console.log(JSON.stringify(simulate(JSON.parse(line))))}
  catch(error){console.log(JSON.stringify({error:String(error)}))}
}
