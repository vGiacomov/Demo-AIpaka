# Praca z Alpaca RL

Architekturę i polecenia uruchomienia opisuje README.md. Oryginalne kryteria odbioru są w docs/specyfikacja.md. Przy pytaniach przekrojowych zacznij od graphify query lub graphify-out/GRAPH_REPORT.md, następnie sprawdź wskazane źródła.

Jedyny integrator fizyki znajduje się w physics-engine/worker.mjs. Zmiany materiałów wprowadzaj w shared/materials.json. Zachowuj zgodność replayu z zamrożonym eksperymentem i rozdzielaj wynik najlepszego epizodu od oceny polityki. Po zmianie uruchom python -m pytest -q i npm run build. Po zmianie architektury odśwież Graphify.
