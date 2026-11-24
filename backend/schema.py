import json
from pathlib import Path
from typing import Literal
from pydantic import BaseModel, Field, model_validator

ROOT = Path(__file__).resolve().parents[1]
MATERIALS = json.loads((ROOT / "shared/materials.json").read_text())
MAX_OBJECTS = 32

class Piece(BaseModel):
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,64}$")
    type: Literal["wood", "stone", "glass", "beam", "platform", "ball", "target"]
    x: float = Field(ge=0, le=900)
    y: float = Field(ge=0, le=400)
    rotation: float = Field(default=0, ge=-360, le=360)

class Level(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    objects: list[Piece] = Field(max_length=MAX_OBJECTS)

    @model_validator(mode="after")
    def unique_ids(self):
        if len({o.id for o in self.objects}) != len(self.objects):
            raise ValueError("Powtórzony identyfikator elementu.")
        return self

class Config(BaseModel):
    total: int = Field(default=512, ge=8, le=100000)
    seed: int = Field(default=42, ge=0, le=2147483647)
    lr: float = Field(default=0.001, gt=0, le=0.1)
    rollout: int = Field(default=32, ge=8, le=2048)
    epochs: int = Field(default=6, ge=1, le=32)
    max_steps: int = Field(default=300, ge=30, le=1200)
    angle_min: float = Field(default=15, ge=1, le=89)
    angle_max: float = Field(default=80, ge=1, le=89)
    power_min: float = Field(default=20, ge=1, le=100)
    power_max: float = Field(default=100, ge=1, le=100)

    @model_validator(mode="after")
    def valid_ranges(self):
        if self.angle_min >= self.angle_max or self.power_min >= self.power_max:
            raise ValueError("Minimum musi być mniejsze od maksimum.")
        if self.total % self.rollout:
            raise ValueError("Liczba epizodów musi być wielokrotnością długości rolloutu.")
        return self

class Experiment(BaseModel):
    level: Level
    config: Config = Field(default_factory=Config)

class Shot(BaseModel):
    level: Level
    config: Config = Field(default_factory=Config)
    angle: float = Field(default=45, ge=1, le=89)
    power: float = Field(default=70, ge=1, le=100)
    stability: bool = False

