import json
import time
import numpy as np
import pytest
from fastapi.testclient import TestClient
from gymnasium.utils.env_checker import check_env
from backend import api
from backend.env import AlpacaEnv, score
from backend.schema import Config, Level, ROOT
from backend.training import Session

@pytest.fixture
def level():
    return Level.model_validate_json((ROOT/"levels/Easy.json").read_bytes())

def test_reset_repeatability_and_env(level):
    env = AlpacaEnv(level, Config())
    try:
        check_env(env, skip_render_check=True)
        obs, _ = env.reset(seed=8)
        action = np.array([4,5])
        first = env.step(action)
        obs2, _ = env.reset(seed=8)
        assert np.array_equal(obs, obs2)
        assert first[1:] == env.step(action)[1:]
        args = (level, Config(), 35, 70, True)
        assert env.physics.simulate(*args) == env.physics.simulate(*args)
        assert env.parameters(np.array([13,8])) == (80,100)
    finally:
        env.close()

def test_reward():
    damage = [{"type":"target","ratio":1},{"type":"target","ratio":0.5},{"type":"wood","ratio":0.4}]
    assert score(damage)["reward"] == 50 + 7.5 + 6
    assert score([{"type":"target","ratio":0}])["reward"] == -5
    assert score(damage[:1])["reward"] == 150

def test_api_and_ppo(level,tmp_path,monkeypatch):
    from backend import training
    monkeypatch.setattr(api,"session",Session())
    monkeypatch.setattr(api,"level_dir",tmp_path)
    monkeypatch.setattr(training,"ROOT",tmp_path)
    client = TestClient(api.app)
    saved=client.post("/api/levels",json=level.model_dump()).json()["id"]
    assert client.get("/api/levels/"+saved).json()==level.model_dump()
    assert client.get("/api/levels").json()[0]["id"]==saved
    req={"level":level.model_dump(),"config":{"total":16,"rollout":8,"epochs":2}}
    result=client.post("/api/simulation/shot",json=req).json()
    assert len(result["frames"])>1
    assert client.post("/api/training/start",json={**req,"level":{"name":"x","objects":[]}}).status_code==422
    assert client.post("/api/training/start",json=req).status_code==200
    assert client.post("/api/training/pause",json={}).status_code==200
    with client.websocket_connect("/ws/training") as ws:
        for _ in range(200):
            state=ws.receive_json()["state"]
            if state["status"]=="paused":break
        assert state["status"]=="paused"
        assert client.post("/api/training/start",json=req).status_code==409
        assert client.post("/api/training/resume",json={}).status_code==200
        for _ in range(200):
            state=ws.receive_json()["state"]
            if state["status"] in ("complete","failed"):break
    assert state["status"]=="complete", state
    rows=client.get("/api/training/history").json()
    assert len(rows)==16 and state["updates"]==2 and state["gradient_steps"]==4
    assert state["best"]["reward"]==max(r["reward"] for r in rows)
    assert (tmp_path/"models"/state["run"]/"policy.zip").exists()
    assert state["evaluation"]["random_n"]==32
    b=state["best"]
    replay=client.post("/api/simulation/shot",json={**req,"angle":b["angle"],"power":b["power"]}).json()
    assert replay["reward"]==b["reward"]

