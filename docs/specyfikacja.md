# Projekt: Alpaca RL – Interaktywne demo Reinforcement Learning

## 1. Cel projektu

Zaprojektuj i zaimplementuj kompletną aplikację edukacyjną typu **Angry Birds meets Reinforcement Learning**, wykorzystującą alpaki zamiast ptaków.

Aplikacja ma umożliwiać użytkownikowi:

1. Samodzielne zbudowanie konstrukcji na planszy 2D.
2. Umieszczenie celów, które agent powinien zniszczyć.
3. Rozpoczęcie treningu agenta Reinforcement Learning.
4. Obserwowanie procesu uczenia się agenta w czasie rzeczywistym.
5. Analizowanie wykresów postępu treningu.
6. Odtworzenie najlepszej znalezionej próby.
7. Porównanie skuteczności modelu z losowym agentem i człowiekiem.

Projekt ma być atrakcyjny wizualnie, ale jego priorytetem jest poprawna implementacja RL, powtarzalność eksperymentów i czytelna prezentacja mechanizmu uczenia.

Nie chcę symulacji udającej sztuczną inteligencję. Model musi faktycznie trenować, aktualizować politykę działania i stopniowo optymalizować swoje decyzje.

## 2. Technologie

Frontend:
- React + TypeScript + Vite.
- Matter.js do symulacji fizyki 2D.
- Tailwind CSS do stylowania interfejsu.
- Recharts do wizualizacji danych treningowych.
- SVG lub Canvas do renderowania elementów świata.

Backend:
- Python 3.11+.
- FastAPI.
- Gymnasium do implementacji środowiska RL.
- Stable-Baselines3 do trenowania agentów.
- PyTorch jako backend uczenia.
- NumPy do przetwarzania danych.
- WebSocket do przekazywania wyników treningu na żywo.

**Ważne wymaganie architektoniczne:**

Symulacja wykorzystywana podczas treningu oraz wizualizacja gry muszą korzystać z tej samej logiki fizyki lub zapewniać zgodną, deterministyczną symulację.

Nie implementuj niezależnych przybliżeń fizyki w Pythonie i JavaScript, jeśli mogłyby dawać różne wyniki. Zaproponuj i zaimplementuj konkretny mechanizm synchronizacji, np. wspólny silnik Matter.js uruchamiany w headless workerze Node.js i komunikujący się z Pythonem.

Trening nie może wymagać renderowania każdej klatki w przeglądarce.

## 3. Główne tryby aplikacji

### TRYB A – Edytor konstrukcji

Użytkownik otrzymuje pustą planszę.

Po lewej stronie znajduje się panel z elementami:

- Drewniany klocek.
- Kamienny klocek.
- Szklany klocek.
- Długa drewniana belka.
- Platforma.
- Okrągły obiekt.
- Cel do zniszczenia.

Funkcjonalności:
- Przeciąganie i upuszczanie elementów.
- Zmiana położenia.
- Obracanie elementów.
- Usuwanie elementów.
- Siatka ułatwiająca ustawianie.
- Cofanie i ponawianie zmian.
- Czyszczenie planszy.
- Zapisywanie i wczytywanie konstrukcji jako JSON.
- Kilka gotowych poziomów demonstracyjnych.

Konstrukcje muszą uwzględniać grawitację, kolizje oraz stabilność.

Przed rozpoczęciem treningu użytkownik powinien móc uruchomić krótką symulację stabilności konstrukcji.

W przypadku konstrukcji, która rozpada się samoczynnie, aplikacja powinna wyświetlić ostrzeżenie.

### TRYB B – Trening Reinforcement Learning

Po kliknięciu przycisku „Rozpocznij trening” poziom zostaje zapisany i zamrożony.

Agent steruje wystrzałem alpaki z katapulty znajdującej się po lewej stronie planszy.

Akcja agenta obejmuje:
- Kąt wystrzału.
- Siłę wystrzału.

Na potrzeby MVP zaimplementuj jedną alpakę na epizod i jeden wystrzał.

Przykładowe zakresy parametrów:
- Kąt: 15–80 stopni.
- Siła: 20–100% maksymalnej energii katapulty.

Parametry powinny być konfigurowalne.

Każdy epizod działa według schematu:

1. Przywrócenie początkowej konstrukcji.
2. Pobranie obserwacji środowiska.
3. Wybranie akcji przez agenta.
4. Wystrzelenie alpaki.
5. Symulacja lotu i kolizji.
6. Obliczenie uszkodzeń i liczby zniszczonych celów.
7. Wyznaczenie nagrody.
8. Zapisanie wyników epizodu.
9. Aktualizacja modelu w ramach treningu.
10. Rozpoczęcie kolejnego epizodu.

Należy jasno rozdzielić epizod środowiska od kroku optymalizacji modelu – algorytm PPO nie musi aktualizować wag po każdym strzale.

### TRYB C – Analiza wyników

Wyświetlaj:
- Wykres nagrody w kolejnych epizodach.
- Średnią kroczącą nagrodę.
- Najlepszy uzyskany wynik.
- Procent zniszczonych celów.
- Liczbę wykonanych epizodów.
- Aktualny lub ostatni kąt wystrzału.
- Aktualną lub ostatnią siłę wystrzału.
- Czas treningu.
- Procent postępu.

Wykresy powinny aktualizować się w czasie rzeczywistym.

Użytkownik musi mieć możliwość wstrzymania, wznowienia i zatrzymania treningu.

Wstrzymanie treningu powinno następować w bezpiecznym punkcie wykonywania algorytmu.

### TRYB D – Prezentacja najlepszego rozwiązania

Po treningu aplikacja umożliwia:
- Odtworzenie najlepszego wystrzału.
- Spowolnienie odtwarzania.
- Wyświetlenie trajektorii alpaki.
- Wyświetlenie kąta i siły.
- Porównanie z losową próbą.
- Uruchomienie ręcznego wystrzału użytkownika.
- Pokazanie punktacji oraz uszkodzeń.

## 4. Środowisko Reinforcement Learning

Zaimplementuj własne środowisko `AlpacaEnv` zgodne z API Gymnasium.

Metody:
- `reset()`
- `step(action)`
- `render()`
- `close()`

Środowisko powinno mieć zdefiniowane:
- Observation space.
- Action space.
- Reward function.
- Termination conditions.
- Reset i seedowanie generatorów losowych.

### Obserwacje

Dla pierwszej wersji zastosuj stałą reprezentację wektorową:

- Pozycje elementów konstrukcji.
- Rodzaje elementów.
- Wymiary.
- Masy.
- Wytrzymałość.
- Pozycje celów.
- Pozycja katapulty.

Zastosuj maksymalną liczbę obiektów, padding i maskę aktywnych obiektów, aby obserwacje miały stały wymiar.

Znormalizuj dane wejściowe.

Dane powinny opisywać konstrukcję przed wykonaniem strzału, a nie ujawniać wyniku przyszłej symulacji.

### Akcje

Na potrzeby pierwszej wersji:

`MultiDiscrete([14, 9])`

Przykładowo:
- 14 możliwych kątów.
- 9 poziomów siły.

Zadbaj o poprawne mapowanie akcji do parametrów fizycznych.

Następnie przygotuj architekturę umożliwiającą dodanie akcji ciągłych przez `Box(2)` i modelu SAC.

### Reward function

Zaproponuj funkcję nagrody uwzględniającą:

- Zniszczone cele – wysoka dodatnia nagroda.
- Częściowe uszkodzenia celów.
- Uszkodzenia elementów konstrukcji.
- Całkowite zniszczenie wszystkich celów – bonus.
- Brak trafienia – niewielka kara.

Przykładowa funkcja:

`reward = 100 * destroyed_target_ratio + 30 * target_damage_ratio + 15 * structural_damage_ratio + 50 * all_targets_destroyed - 5 * complete_miss`

Wszystkie składniki powinny być ograniczone do określonych zakresów i unikać podwójnego nagradzania tego samego zjawiska.

Zaimplementuj analizę poszczególnych składników nagrody.

### Algorytmy

MVP:
- PPO ze Stable-Baselines3.
- Random Agent jako punkt odniesienia.
- Manual Agent sterowany przez człowieka.

Dodatkowo, jeśli będzie to uzasadnione:
- SAC dla ciągłej przestrzeni akcji.

Ważne: ponieważ jeden epizod obejmuje tylko jeden wystrzał, problem ma charakter contextual bandit, a nie klasycznego wieloetapowego sterowania. Wyjaśnij tę różnicę w dokumentacji i zastosuj PPO jako edukacyjny przykład RL.

Uwzględnij również możliwość porównania z prostym algorytmem przeszukiwania siatki kątów i siły.

## 5. Fizyka gry

Zaimplementuj:

- Grawitację.
- Ruch balistyczny.
- Zderzenia.
- Przewracanie konstrukcji.
- Masę i bezwładność.
- Tarcie.
- Sprężystość.
- Uszkodzenia elementów.
- Niszczenie elementów po przekroczeniu progu obrażeń.

Materiały powinny mieć różne właściwości.

Alpaka jest obiektem fizycznym, którego kolizje wpływają na pozostałe elementy świata.

Po wystrzale symulacja kończy się, gdy:
- Wszystkie cele zostaną zniszczone.
- Wszystkie dynamiczne obiekty się uspokoją.
- Zostanie przekroczony limit czasu symulacji.

Symulacja treningowa musi działać ze stałym krokiem czasowym, niezależnie od liczby klatek renderowanych przez przeglądarkę.

## 6. Interfejs użytkownika

Zaprojektuj nowoczesny dashboard AI.

Styl:
- Dark mode.
- Grafitowe tło.
- Turkusowe akcenty inspirowane identyfikacją AIpaki.
- Minimalistyczne, czytelne panele.
- Płynne animacje.
- Wysoka jakość wizualna.

Układ:

LEWA KOLUMNA:
- Narzędzia budowy.
- Lista obiektów.
- Właściwości zaznaczonego elementu.

ŚRODEK:
- Duża plansza 2D.
- Katapulta i alpaka.
- Konstrukcja do zniszczenia.
- Podgląd trajektorii.
- Animacja fizyki.

PRAWA KOLUMNA:
- Parametry treningu.
- Status modelu.
- Licznik epizodów.
- Wykres nagrody.
- Najlepszy wynik.

DOLNY PANEL:
- Start / Pause / Stop.
- Reset.
- Replay Best.
- Random Shot.
- Manual Shot.
- Przełączanie prędkości symulacji.

Zadbaj o komunikaty informujące użytkownika, kiedy trwa trening i co oznaczają poszczególne parametry.

## 7. Wizualizacja procesu uczenia

To jeden z najważniejszych aspektów projektu.

Chcę móc podczas demonstracji na uczelni pokazać studentom, jak agent przechodzi od losowych lub słabych prób do skuteczniejszych decyzji.

Zaimplementuj:
- Wykres reward vs episode.
- Wykres moving average reward.
- Wizualizację najlepszego strzału.
- Historię wybranych akcji.
- Heatmapę przestrzeni kąt–siła, przedstawiającą uzyskane nagrody.
- Wskaźnik eksploracji przestrzeni akcji.
- Możliwość odtworzenia wybranych epizodów.

Nie zakładaj, że model zawsze będzie się poprawiał. Wizualizacja powinna pokazywać rzeczywiste wyniki, nawet jeśli trening nie przynosi poprawy.

Heatmapa powinna rozróżniać przetestowane i nieprzetestowane kombinacje parametrów.

Dodaj przełącznik:
- Normalna animacja.
- Przyspieszona animacja.
- Trening bez renderowania.

## 8. Backend i API

FastAPI powinno udostępniać m.in.:

- `POST /api/levels`
- `GET /api/levels`
- `GET /api/levels/{id}`
- `POST /api/training/start`
- `POST /api/training/pause`
- `POST /api/training/resume`
- `POST /api/training/stop`
- `GET /api/training/status`
- `GET /api/training/history`
- `GET /api/training/best`
- `POST /api/simulation/shot`
- `WS /ws/training`

Zadbaj o poprawną obsługę błędów, walidację danych i blokowanie sprzecznych operacji.

Trening uruchamiaj w osobnym procesie lub workerze, aby nie blokował FastAPI.

## 9. Eksperymenty

Umożliw użytkownikowi ustawienie:

- Liczby kroków treningowych.
- Seeda.
- Współczynnika uczenia.
- Parametrów PPO.
- Prędkości symulacji.
- Maksymalnej liczby kroków fizyki na epizod.

Wyświetlaj osobno liczbę epizodów i liczbę kroków algorytmu.

Dodaj gotowe scenariusze treningowe:
- Easy – pojedynczy cel.
- Medium – mała wieża.
- Hard – konstrukcja z wieloma elementami.

W MVP trenuj i oceniaj model na jednym zamrożonym poziomie. Rozdziel tę funkcję od przyszłego treningu na wielu losowanych poziomach.

Zadbaj o checkpointy modelu i możliwość ponownego przeprowadzenia eksperymentu.

## 10. Struktura projektu

Zaproponuj strukturę z podziałem na:

- `frontend/`
- `backend/`
- `physics-engine/`
- `shared/`
- `levels/`
- `models/`
- `tests/`
- `docs/`

Rozdziel:
- Logikę treningu.
- Logikę symulacji.
- API.
- Wizualizację.
- Przechowywanie wyników.
- Definicje poziomów.

## 11. Testy

Zaimplementuj testy:

1. Powtarzalności symulacji.
2. Resetowania konstrukcji.
3. Poprawności obliczania nagrody.
4. Zgodności środowiska z Gymnasium.
5. Poprawności obsługi strzałów.
6. Zapisywania i wczytywania poziomów.
7. Komunikacji frontend–backend.
8. Uruchomienia krótkiego treningu PPO.

Test deterministyczności powinien sprawdzać, że identyczny poziom, seed, akcja i konfiguracja fizyki prowadzą do identycznego wyniku w tej samej wersji silnika.

## 12. Dokumentacja

Przygotuj README.md zawierające:
- Opis projektu.
- Wymagania.
- Instalację zależności.
- Instrukcję uruchomienia na Windows i Linux.
- Opis architektury.
- Opis obserwacji i akcji.
- Wyjaśnienie funkcji nagrody.
- Opis PPO.
- Przykładowy scenariusz demonstracji.
- Instrukcję uruchomienia testów.

Dodaj plik `requirements.txt` lub `pyproject.toml`, a po stronie frontendowej `package.json`.

## 13. Kolejność implementacji

Zrealizuj projekt etapami:

**Etap 1 – Fizyka i MVP gry**
- Plansza 2D.
- Katapulta.
- Alpaka.
- Elementy konstrukcji.
- Kolizje.
- Jeden przykładowy poziom.
- Ręczne wystrzały.

**Etap 2 – Edytor**
- Dodawanie elementów.
- Przesuwanie i obracanie.
- Zapis poziomów.
- Testowanie stabilności.

**Etap 3 – Środowisko Gymnasium**
- Reset.
- Step.
- Reward.
- Observation.
- Integracja z headless physics engine.

**Etap 4 – Reinforcement Learning**
- PPO.
- Random Agent.
- Rejestrowanie wyników.
- Wybór najlepszego strzału.

**Etap 5 – Dashboard**
- WebSocket.
- Wykresy.
- Heatmapa.
- Podgląd treningu.

**Etap 6 – Finalizacja**
- Replay.
- Zapisywanie eksperymentów.
- Testy.
- Dokumentacja.
- Przykładowe scenariusze.

## 14. Kryteria ukończenia MVP

Projekt jest gotowy, gdy można:

1. Uruchomić aplikację lokalnie.
2. Zbudować konstrukcję z co najmniej trzech rodzajów elementów.
3. Zapisany poziom wykorzystać do treningu.
4. Uruchomić prawdziwy trening PPO.
5. Obserwować rzeczywiste wartości nagrody.
6. Zobaczyć, jakie kąty i siły testował agent.
7. Odtworzyć najlepszą znalezioną próbę.
8. Porównać agenta PPO z losowym.
9. Powtórzyć eksperyment na podstawie zapisanego seeda i konfiguracji.

## 15. Ważne zasady

- Nie generuj atrap funkcjonalności.
- Nie używaj fikcyjnych wartości nagród.
- Nie zakładaj, że każdy trening kończy się sukcesem.
- Nie twórz pseudokodu zamiast działających komponentów.
- Stosuj TypeScript strict.
- Zadbaj o wydajność i unikanie wycieków pamięci.
- Dodaj czytelne komentarze w newralgicznych fragmentach.
- Zadbaj o uruchomienie całego projektu możliwie niewielką liczbą komend.
- Nie kopiuj zasobów graficznych Angry Birds – stwórz własną identyfikację wizualną z alpakami.

## 16. Rozpoczęcie pracy

Najpierw przeanalizuj wymagania i przedstaw krótko docelową architekturę, uwzględniającą wspólną logikę fizyki dla frontendowej wizualizacji i treningu.

Następnie rozpocznij implementację Etapu 1 i kontynuuj kolejne etapy.

Po każdym etapie:
- Sprawdź działanie.
- Uruchom odpowiednie testy.
- Popraw wykryte problemy.
- Podsumuj zaimplementowane funkcjonalności.

Priorytet: działające, atrakcyjne i naukowo poprawne demo, które można wykorzystać podczas warsztatów akademickich poświęconych Reinforcement Learning.