import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
const local=process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python';
const python=existsSync(local)?local:'python';
const api=spawn(python,['-m','uvicorn','backend.api:app','--port','8000'],{stdio:'inherit'});
api.on('error',e=>{console.error(e.message);process.exitCode=1});
api.on('exit',code=>{process.exitCode=code??0});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>api.kill());

