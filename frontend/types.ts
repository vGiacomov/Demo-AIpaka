import materials from '../shared/materials.json';
export {materials};
export type Kind=keyof typeof materials;
export type Piece={id:string,type:Kind,x:number,y:number,rotation:number};
export type Level={name:string,objects:Piece[]};
export type Config=typeof defaults;
export const defaults={total:512,seed:42,lr:0.001,rollout:32,epochs:6,max_steps:300,angle_min:15,angle_max:80,power_min:20,power_max:100};
export type Row={episode:number,angle:number,power:number,action:number[],reward:number,destroyed:number,parts:Record<string,number>};
export type State={status:string,run:string|null,episodes:number,total:number,seconds:number,updates:number,gradient_steps:number,best:Row|null,evaluation:{policy:Row,random_mean:number,random_n:number}|null,error:string|null};
export type Frame=[string,number,number,number][];
export type Result={frames:Frame[],reward:number,parts:Record<string,number>,destroyed:number,unstable:boolean};
export async function api<T>(path:string,data?:unknown):Promise<T>{
 const response=await fetch('/api/'+path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const value=await response.json();
 if(!response.ok)throw Error(typeof value.detail==='string'?value.detail:value.detail?.map((v:{msg:string})=>v.msg).join(' · ')||response.statusText);
 return value;
}

