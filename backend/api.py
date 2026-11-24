import asyncio
import json
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from .schema import Experiment, Level, Shot, ROOT
from .training import Session
from .env import Physics, score

app = FastAPI(title="Alpaca RL")
session = Session()
level_dir = ROOT / "levels"

@app.get("/api/levels")
def levels():
    return [dict(id=p.stem,name=json.loads(p.read_text(encoding="utf8"))["name"])
            for p in sorted(level_dir.rglob("*.json"))]

@app.get("/api/levels/{level_id}")
def level(level_id: str):
    for p in level_dir.rglob("*.json"):
        if p.stem == level_id:
            return Level.model_validate_json(p.read_bytes())
    raise HTTPException(404, "Nie znaleziono poziomu.")

@app.post("/api/levels")
def save_level(data: Level):
    folder = level_dir / "user"
    folder.mkdir(exist_ok=True)
    dest = folder / (uuid4().hex+".json")
    tmp = dest.with_suffix(".tmp")
    tmp.write_text(data.model_dump_json(indent=2),encoding="utf8")
    tmp.replace(dest)
    return {"id":dest.stem}

def require_target(level):
    if not any(o.type == "target" for o in level.objects):
        raise HTTPException(422,"Dodaj co najmniej jeden cel.")

@app.post("/api/training/start")
def start(exp: Experiment):
    require_target(exp.level)
    try:
        return session.start(exp)
    except ValueError as exc:
        raise HTTPException(409,str(exc)) from exc

@app.get("/api/training/status")
def status():
    return session.snapshot()

@app.get("/api/training/history")
def history():
    with session.lock:
        return list(session.rows)

@app.get("/api/training/best")
def best():
    return session.snapshot()["best"]

@app.get("/api/training/experiment")
def experiment():
    return session.exp

@app.post("/api/training/{action}")
def control(action: str):
    if action not in ("pause","resume","stop"):
        raise HTTPException(404)
    try:
        return session.control(action)
    except ValueError as exc:
        raise HTTPException(409,str(exc)) from exc

@app.post("/api/simulation/shot")
def simulate(shot: Shot):
    if not shot.stability:
        require_target(shot.level)
    worker = Physics()
    try:
        result = worker.simulate(shot.level,shot.config,shot.angle,shot.power,True,shot.stability)
        return {**result, **score(result["damage"])}
    finally:
        worker.close()

@app.post("/api/simulation/grid")
def grid(exp: Experiment):
    from .env import AlpacaEnv
    import numpy as np
    require_target(exp.level)
    env = AlpacaEnv(exp.level,exp.config)
    try:
        rows = []
        for i in range(14):
            for j in range(9):
                env.reset()
                rows.append(env.step(np.array([i,j]))[4])
        return {"best":max(rows,key=lambda r:r["reward"]), "mean":sum(r["reward"] for r in rows)/126}
    finally:
        env.close()

@app.websocket("/ws/training")
async def updates(ws: WebSocket):
    await ws.accept()
    cursor, run = 0, None
    try:
        while True:
            with session.lock:
                state = session.snapshot()
                if run != state["run"]:
                    cursor, run = 0, state["run"]
                delta = session.rows[cursor:cursor+512]
                cursor += len(delta)
                payload = dict(state=state, rows=delta, experiment=session.exp.model_dump() if session.exp else None)
            await ws.send_json(payload)
            await asyncio.sleep(0.18)
    except (WebSocketDisconnect, RuntimeError):
        pass

