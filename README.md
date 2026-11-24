# Alpaca RL

Lokalne laboratorium do nauki uczenia ze wzmocnieniem. Zbuduj konstrukcję, wystrzel alpakę i porównaj wyuczoną politykę z własną próbą, agentem losowym oraz pełnym przeglądem 126 akcji. Interfejs jest po polsku.

## Uruchomienie

Wymagane są Python 3.11+, Node.js 22.12+ i npm. Uruchom polecenia z katalogu projektu. Trening używa CPU.

**Windows (PowerShell)**

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
npm.cmd ci
npm.cmd run dev
```

**Linux**

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm ci
npm run dev
```

Otwórz [laboratorium](http://localhost:5173). Polecenie startowe uruchamia Vite i FastAPI. Ctrl+C kończy oba procesy. Dokumentacja HTTP jest dostępna w [Swagger UI](http://127.0.0.1:8000/docs). Uruchamiaj jedną instancję backendu, ponieważ stan aktywnego eksperymentu należy do jednego procesu.

## Pierwsza demonstracja

1. Zacznij od pustej planszy albo wybierz **Wczytaj poziom → Easy**. Medium zawiera wieżę, Hard dwa cele. Dodawaj obiekty z palety, przeciągaj je i ustaw obrót w panelu właściwości.
2. W sekcji **Konstrukcja i pliki JSON** przetestuj stabilność. Jeśli konstrukcja rozpada się przed uderzeniem, podeprzyj elementy, aby agent nie otrzymywał nagrody za samoczynny upadek. Zapisz poziom.
3. Wybierz **Strzał ręczny i porównania**. Porównaj swój wynik z losowym strzałem i przeszukaniem siatki.
4. Uruchom PPO z seedem 42, 512 epizodami i rolloutem 32. Przełącz na trening bez renderowania lub wstrzymaj go między epizodami. Kąt i siła dotyczą ostatniej akcji, a wykres pokazuje próby i średnią z maksymalnie 20 ostatnich epizodów.
5. Otwórz **Analiza**. Wskaż komórkę mapy, aby odczytać liczbę prób i średnią nagrodę. Wybierz epizod do powtórki albo odtwórz najlepszy strzał w zwolnionym tempie. Po ukończeniu porównaj rekord z oceną deterministycznej polityki i średnią z 32 równomiernie losowanych akcji. Poprawa zależy od seeda, budżetu i poziomu.

## Architektura i fizyka

React, TypeScript, SVG, Tailwind i Recharts tworzą edytor oraz dashboard w frontend/. FastAPI waliduje poziomy i publikuje przyrosty historii przez WebSocket. Osobny wątek treningowy Stable-Baselines3 utrzymuje środowisko Gymnasium i własny proces Node.js. Przeglądarka może zostać zamknięta podczas treningu.

physics-engine/worker.mjs przyjmuje polecenia JSON po jednym na linię. Matter.js 0.20.0 buduje nowy świat z zamrożonego poziomu, resetuje identyfikatory i generator i wykonuje kroki po 1/60 s. Rejestruje zderzenia, obrażenia od prędkości względnej wzdłuż normalnej i usunięcia obiektów. Epizod kończy zniszczenie wszystkich celów, 25 spokojnych kroków lub limit czasu. Platformy są nieruchome. Parametry materiałów znajdują się w shared/materials.json.

Podczas treningu worker zwraca tylko wyniki. Powtórka uruchamia ten sam worker z tym samym poziomem i akcją, zbiera pozycje co trzy kroki i po ostatnim kroku. SVG odtwarza te pozycje. Szybkość odtwarzania wpływa wyłącznie na prezentację. Powtarzalność dotyczy tej samej wersji silnika i stosu obliczeniowego.

## Obserwacje, akcje i nagroda

AlpacaEnv zwraca 322 liczby float32. Każde z 32 miejsc zawiera maskę, pozycję XY, typ materiału, szerokość, wysokość, masę, wytrzymałość i sinus oraz cosinus obrotu. Puste miejsca zawierają zera. Ostatnie dwie liczby to pozycja katapulty. Normalizacja używa stałych granic planszy i materiałów. Pozycje celów identyfikuje kod typu obiektu.

MultiDiscrete([14, 9]) równomiernie mapuje indeksy na domknięte przedziały kąta i siły, domyślnie 15–80° i 20–100%. Środowisko ma również wariant continuous=True z Box o wymiarze 2 na potrzeby rozszerzenia o SAC.

| Składnik | Wartość |
|---|---|
| Cele | 100 × udział zniszczonych celów |
| Częściowe uszkodzenia | 30 × suma ułamków uszkodzeń ocalałych celów / liczba wszystkich celów |
| Konstrukcja | 15 × średni ułamek uszkodzeń elementów zniszczalnych poza celami |
| Ukończenie | 50 za zniszczenie wszystkich celów |
| Pudło | −5 przy braku jakichkolwiek obrażeń |

Każdy ułamek obrażeń jest ograniczony do [0, 1]. Premia za ukończenie dotyczy stanu całego poziomu. Symulacja liczy rozpad pod wpływem grawitacji, dlatego warto najpierw sprawdzić stabilność.

## Jak interpre­tować PPO

Jeden epizod obejmuje jedną decyzję i końcową nagrodę. To **contextual bandit**. W pojedynczym eksperymencie kontekst pozostaje stały. PPO zbiera rollout, porównuje uzyskane nagrody z oszacowaniem wartości i optymalizuje politykę z ograniczeniem zmiany ilorazu prawdopodobieństw. Gamma wynosi zero. Liczba epizodów jest wielokrotnością rolloutu. Dashboard podaje osobno epizody, aktualizacje po rolloutach i kroki gradientowe. Pauza zachowuje rozpoczęty rollout. Zatrzymanie kończy eksperyment i zapisuje ostatni stan polityki.

## Wyniki i powtarzanie

Każdy trening otrzymuje osobny katalog models/ z experiment.json (zamrożony poziom, seed i konfiguracja), versions.json, episodes.jsonl, checkpoint.zip po aktualizacji, policy.zip po zakończeniu oraz evaluation.json po pełnej ewaluacji. API udostępnia historię bieżącej sesji, a pliki zachowują wcześniejsze eksperymenty. Poniższe polecenia zakładają aktywne środowisko wirtualne. Na Windows można zamiast python użyć .venv\Scripts\python, a na Linux .venv/bin/python.

```sh
python -m backend.repeat models/ID_EKSPERYMENTU/experiment.json
python -m pytest -q
npm run build
```

Testy obejmują zgodność z Gymnasium, reset i determinizm, składniki nagrody, zapis poziomów, rzeczywisty trening PPO, pauzę i wznowienie, transmisję WebSocket oraz zgodność wyniku powtórki z najlepszym epizodem.

## Mapa projektu

Graphify zapisuje interaktywny graf w graphify-out/graph.html, raport w graphify-out/GRAPH_REPORT.md i dane w graphify-out/graph.json. Przy pracy nad zależnościami użyj np. `graphify query "AlpacaEnv"`. Instrukcja pracy dla kolejnych sesji znajduje się w AGENTS.md, a pełne wymagania w docs/specyfikacja.md.

