# Dokument wymagań produktu (PRD) - Fiszki MVP

## 1. Przegląd produktu

### 1.1 Cel produktu

Celem produktu jest umożliwienie osobom uczącym się (głównie uczniom i studentom) szybkiego, wygodnego i konsekwentnego korzystania z metody fiszek oraz prostego systemu powtórek (spaced repetition), bez konieczności poświęcania dużej ilości czasu na ręczne tworzenie i organizację materiału.

MVP ma dostarczyć działający w produkcji, prosty, ale pełny przepływ: założenie konta → ręczne utworzenie fiszek → codzienne powtórki → śledzenie podstawowego postępu, z naciskiem na minimalną frustrację użytkownika i łatwość korzystania.

### 1.2 Zakres MVP

W ramach MVP zostaną dostarczone następujące kluczowe funkcjonalności:

- Rejestracja, logowanie, wylogowanie oraz reset hasła użytkownika.
- Ręczne tworzenie fiszek edukacyjnych (front/back + opcjonalny subject).
- Przeglądanie listy własnych fiszek z paginacją i prostą wyszukiwarką po treści.
- Edycja i usuwanie istniejących fiszek (CRUD).
- Prosty system powtórek oparty o datę następnej powtórki (nextReviewAt) i ocenę trudności (trudne/średnie/łatwe).
- Ekran „Powtórki na dziś” z licznikiem postępu (X/Y).
- Minimalny panel ustawień konta (zmiana hasła, usunięcie konta).
- Minimalna sekcja pomocy (FAQ) oraz możliwość kontaktu/zgłoszenia feedbacku.
- Podstawowa analityka zachowań użytkowników (dodawanie fiszek, powtórki).

Generowanie fiszek przy użyciu AI jest wyraźnie przesunięte do kolejnej fazy (Phase 2); w MVP produkt działa w pełni na ręcznie tworzonych fiszkach.

### 1.3 Docelowi użytkownicy i persony

Główne persony:

1. Student liceum przed sprawdzianem/maturą  
   - Czas: ok. 30 minut dziennie.  
   - Potrzeba: szybkie tworzenie prostych fiszek z notatek, jasna lista tego, co trzeba dziś powtórzyć.  
   - Bariery: brak motywacji, chaos w materiałach, odkładanie nauki na później.

2. Student kierunku technicznego/IT  
   - Potrzeba: porządkowanie dużej liczby definicji, pojęć, wzorów; szybkie dodawanie fiszek.  
   - Bariery: czasochłonność ręcznego wprowadzania fiszek, brak wygodnych skrótów i ergonomii.

3. Osoba pracująca ucząca się języka obcego  
   - Czas: krótkie sesje po 10–15 minut.  
   - Potrzeba: prosty rytm powtórek i jasne poczucie progresu.  
   - Bariery: zapominanie o regularnych powtórkach, szybkie zniechęcanie się przy braku widocznych efektów.

### 1.4 Główne założenia techniczne

- Frontend:
  - Astro 5 jako framework do budowy szybkiego frontendu.
  - React 19 dla interaktywnych komponentów (formularze, ekrany powtórek).
  - TypeScript 5 dla statycznego typowania.
  - Tailwind 4 do stylowania.
  - Komponenty UI oparte o shadcn/ui.

- Backend / baza danych:
  - Supabase jako Backend-as-a-Service:
    - PostgreSQL jako baza danych.
    - Supabase Auth jako podstawowy system autentykacji użytkowników.
  - Model danych zaprojektowany z myślą o prostocie i późniejszej rozbudowie (User, Flashcard, ReviewSchedule / pola nextReviewAt w fiszce).

- Analityka i AI:
  - Analityka: Google Analytics lub Plausible + własne eventy aplikacyjne (zapisywane w logach/DB).
  - AI: komunikacja z modelami przez OpenRouter w Phase 2 (nieużywane w MVP, ale uwzględnione w założeniach modelu danych i analityki).

- CI/CD i hosting:
  - GitHub Actions do CI/CD (build, testy, ewentualnie deploy).
  - Hosting na DigitalOcean przy użyciu obrazu Docker.

### 1.5 Założenia organizacyjne i harmonogram

- Realizacja MVP przez jednego developera (solo dev).
- Horyzont czasowy: do 22 stycznia (od początku stycznia).
- Organizacja pracy:
  - Tygodniowe iteracje (sprinty) z naciskiem na dowiezienie zakresu must-have.
  - Jeden dzień w tygodniu przeznaczony na poprawki błędów i porządki techniczne.
  - Jasno zdefiniowana hierarchia: must-have → should-have → could-have (do cięcia w razie poślizgu).

## 2. Problem użytkownika

### 2.1 Główny problem

Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne i męczące. Pomimo wysokiej skuteczności metody spaced repetition, wielu uczących się rezygnuje z niej, ponieważ:

- samo przygotowanie fiszek (przepisywanie notatek, wyciąganie pojęć) zajmuje dużo czasu,
- trudno utrzymać porządek w rosnącej liczbie fiszek,
- brak prostego, zintegrowanego widoku „co dzisiaj powtórzyć”.

W efekcie użytkownicy:

- albo w ogóle nie zaczynają pracy z fiszkami,
- albo porzucają je po krótkim czasie,
- albo korzystają z wielu rozproszonych narzędzi (notatki, arkusze, aplikacje), co zwiększa chaos.

### 2.2 Potrzeby użytkowników

Kluczowe potrzeby:

- Szybkie i mało frustrujące dodawanie nowych fiszek (z minimalną liczbą kroków i kliknięć).
- Możliwość powtarzania materiału w krótkich, regularnych sesjach (10–30 minut).
- Jasne wskazanie, które fiszki trzeba dziś powtórzyć (dzienna lista powtórek).
- Prosty, nieprzytłaczający interfejs, który działa dobrze na telefonie (powtórki) i na desktopie (tworzenie).
- Podstawowe poczucie progresu (np. licznik powtórek dzisiaj).

### 2.3 Bariery i ryzyka po stronie użytkowników

Najważniejsze bariery:

- Niska motywacja i tendencja do odkładania nauki.
- Frustracja związana z ręcznym przepisywaniem materiałów.
- Chaos w fiszkach (brak prostych kategorii/subjectów i wyszukiwarki).
- Brak przypomnień o powtórkach.

MVP adresuje przede wszystkim:

- zmniejszenie tarcia przy dodawaniu i przeglądaniu fiszek,
- uproszczenie procesu powtórek (jeden dedykowany ekran „dzisiaj”),
- minimalne wskaźniki progresu.

## 3. Wymagania funkcjonalne

### 3.1 System kont użytkowników (auth)

- Rejestracja konta:
  - Rejestracja przy użyciu adresu email i hasła.
  - Hasło musi spełniać minimalne wymagania (np. min. 8 znaków).
  - Brak obowiązkowej weryfikacji email w MVP (opcjonalnie, jeśli Supabase ułatwia wdrożenie).

- Logowanie i wylogowanie:
  - Logowanie email + hasło.
  - Bezpieczne sesje / tokeny (np. JWT zarządzane przez Supabase Auth).
  - Możliwość wylogowania z aplikacji (czyszczenie sesji).

- Reset hasła:
  - Funkcja „Zapomniałem hasła”.
  - Wysłanie maila z linkiem do ustawienia nowego hasła.
  - Formularz ustawienia nowego hasła z walidacją.

- Ustawienia konta:
  - Ekran pozwalający na zmianę hasła po zalogowaniu.
  - Usunięcie konta i wszystkich danych użytkownika (z potwierdzeniem).

### 3.2 Zarządzanie fiszkami (CRUD)

- Struktura fiszki:
  - Pola obowiązkowe:
    - front (pytanie/hasło, tekst, do ok. 120 znaków, plain text),
    - back (odpowiedź/wyjaśnienie, tekst, do ok. 300 znaków, plain text).
  - Pola opcjonalne:
    - subject (pojedynczy string, np. „Biologia”, „JS”, „Angielski”).
  - Pola systemowe (nieedytowane bezpośrednio przez użytkownika):
    - id, userId, createdAt, updatedAt,
    - nextReviewAt (data kolejnej powtórki),
    - opcjonalne pola pod przyszłe AI: source (manual/ai), aiBatchId (nullable), aiVersion (nullable).

- Tworzenie fiszki:
  - Użytkownik z poziomu dashboardu/listy fiszek może kliknąć „Dodaj fiszkę”.
  - Formularz zawiera pola: front, back, subject (opcjonalny).
  - Walidacja: front i back wymagane, limity długości, brak pustych pól.
  - Po zapisie:
    - nextReviewAt ustawione wg prostej reguły (np. od razu na „dziś” lub jutro).
    - Użytkownik wybiera: „Zapisz i dodaj kolejną” albo „Zapisz i wróć do listy”.
  - Obsługa klawiatury:
    - Tab przechodzi między polami formularza.
    - Enter/Ctrl+Enter może służyć do zapisu (np. Ctrl+Enter = „zapisz i dodaj kolejną”).

- Edycja fiszki:
  - Możliwość otwarcia formularza edycji z listy fiszek lub ekranu szczegółów.
  - Edytowalne pola: front, back, subject.
  - Walidacja jak przy tworzeniu.
  - Zapis zmian aktualizuje updatedAt, nie resetuje bez powodu historii powtórek (szczegóły logiki mogą zostać ustalone).

- Usuwanie fiszki:
  - Usunięcie możliwe z listy fiszek lub ekranu szczegółów.
  - Wymagane potwierdzenie w modalu („Na pewno chcesz usunąć tę fiszkę?”).
  - Po potwierdzeniu fiszka jest trwale usuwana (wraz z powiązanymi danymi powtórek).

### 3.3 Lista fiszek, wyszukiwanie i paginacja

- Lista fiszek (dashboard):
  - Widok tabeli/listy z podstawowymi informacjami: front (pełny lub skrócony), fragment back, subject, daty (opcjonalnie).
  - Domyślne sortowanie: najnowsze (createdAt desc) lub inne sensowne ustawienie (np. do ustalenia).
  - Paginacja:
    - Paginacja po 50 fiszek (na desktopie) i możliwość dopasowania do mobile (np. 25).
    - Przyciski „Poprzednie/Następne” do poruszania się między stronami.
  - Limit liczby fiszek na użytkownika: ok. 2000 w MVP (po przekroczeniu – komunikat i zachęta do porządków).

- Wyszukiwanie:
  - Jedno pole „Szukaj” przeszukujące treść front i back w obrębie wszystkich fiszek użytkownika.
  - Dopasowanie tekstowe (substring, bez złożonego filtrowania).
  - Filtrowanie po subject/tagach odłożone do Phase 2.

### 3.4 System powtórek

- Dane potrzebne do powtórek:
  - Każda fiszka posiada pole nextReviewAt (data najbliższej powtórki).
  - Potrzebne są również: createdAt, ewentualnie liczba dotychczasowych powtórek i „trudność” (może być wyliczana pośrednio).

- Logika wyznaczania dziennej listy powtórek:
  - „Dzisiaj do powtórki” to wszystkie fiszki użytkownika, dla których nextReviewAt ≤ „dziś” (wg strefy czasu serwera PL/Europe/Warsaw).
  - Maksymalny dzienny limit powtórek: 100 fiszek (dla komfortu UX i wydajności).
  - Sortowanie fiszek w sesji:
    - najpierw po nextReviewAt rosnąco,
    - następnie po createdAt rosnąco (dla deterministycznego zachowania).

- Ekran powtórek:
  - Ekran „Powtórki na dziś” pokazujący:
    - bieżącą fiszkę (najpierw front),
    - przycisk/klawisz „Pokaż odpowiedź” (np. Space),
    - po pokazaniu odpowiedzi – opcje oceny: trudne, średnie, łatwe (np. klawisze 1/2/3),
    - licznik postępu: X/Y (liczba powtórek wykonanych względem całkowitej liczby fiszek na dziś).
  - Po wybraniu oceny aplikacja:
    - aktualizuje nextReviewAt zgodnie z prostą regułą:
      - trudne: kolejna powtórka następnego dnia,
      - średnie: kolejna powtórka za 1 dzień (lub inna prosta logika),
      - łatwe: kolejna powtórka za 3 dni,
    - przechodzi automatycznie do kolejnej fiszki z listy.
  - Po wyczerpaniu listy:
    - wyświetlany jest stan „Brak fiszek do powtórek na dziś”.

### 3.5 Bezpieczeństwo, prywatność i usuwanie danych

- Bezpieczeństwo backendu/API:
  - Hasła przechowywane w formie zahashowanej (wg standardów Supabase/industry).
  - Bezpieczne sesje/tokeny (np. JWT) i ochrona danych użytkownika.
  - Rate limiting na:
    - logowanie,
    - operacje write (tworzenie, edycja, usuwanie fiszek, usuwanie konta).
  - Podstawowa konfiguracja CORS (akceptowana tylko domena frontendu).
  - Sanitizacja danych wejściowych (escape/strip HTML) w celu ochrony przed XSS.
  - Ochrona przed brute-force (blokada konta lub cooldown po X nieudanych próbach logowania).

- Prywatność i RODO (minimalnie):
  - Produkt skierowany do użytkowników indywidualnych (brak integracji instytucjonalnych, brak specjalnego traktowania profili nieletnich poza standardem Supabase).
  - Możliwość usunięcia konta i wszystkich powiązanych danych (hard delete) z poziomu ustawień.
  - Ograniczenie logowania treści wrażliwych:
    - w logach technicznych nie przechowuje się pełnych treści fiszek,
    - logi zdarzeń ograniczone do metadanych (id, typ operacji).
  - Prosty regulamin i polityka prywatności opisujące:
    - jakie dane są przechowywane (konto, fiszki),
    - w jakim celu,
    - jak użytkownik może zażądać usunięcia danych.

### 3.6 Analityka i logowanie zdarzeń

- Cele analityczne MVP:
  - Śledzenie aktywności użytkowników (logowania, tworzenie fiszek, powtórki).
  - Pomiar podstawowych KPI: liczba aktywnych użytkowników, liczba fiszek, liczba powtórek.

- Eventy produktowe (minimalny zestaw):
  - flashcard_created (źródło: manual, przypisanie do userId),
  - flashcard_updated,
  - flashcard_deleted,
  - review_started (rozpoczęcie sesji powtórek),
  - review_answered (z oceną trudne/średnie/łatwe, referencja do flashcardId),
  - review_session_completed (gdy użytkownik przejdzie przez wszystkie fiszki na dziś).

- Dodatkowo, pod Phase 2 (AI):
  - ai_generate_requested,
  - ai_cards_received,
  - ai_card_saved,
  - ai_card_rejected.

- Logowanie:
  - Poziomy logów:
    - info: kluczowe akcje (rejestracja/logowanie, operacje CRUD na fiszkach, zakończenie sesji powtórek),
    - warn: nieudane próby logowania, przekroczenie limitów, istotne walidacje,
    - error: błędy serwera, wyjątki nieobsłużone.
  - Logi przechowywane w standardowym mechanizmie hostingu (konsola/plik), z retencją ok. 7–14 dni.

### 3.7 Obsługa błędów i edge-case’ów (UX)

- Scenariusze błędów przy formularzach fiszek:
  - Błąd zapisu (500/timeout): użytkownik widzi jasny komunikat i ma możliwość ponowienia; dane z formularza nie są tracone.
  - Utrata połączenia: komunikat „offline”, blokada zapisu, próba automatycznego ponowienia po odzyskaniu połączenia (lub wyraźny przycisk „Spróbuj ponownie”).
  - Odświeżenie strony przy edycji: ostrzeżenie o niezapisanych zmianach (lub lokalny draft jako nice-to-have).

- Scenariusze błędów przy powtórkach:
  - Brak fiszek do powtórek: ekran pustego stanu z komunikatem „Nie masz dziś fiszek do powtórki” i linkiem do dodania nowych fiszek.
  - Błąd przy odczycie listy powtórek: komunikat błędu + przycisk ponownego załadowania.

- Błędy krytyczne frontendu:
  - Globalny „error boundary”:
    - Wyświetla prosty ekran „Coś poszło nie tak. Spróbuj odświeżyć stronę lub zalogować się ponownie”.
    - Zapisywane są logi błędu (np. do konsoli lub endpointu backendowego).

### 3.8 Testy, CI/CD i jakość front-endu

- CI/CD:
  - GitHub Actions uruchamia:
    - build aplikacji,
    - testy jednostkowe,
    - test E2E głównego przepływu (szczegóły w historyjkach użytkownika).

- Minimalna strategia testów:
  - Testy jednostkowe kluczowej logiki powtórek (wyliczanie nextReviewAt dla ocen trudne/średnie/łatwe).
  - Co najmniej jeden test E2E:
    - rejestracja/logowanie,
    - dodanie fiszki,
    - wykonanie powtórki,
    - zapis oceny i aktualizacja nextReviewAt.
  - Krótka checklista manualna: CRUD fiszek, powtórki, reset hasła, usuwanie konta.

- Wymagania jakości front-endu:
  - Brak krytycznych błędów JS w konsoli na głównych ścieżkach (logowanie, dashboard, dodawanie fiszek, powtórki).
  - Stabilny layout na desktopie i mobile dla trzech głównych ekranów (lista, formularz fiszki, powtórki).
  - Jako nice-to-have: brak „czerwonych” ostrzeżeń w Lighthouse w obszarach Performance i Accessibility dla głównych ekranów.

## 4. Granice produktu

### 4.1 Zakres w ramach MVP

W ramach MVP wchodzą:

- System kont użytkowników (rejestracja, logowanie, reset hasła, zmiana hasła, wylogowanie, usunięcie konta).
- Ręczne tworzenie, edycja, usuwanie i przeglądanie fiszek.
- Prosta struktura organizacyjna: jedna płaska lista fiszek + opcjonalne pole subject (pojedynczy string).
- Prosty ekran powtórek „na dziś” z oceną trudności (trudne/średnie/łatwe).
- Paginacja i wyszukiwanie tekstowe po treści fiszek.
- Minimalne ekrany pomocy (FAQ) i kontaktu/feedbacku.
- Minimalna analityka oraz podstawowe zabezpieczenia (security/RODO).

### 4.2 Poza zakresem MVP / Phase 2 i dalej

Poza zakresem pierwszego MVP znajdują się:

- Generowanie fiszek przy użyciu AI (na podstawie wklejonego tekstu lub importów).
- Zaawansowany, adaptacyjny algorytm powtórek (np. podobny do SuperMemo/Anki).
- Import/eksport materiałów w różnych formatach (PDF, DOCX itp.).
- Udostępnianie i współdzielenie zestawów fiszek między użytkownikami.
- Rozbudowane statystyki (streaki, wykresy, szczegółowe raporty).
- Notyfikacje push/email przypominające o powtórkach.
- Aplikacje mobilne natywne (Android/iOS).
- Zaawansowany system tagów/zestawów (Deck) i filtrów powtórek.
- Pełna internacjonalizacja UI (MVP tylko w języku polskim).
- Mechanizmy moderacji treści i zgłaszania nadużyć (MVP zakłada użytkownika indywidualnego i samoregulację).

Te elementy mogą zostać opisane w sekcji roadmapy jako przyszłe kroki (Phase 2/3), ale nie są wymagane do zakończenia MVP.

## 5. Historyjki użytkowników

Poniżej przedstawiono zestaw historyjek użytkowników pokrywających wszystkie kluczowe interakcje w MVP. Każda historia zawiera ID, tytuł, opis i testowalne kryteria akceptacji.

### US-001 Rejestracja konta

ID: US-001  
Tytuł: Rejestracja nowego konta  
Opis: Jako nowy użytkownik chcę móc założyć konto przy użyciu emaila i hasła, aby zapisane fiszki i powtórki były przypisane do mnie i dostępne z różnych urządzeń.

Kryteria akceptacji:
- Formularz rejestracji przyjmuje adres email i hasło spełniające wymagania (np. min. 8 znaków).
- Wprowadzenie niepoprawnego emaila lub zbyt krótkiego hasła skutkuje czytelnym komunikatem walidacyjnym.
- Po poprawnym wypełnieniu formularza tworzony jest zapis użytkownika w bazie i użytkownik jest automatycznie logowany lub przekierowany do ekranu logowania.
- Próba rejestracji z istniejącym już emailem zwraca czytelny błąd.

### US-002 Logowanie

ID: US-002  
Tytuł: Logowanie do aplikacji  
Opis: Jako zarejestrowany użytkownik chcę zalogować się do aplikacji, aby uzyskać dostęp do moich fiszek i powtórek.

Kryteria akceptacji:
- Formularz logowania przyjmuje adres email i hasło.
- Podanie niepoprawnych danych logowania skutkuje czytelnym komunikatem o błędzie bez ujawniania, co jest niepoprawne.
- Po poprawnym logowaniu użytkownik zostaje przekierowany na dashboard/listę fiszek.
- Sesja jest utrzymywana zgodnie z konfiguracją (np. do zamknięcia przeglądarki lub dłużej, w zależności od polityki).

### US-003 Wylogowanie

ID: US-003  
Tytuł: Wylogowanie z aplikacji  
Opis: Jako zalogowany użytkownik chcę móc się wylogować, aby nikt inny nie miał dostępu do moich danych na wspólnym urządzeniu.

Kryteria akceptacji:
- Z poziomu nawigacji dostępna jest akcja „Wyloguj”.
- Po wylogowaniu sesja jest unieważniana (tokeny usuwane).
- Użytkownik jest przekierowany na stronę logowania lub ekran powitalny.

### US-004 Reset hasła

ID: US-004  
Tytuł: Reset zapomnianego hasła  
Opis: Jako użytkownik, który zapomniał hasła, chcę otrzymać mail z linkiem do ustawienia nowego hasła, aby odzyskać dostęp do konta.

Kryteria akceptacji:
- Na ekranie logowania dostępny jest link „Zapomniałem hasła”.
- Po podaniu zarejestrowanego emaila wysyłany jest mail z linkiem resetującym hasło.
- Kliknięcie w link prowadzi do formularza ustawienia nowego hasła.
- Ustawienie nowego hasła umożliwia ponowne zalogowanie się z użyciem nowego hasła.
- Podanie nieistniejącego emaila nie ujawnia, czy konto istnieje (zachowanie neutralne).

### US-005 Zmiana hasła

ID: US-005  
Tytuł: Zmiana hasła w ustawieniach konta  
Opis: Jako zalogowany użytkownik chcę móc zmienić swoje hasło, aby zwiększyć bezpieczeństwo konta.

Kryteria akceptacji:
- W ustawieniach konta dostępny jest formularz zmiany hasła.
- Formularz wymaga podania aktualnego hasła oraz nowego hasła (z walidacją).
- Podanie niepoprawnego aktualnego hasła skutkuje błędem.
- Po poprawnej zmianie hasła kolejne logowania wymagają podania nowego hasła.

### US-006 Usunięcie konta i danych

ID: US-006  
Tytuł: Usunięcie konta  
Opis: Jako zalogowany użytkownik chcę móc trwale usunąć swoje konto i wszystkie dane (fiszki, powtórki), aby mieć kontrolę nad swoją prywatnością.

Kryteria akceptacji:
- W ustawieniach konta dostępna jest opcja „Usuń konto”.
- Po jej wybraniu pojawia się modal z ostrzeżeniem o nieodwracalnym usunięciu.
- Do potwierdzenia wymagane jest wpisanie określonego słowa (np. „USUŃ”) lub hasła.
- Po potwierdzeniu konto i wszystkie powiązane dane są trwale usuwane.
- Po usunięciu użytkownik nie może się już zalogować przy użyciu starego konta.

### US-007 Przeglądanie listy fiszek

ID: US-007  
Tytuł: Przeglądanie własnych fiszek  
Opis: Jako zalogowany użytkownik chcę widzieć listę wszystkich moich fiszek, aby móc je przeglądać i zarządzać nimi.

Kryteria akceptacji:
- Dashboard po zalogowaniu wyświetla listę fiszek użytkownika w postaci tabeli/listy.
- Dla każdej fiszki widoczne są co najmniej: front (cały lub skrócony), fragment back, subject (jeśli ustawiony).
- Lista jest paginowana (50 fiszek na stronę), z przyciskami do przechodzenia między stronami.
- Brak fiszek wyświetla ekran pustego stanu z zachętą do dodania pierwszej fiszki.

### US-008 Wyszukiwanie fiszek po treści

ID: US-008  
Tytuł: Wyszukiwanie fiszek  
Opis: Jako użytkownik z większą liczbą fiszek chcę móc wyszukać fiszki po tekście front lub back, aby szybko znaleźć interesującą mnie kartę.

Kryteria akceptacji:
- Na liście fiszek dostępne jest pole „Szukaj”.
- Wpisanie frazy filtruje listę fiszek po dopasowaniu do front lub back.
- Wyczyśczenie pola wyszukiwania przywraca pełną listę (z paginacją).
- Wyszukiwanie działa w akceptowalnym czasie dla typowej liczby fiszek (np. do 2000).

### US-009 Dodanie nowej fiszki ręcznie

ID: US-009  
Tytuł: Ręczne tworzenie fiszki  
Opis: Jako użytkownik chcę łatwo dodać nową fiszkę z pytaniem i odpowiedzią, aby budować swój zestaw do nauki.

Kryteria akceptacji:
- Na liście fiszek dostępny jest przycisk „Dodaj fiszkę”.
- Kliknięcie otwiera formularz z polami front, back oraz opcjonalnie subject.
- Próba zapisu z pustym front lub back zwraca czytelny komunikat walidacyjny.
- Poprawny zapis tworzy nową fiszkę przypisaną do aktualnego użytkownika, z ustawionym nextReviewAt.
- Po zapisie użytkownik może wybrać „Zapisz i dodaj kolejną” lub „Zapisz i wróć do listy”.

### US-010 Edycja istniejącej fiszki

ID: US-010  
Tytuł: Edycja fiszki  
Opis: Jako użytkownik chcę móc zmodyfikować treść istniejącej fiszki, aby poprawić błędy lub doprecyzować pytanie/odpowiedź.

Kryteria akceptacji:
- Z listy fiszek dostępna jest akcja „Edytuj” dla każdej fiszki.
- Formularz edycji wyświetla aktualny front, back, subject.
- Zastosowane są te same walidacje co przy tworzeniu (brak pustych pól, limity długości).
- Po zapisie zmiany są widoczne na liście fiszek i w przyszłych powtórkach.

### US-011 Usunięcie fiszki

ID: US-011  
Tytuł: Usunięcie fiszki  
Opis: Jako użytkownik chcę móc usunąć niepotrzebną lub błędną fiszkę, aby utrzymać porządek w swoim zbiorze.

Kryteria akceptacji:
- Z listy fiszek dostępna jest akcja „Usuń” dla każdej fiszki.
- Po kliknięciu pojawia się modal potwierdzający zamiar usunięcia.
- Wybranie opcji „Usuń” usuwa fiszkę trwale z bazy.
- Usunięta fiszka nie pojawia się więcej na liście ani w powtórkach.

### US-012 Przegląd fiszek do powtórki na dziś

ID: US-012  
Tytuł: Lista powtórek na dziś  
Opis: Jako użytkownik chcę mieć osobny ekran pokazujący fiszki, które powinienem dziś powtórzyć, aby mieć jasny plan nauki.

Kryteria akceptacji:
- Z nawigacji dostępny jest link do ekranu „Powtórki na dziś”.
- Ekran pobiera z bazy fiszki, dla których nextReviewAt ≤ dziś (wg czasu serwera).
- Jeśli liczba fiszek przekracza 100, wyświetlane jest maksymalnie 100 na daną sesję.
- Gdy nie ma fiszek do powtórki, wyświetlany jest pusty stan z odpowiednim komunikatem i linkiem do dodania fiszek.

### US-013 Powtarzanie pojedynczej fiszki

ID: US-013  
Tytuł: Powtórka pojedynczej fiszki  
Opis: Jako użytkownik chcę w sesji powtórek widzieć najpierw pytanie, a dopiero po kliknięciu odpowiedź, aby móc sprawdzić swoją wiedzę.

Kryteria akceptacji:
- Podczas sesji powtórek pierwszym ekranem dla każdej fiszki jest front (pytanie/hasło).
- Kliknięcie przycisku lub naciśnięcie klawisza (np. Space) odsłania back (odpowiedź).
- Do momentu odsłonięcia odpowiedzi nie są widoczne przyciski oceny trudności lub są nieaktywne.

### US-014 Ocenianie trudności fiszki i planowanie powtórki

ID: US-014  
Tytuł: Ocenianie trudności odpowiedzi  
Opis: Jako użytkownik chcę po odsłonięciu odpowiedzi oznaczyć, czy dana fiszka była dla mnie trudna, średnia czy łatwa, aby system dobrał kolejną datę powtórki.

Kryteria akceptacji:
- Po odsłonięciu odpowiedzi dostępne są trzy opcje (przyciski lub klawisze): trudne, średnie, łatwe (np. 1/2/3).
- Wybranie jednej z opcji:
  - zapisuje wynik w historii powtórek (np. w polu pomocniczym lub osobnej tabeli),
  - aktualizuje pole nextReviewAt według zdefiniowanej reguły (trudne – jutro, średnie – za 1 dzień, łatwe – za 3 dni),
  - przechodzi automatycznie do kolejnej fiszki w sesji.
- Błędne zapisanie aktualizacji (np. błąd serwera) skutkuje komunikatem błędu i umożliwia ponowienie próby.

### US-015 Informacja o postępie w sesji powtórek

ID: US-015  
Tytuł: Licznik powtórek w sesji  
Opis: Jako użytkownik chcę podczas sesji widzieć, ile fiszek już powtórzyłem, a ile zostało, aby mieć poczucie postępu.

Kryteria akceptacji:
- Na ekranie powtórek wyświetlany jest licznik X/Y, gdzie:
  - X to liczba fiszek już ocenionych w bieżącej sesji,
  - Y to całkowita liczba fiszek do powtórki na dziś (maks. 100).
- Licznik aktualizuje się po każdej ocenionej fiszce.
- Po zakończeniu sesji (X = Y) wyświetla się komunikat o ukończeniu powtórek na dziś.

### US-016 Obsługa błędów przy zapisie fiszki

ID: US-016  
Tytuł: Bezpieczny zapis fiszek przy błędach sieci  
Opis: Jako użytkownik chcę, aby przy problemach z połączeniem czy serwerem moje wpisane dane nie znikały, abym nie musiał wszystkiego wprowadzać ponownie.

Kryteria akceptacji:
- W razie błędu HTTP (np. 500, timeout) przy zapisie fiszki użytkownik otrzymuje jasny komunikat o błędzie.
- Dane wpisane w formularz pozostają w polach po wystąpieniu błędu.
- Użytkownik może ponowić próbę zapisu jednym kliknięciem.

### US-017 Obsługa braku internetu podczas pracy

ID: US-017  
Tytuł: Informowanie o trybie offline  
Opis: Jako użytkownik chcę zostać poinformowany, gdy stracę połączenie z internetem podczas pracy z aplikacją, aby zrozumieć, czemu zapisy nie działają.

Kryteria akceptacji:
- Aplikacja wykrywa brak połączenia (o ile jest to technicznie możliwe) i wyświetla stosowny komunikat.
- Podczas braku połączenia blokowane są akcje wymagające komunikacji z serwerem (z czytelnym komunikatem).
- Po odzyskaniu połączenia komunikat znika lub jest aktualizowany, a operacje mogą być ponawiane.

### US-018 Przegląd i edycja ustawień konta

ID: US-018  
Tytuł: Ustawienia konta  
Opis: Jako zalogowany użytkownik chcę mieć ekran ustawień konta, na którym mogę zmienić hasło i ewentualnie usunąć konto.

Kryteria akceptacji:
- Ekran ustawień zawiera sekcję zmiany hasła (US-005) i sekcję usunięcia konta (US-006).
- Dane dostępowe (email) są wyświetlane w formie tylko do odczytu (bez zmiany w MVP).
- Próby wejścia na ekran ustawień bez zalogowania przekierowują na ekran logowania.

### US-019 Przegląd FAQ i zgłoszenie feedbacku

ID: US-019  
Tytuł: FAQ i kontakt  
Opis: Jako użytkownik chcę mieć możliwość szybkiego sprawdzenia odpowiedzi na podstawowe pytania oraz zgłoszenia błędu lub sugestii, aby w razie problemów nie blokować się na dalszej nauce.

Kryteria akceptacji:
- Dostępna jest sekcja „Pomoc”/„FAQ” z kilkoma najczęstszymi pytaniami (np. jak dodać fiszkę, jak działa powtórka).
- Na tej samej stronie lub w widocznym miejscu znajduje się link „Zgłoś błąd/feedback”.
- Link prowadzi do otwarcia klienta mailowego lub prostego formularza kontaktowego kierującego zgłoszenie na skonfigurowany adres email.

## 6. Metryki sukcesu

### 6.1 Metryki produktowe (MVP)

- Weekly Active Users (WAU):
  - Cel: co najmniej 20–50 aktywnych użytkowników tygodniowo w okresie testów MVP (zamknięta beta).

- Liczba fiszek na aktywnego użytkownika:
  - Cel: średnio co najmniej 30–50 zapisanych fiszek na aktywnego użytkownika po tygodniu korzystania.

- Retencja 7-dniowa (D7):
  - Cel: co najmniej 20–30 procent użytkowników wraca do aplikacji w ciągu 7 dni od pierwszej wizyty.

- Aktywność powtórek:
  - Odsetek aktywnych użytkowników, którzy wykonali co najmniej jedną sesję powtórek w danym tygodniu.
  - Średnia liczba fiszek powtórzonych na aktywnego użytkownika tygodniowo.

### 6.2 Metryki techniczne i jakościowe

- Stabilność:
  - Brak krytycznych błędów (errorów) uniemożliwiających przejście głównego flow (logowanie → dodanie fiszki → powtórki).
  - Uptime na poziomie akceptowalnym dla MVP (np. brak długotrwałych niedostępności).

- Wydajność:
  - Czas ładowania dashboardu (lista fiszek) do 2–3 sekund dla typowej liczby fiszek (do 500).
  - Czas przejścia między kolejnymi fiszkami w sesji powtórek praktycznie natychmiastowy.

- Testy:
  - Test E2E głównego przepływu przechodzi w CI bez błędów.
  - Kluczowe testy jednostkowe logiki nextReviewAt zaliczają się w CI.

### 6.3 Metryki pod przyszłą fazę AI (Phase 2)

Choć AI nie jest częścią MVP, już teraz definiuje się docelowe metryki, które będą używane po wdrożeniu generatora AI:

- Akceptacja fiszek AI:
  - AI acceptance rate = liczba fiszek AI zapisanych (zaakceptowanych) / liczba fiszek AI wygenerowanych w danym okresie.
  - Cel: 75 procent lub więcej.

- Udział fiszek tworzonych z pomocą AI:
  - AI-assisted share = liczba fiszek zapisanych, które mają source = ai / liczba wszystkich zapisanych fiszek.
  - Cel: 75 procent lub więcej.

Do liczenia tych metryk w przyszłości wykorzystane zostaną eventy ai_generate_requested, ai_cards_received, ai_card_saved, ai_card_rejected oraz pola source i aiBatchId w modelu danych.


