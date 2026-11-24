import json
import subprocess
import gymnasium as gym
import numpy as np
from gymnasium import spaces
from .schema import Config, Level, MATERIALS, MAX_OBJECTS, ROOT

class Physics:
    def __init__(self):
        self.process = subprocess.Popen(
            ["node", str(ROOT / "physics-engine/worker.mjs")], stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, text=True, encoding="utf-8",
        )

    def simulate(self, level, config, angle, power, frames=False, stability=False):
        command = dict(level=level.model_dump(), seed=config.seed, max_steps=config.max_steps,
                       angle=angle, power=power, frames=frames, stability=stability)
        self.process.stdin.write(json.dumps(command) + "\n")
        self.process.stdin.flush()
        response = json.loads(self.process.stdout.readline())
        if "error" in response:
            raise RuntimeError(response["error"])
        return response

    def close(self):
        self.process.stdin.close()
        try:
            self.process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()

def score(damage):
    targets = [o["ratio"] for o in damage if o["type"] == "target"]
    blocks = [o["ratio"] for o in damage if o["type"] not in ("target", "platform")]
    count = sum(r == 1 for r in targets)
    ratio = count / max(1, len(targets))
    parts = dict(targets=100 * ratio,
                 partial=30 * sum(r for r in targets if r < 1) / max(1, len(targets)),
                 structure=15 * sum(blocks) / max(1, len(blocks)),
                 completion=50 * int(bool(targets) and count == len(targets)),
                 miss=-5 * int(not any(targets + blocks)))
    return dict(reward=sum(parts.values()), parts=parts, destroyed=ratio)

class AlpacaEnv(gym.Env):
    metadata = {"render_modes": ["ansi"]}

    def __init__(self, level: Level, config: Config, continuous=False):
        self.level, self.config = level, config
        self.physics = Physics()
        self.action_space = spaces.Box(-1., 1., (2,), dtype=np.float32) if continuous else spaces.MultiDiscrete([14, 9])
        self.observation_space = spaces.Box(-1., 1., (MAX_OBJECTS*10+2,), np.float32)
        self.obs = np.zeros(self.observation_space.shape, np.float32)
        for i, obj in enumerate(level.objects):
            m = MATERIALS[obj.type]
            mass = m["w"]*m["h"]*m["density"]
            if obj.type in ("ball", "target"):
                # Matter.circle approximates radius 16 by a regular 16-gon.
                mass = 8 * (m["w"]/2)**2 * np.sin(np.pi/8) * m["density"]
            rad = np.deg2rad(obj.rotation)
            self.obs[i*10:i*10+10] = [1, obj.x/900, obj.y/400, list(MATERIALS).index(obj.type)/6,
                m["w"]/130, m["h"]/62, 1 if obj.type=="platform" else mass/10, m["hp"]/100, np.sin(rad), np.cos(rad)]
        self.obs[-2:] = [110/900, 335/400]
        self.ready = False
        self.last = {}

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        self.ready = True
        self.last = {}
        return self.obs.copy(), {}

    def parameters(self, action):
        unit = (np.asarray(action)+1)/2 if isinstance(self.action_space, spaces.Box) else np.asarray(action)/[13, 8]
        c = self.config
        return float(c.angle_min+unit[0]*(c.angle_max-c.angle_min)), float(c.power_min+unit[1]*(c.power_max-c.power_min))

    def step(self, action):
        if not self.ready:
            raise gym.error.ResetNeeded("Najpierw wywołaj reset().")
        if not self.action_space.contains(action):
            raise ValueError("Akcja poza przestrzenią.")
        angle, power = self.parameters(action)
        result = self.physics.simulate(self.level, self.config, angle, power)
        self.last = dict(**score(result["damage"]), angle=angle, power=power,
                         action=np.asarray(action).tolist(), physics_steps=result["steps"], reason=result["reason"])
        self.ready = False
        return self.obs.copy(), self.last["reward"], True, False, self.last.copy()

    def render(self):
        return json.dumps(self.last, ensure_ascii=False)

    def close(self):
        self.physics.close()

