"""Repeat a saved experiment locally using the same training worker as the API."""
import argparse
import time
from pathlib import Path
from .schema import Experiment
from .training import ACTIVE, Session

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("experiment", type=Path)
    args = parser.parse_args()
    exp = Experiment.model_validate_json(args.experiment.read_bytes())
    session = Session()
    session.start(exp)
    while session.snapshot()["status"] in ACTIVE:
        time.sleep(0.2)
    state = session.snapshot()
    if state["error"]:
        raise SystemExit(state["error"])
    print("models/" + state["run"], state["evaluation"])

if __name__ == "__main__":
    main()

