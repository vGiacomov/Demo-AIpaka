# Graph Report - Angry Alpakas  (2026-11-19)

## Corpus Check
- Corpus is ~1,841 words - fits in a single context window. You may not need a graph.

## Summary
- 19 nodes · 22 edges · 4 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: unreported input · unreported output

## Community Hubs (Navigation)
- Scenariusze i polityka PPO
- Srodowisko i obserwacja
- Telemetria nagrody
- Deterministyczne powtorki

## God Nodes (most connected - your core abstractions)
1. `AlpacaEnv` - 8 edges
2. `PPO` - 4 edges
3. `Dashboard treningowy` - 4 edges
4. `Alpaca RL` - 3 edges
5. `Matter.js` - 3 edges
6. `Zamrożony poziom` - 3 edges
7. `Składniki nagrody` - 2 edges
8. `WebSocket /ws/training` - 2 edges
9. `Heatmapa kąt–siła` - 2 edges
10. `Edytor konstrukcji` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Alpaca RL` --references--> `Dashboard treningowy`  [EXTRACTED]
  docs/specyfikacja.md → docs/specyfikacja.md  _Bridges community 0 → community 2_
- `AlpacaEnv` --shares_data_with--> `Matter.js`  [EXTRACTED]
  docs/specyfikacja.md → docs/specyfikacja.md  _Bridges community 3 → community 1_
- `AlpacaEnv` --implements--> `Składniki nagrody`  [EXTRACTED]
  docs/specyfikacja.md → docs/specyfikacja.md  _Bridges community 1 → community 2_
- `PPO` --shares_data_with--> `AlpacaEnv`  [EXTRACTED]
  docs/specyfikacja.md → docs/specyfikacja.md  _Bridges community 1 → community 0_
- `Dashboard treningowy` --implements--> `Powtórka epizodu`  [EXTRACTED]
  docs/specyfikacja.md → docs/specyfikacja.md  _Bridges community 2 → community 3_

## Communities (4 total, 0 thin omitted)

### Community 0 - "Scenariusze i polityka PPO"
Cohesion: 0.40
Nodes (5): Alpaca RL, Random Agent, Manual Agent i przeszukiwanie siatki, Edytor konstrukcji, PPO, Stable-Baselines3

### Community 1 - "Srodowisko i obserwacja"
Cohesion: 0.40
Nodes (4): AlpacaEnv, Contextual bandit, Gymnasium, MultiDiscrete([14, 9])

### Community 2 - "Telemetria nagrody"
Cohesion: 0.40
Nodes (5): Dashboard treningowy, FastAPI, Heatmapa kąt–siła, Składniki nagrody, WebSocket /ws/training

### Community 3 - "Deterministyczne powtorki"
Cohesion: 0.50
Nodes (3): Matter.js, Powtórka epizodu, Zamrożony poziom

## Knowledge Gaps
- **6 isolated node(s):** `Gymnasium`, `Stable-Baselines3`, `Contextual bandit`, `MultiDiscrete([14, 9])`, `FastAPI` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 7 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AlpacaEnv` connect `Srodowisko i obserwacja` to `Scenariusze i polityka PPO`, `Telemetria nagrody`, `Deterministyczne powtorki`?**
  _High betweenness centrality (0.563) - this node is a cross-community bridge._
- **What connects `Gymnasium`, `Stable-Baselines3`, `Contextual bandit` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `PPO` connect `Scenariusze i polityka PPO` to `Srodowisko i obserwacja`?**
  _High betweenness centrality (0.288) - this node is a cross-community bridge._
- **Why does `Dashboard treningowy` connect `Telemetria nagrody` to `Scenariusze i polityka PPO`, `Deterministyczne powtorki`?**
  _High betweenness centrality (0.277) - this node is a cross-community bridge._

Agent token usage was unavailable in this host. Zero in machine-generated counters means unreported usage.
