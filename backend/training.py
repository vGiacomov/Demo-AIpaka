import json
import math
import platform
import subprocess
import threading
import time
from importlib.metadata import version
from uuid import uuid4
import numpy as np
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import BaseCallback
from .env import AlpacaEnv
from .schema import ROOT

ACTIVE = {"running", "pausing", "paused", "stopping"}

class Session:
    def __init__(self):
        self.lock = threading.Condition()
        self.status = "idle"
        self.rows = []
        self.updates = self.grad_steps = 0
        self.run_id = None
        self.exp = self.best = self.evaluation = self.error = None
        self.started = self.elapsed = 0

    def start(self, exp):
        with self.lock:
            if self.status in ACTIVE:
                raise ValueError("Eksperyment jest aktywny.")
            self.exp = exp.model_copy(deep=True)
            self.run_id = uuid4().hex
            self.rows = []
            self.best = self.evaluation = self.error = None
            self.updates = self.grad_steps = 0
            self.started = time.monotonic()
            self.status = "running"
            threading.Thread(target=self.run, daemon=True).start()
            return self.snapshot()

    def control(self, action):
        transitions = {"pause": ({"running"}, "pausing"), "resume": ({"paused","pausing"}, "running"),
                       "stop": ({"paused","pausing","running"}, "stopping")}
        allowed, target = transitions[action]
        with self.lock:
            if self.status not in allowed:
                raise ValueError("Operacja niedostępna w tym stanie.")
            self.status = target
            self.lock.notify_all()
            return self.snapshot()

    def snapshot(self):
        with self.lock:
            return dict(status=self.status, run=self.run_id, episodes=len(self.rows), updates=self.updates,
                        gradient_steps=self.grad_steps, best=self.best, evaluation=self.evaluation,
                        total=self.exp.config.total if self.exp else 0, error=self.error,
                        seconds=round(time.monotonic()-self.started if self.status in ACTIVE else self.elapsed, 1))

    def run(self):
        env = None
        try:
            exp, c = self.exp, self.exp.config
            folder = ROOT / "models" / self.run_id
            folder.mkdir(parents=True)
            (folder/"experiment.json").write_text(exp.model_dump_json(indent=2), encoding="utf8")
            versions = {p:version(p) for p in ("gymnasium","stable-baselines3","torch","numpy")}
            versions.update(python=platform.python_version(), node=subprocess.check_output(["node","-v"],text=True).strip(), matter="0.20.0")
            (folder/"versions.json").write_text(json.dumps(versions))
            env = AlpacaEnv(exp.level, c)
            torch.set_num_threads(1)
            session = self
            batch = math.gcd(c.rollout, 32)
            if batch < 2:
                batch = c.rollout

            class ObservedPPO(PPO):
                def train(model):
                    super().train()
                    with session.lock:
                        session.updates += 1
                        session.grad_steps += c.epochs * (c.rollout // batch)
                    model.save(folder/"checkpoint")

            class Recorder(BaseCallback):
                def _on_step(callback):
                    info = callback.locals["infos"][0]
                    row = {key:info[key] for key in ("angle","power","action","reward","destroyed","parts","physics_steps","reason")}
                    with session.lock:
                        row["episode"] = len(session.rows)+1
                        session.rows.append(row)
                        log.write(json.dumps(row)+"\n")
                        if session.best is None or row["reward"] > session.best["reward"]:
                            session.best = row
                        if session.status == "pausing":
                            session.status = "paused"
                        session.lock.wait_for(lambda: session.status != "paused")
                        return session.status != "stopping"

            model = ObservedPPO("MlpPolicy", env, seed=c.seed, learning_rate=c.lr, n_steps=c.rollout,
                                batch_size=batch, n_epochs=c.epochs, gamma=0, device="cpu", verbose=0)
            with (folder/"episodes.jsonl").open("w", buffering=1) as log:
                model.learn(total_timesteps=c.total, callback=Recorder())
            model.save(folder/"policy")
            with self.lock:
                stopped = self.status == "stopping"
            if not stopped:
                obs, _ = env.reset()
                action, _ = model.predict(obs, deterministic=True)
                policy = env.step(action)[4]
                rng = np.random.default_rng(c.seed)
                random_rewards = []
                for _ in range(32):
                    env.reset()
                    random_rewards.append(env.step(np.array([rng.integers(14),rng.integers(9)]))[1])
                self.evaluation = dict(policy=policy, random_mean=float(np.mean(random_rewards)), random_n=32)
                (folder/"evaluation.json").write_text(json.dumps(self.evaluation))
            with self.lock:
                self.elapsed = time.monotonic()-self.started
                self.status = "stopped" if self.status=="stopping" else "complete"
        except Exception as exc:
            with self.lock:
                self.elapsed = time.monotonic()-self.started
                self.error = str(exc)
                self.status = "failed"
        finally:
            if env is not None:
                env.close()

