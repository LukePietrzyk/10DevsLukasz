# Dokument Wymagań Produktu (PRD) – 10x-cards (MVP)

| **Nazwa Projektu** | 10x-cards |
| :--- | :--- |
| **Wersja** | 1.0 (MVP Scope) |
| **Status** | Do wdrożenia |
| **Data** | 2025 |

---

## 1. Przegląd Produktu (Executive Summary)
**10x-cards** to aplikacja webowa typu *flashcards* (fiszki), której głównym wyróżnikiem jest drastyczne przyspieszenie procesu tworzenia materiałów edukacyjnych dzięki wykorzystaniu Generatywnej Sztucznej Inteligencji (GenAI). System pozwala użytkownikom generować zestawy fiszek z wklejonego tekstu, weryfikować je, a następnie uczyć się przy użyciu sprawdzonego algorytmu *spaced repetition*.

## 2. Problem i Rozwiązanie
*   **Problem:** Manualne tworzenie wysokiej jakości fiszek jest czasochłonne, trudne dla początkujących (problem z atomizacją wiedzy) i zniechęca do regularnej nauki.
*   **Rozwiązanie:** Automatyzacja procesu tworzenia pytań i odpowiedzi ("Przód/Tył") z dostarczonego tekstu, przy zachowaniu pełnej kontroli użytkownika nad jakością materiału (tryb recenzji).

## 3. Kluczowe Wskaźniki Sukcesu (KPIs)
1.  **Jakość AI:** 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika (bez edycji lub z minimalną korektą).
2.  **Adopcja AI:** Użytkownicy tworzą 75% swoich fiszek z wykorzystaniem AI (w stosunku do tworzenia manualnego).
3.  **Retencja:** Ukończenie sesji nauki (dotarcie do ekranu "Na dziś to wszystko").

---

## 4. Wymagania Funkcjonalne

### 4.1. Uwierzytelnianie i Konto Użytkownika
*   **Rejestracja:** Email + Hasło. Wymagane zaznaczenie checkboxa "Akceptuję Regulamin i Politykę Prywatności".
    *   *Brak weryfikacji maila (soft opt-in) w celu obniżenia bariery wejścia.*
*   **Logowanie:** Standardowe (Email/Hasło).
    *   *Długość sesji:* Token ważny min. 14-30 dni (persistent login).
*   **Zarządzanie kontem:**
    *   Możliwość zmiany hasła.
    *   **Eksport danych:** Przycisk generujący plik JSON/CSV z wszystkimi fiszkami użytkownika.
    *   **Usuwanie konta:** "Hard delete" (trwałe usunięcie konta i wszystkich danych użytkownika z bazy).

### 4.2. Zarządzanie Taliami (Decks)
*   **Tworzenie Talii:** Odbywa się w momencie tworzenia/generowania fiszek. Użytkownik wpisuje nazwę talii.
    *   *Logika:* Jeśli talia o podanej nazwie istnieje -> dopisz fiszki. Jeśli nie istnieje -> utwórz nową.
*   **Lista Talii:** Widok główny z listą dostępnych zestawów.
*   **Usuwanie Talii:** Opcja "Usuń talię".
    *   *Wymaganie:* Cascade Delete (usunięcie talii usuwa trwale wszystkie przypisane do niej fiszki).
    *   *UX:* Wymagane potwierdzenie w oknie modalnym ("Czy na pewno? Operacja nieodwracalna").
*   **Reset postępów:** W ustawieniach talii opcja "Zresetuj postępy" – zeruje historię powtórek dla wszystkich fiszek w zestawie (stan "Nowe").

### 4.3. Generowanie Fiszek (AI) – Core Feature
*   **Input:** Pole tekstowe przyjmujące od **3000 do 4000 znaków**.
    *   Tekst jest automatycznie czyszczony z formatowania HTML (*strip tags*) przed wysłaniem do API.
*   **Model AI:** Wykorzystanie modelu klasy lightweight (rekomendowane: **GPT-4o-mini** lub **Claude 3 Haiku**) dla balansu między kosztami a jakością.
*   **Prompt Systemowy:** Musi wymuszać strukturę JSON oraz limity znaków (Front: <200, Back: <500) oraz język zgodny z tekstem źródłowym.
*   **Obsługa błędów i limitów:**
    *   *Zbyt krótki/słaby tekst:* Wyświetlenie porady: "Tekst jest za krótki lub zbyt ogólny. Spróbuj wkleić fragment zawierający definicje lub daty".
    *   *Limit dzienny:* Jeśli użytkownik przekroczy limit zapytań, wyświetla się modal: "Osiągnąłeś dzisiejszy limit generowania fiszek. Wróć jutro...".
*   **Stan oczekiwania:** Wyświetlanie "Skeleton Loader" lub animacji z komunikatem "Analizuję Twój tekst...", aby utrzymać uwagę użytkownika (czas oczekiwania 5-15s).

### 4.4. Tryb Recenzji (Kandydaci na fiszki)
*   **Status Kandydatów:** Wygenerowane fiszki NIE trafiają od razu do bazy danych. Są przechowywane w `LocalStorage`/`SessionStorage` do momentu akceptacji.
*   **Interfejs:** Widok listy/kafelków.
*   **Akcje dla każdej fiszki:**
    *   *Akceptuj* (Domyślny stan lub łatwe zaznaczenie wszystkich).
    *   *Edytuj* (Edycja treści przed zapisaniem).
    *   *Odrzuć* (Fiszka znika z listy).
*   **Zapis:** Przycisk "Zapisz wybrane do Talii" przenosi zaakceptowane fiszki do bazy danych.

### 4.5. Manualne Tworzenie i Edycja
*   **Formularz:** Pola "Przód" (Front), "Tył" (Back), "Nazwa Talii".
*   **Walidacja:**
    *   Front: max 200 znaków.
    *   Back: max 500 znaków.
    *   Widoczne liczniki znaków (np. "150/200").
*   **Formatowanie:** Obsługa podstawowego **Markdown** (pogrubienie, kursywa, listy, prosty kod).
*   **Usuwanie pojedynczej fiszki:** Hard delete z potwierdzeniem (modal).

### 4.6. Sesja Nauki (Learning Mode)
*   **Algorytm:** Integracja gotowej biblioteki open-source (implementacja SM-2 lub FSRS).
*   **Interfejs nauki:**
    1.  Widok Przodu fiszki -> Kliknięcie "Pokaż odpowiedź".
    2.  Widok Tyłu fiszki + 4 przyciski oceny:
        *   Powtórz (Again/Fail)
        *   Trudne (Hard)
        *   Dobre (Good)
        *   Łatwe (Easy)
*   **Ekran Sukcesu:** Po przerobieniu kolejki na dany dzień wyświetla się ekran z gratulacjami (fanfary/ikona) i komunikatem "Na dziś to wszystko".

---

## 5. Wymagania Niefunkcjonalne (Techniczne i UX)
1.  **Responsywność (RWD):** Aplikacja musi działać płynnie na urządzeniach mobilnych (przeglądarka), mimo braku dedykowanej aplikacji natywnej. Priorytet: widok "Sesja Nauki".
2.  **Onboarding (Empty State):** Jeśli użytkownik nie ma fiszek, widok główny zawiera duży przycisk "Wygeneruj pierwszy zestaw z AI" oraz krótki przewodnik.
3.  **Wydajność:** Czas ładowania interfejsu < 2s.
4.  **Bezpieczeństwo:** Hasła haszowane (np. bcrypt). Komunikacja tylko po HTTPS.
5.  **Analityka (Backend):** Logowanie zdarzeń generacji (input length, output count, accepted count, edited count) w celu optymalizacji promptów i modelu AI. Liczymy każdą próbę generacji.

---

## 6. Ograniczenia i Wykluczenia (Out of Scope MVP)
Poniższe funkcjonalności są świadomie przesunięte do kolejnych faz rozwoju:
1.  **Aplikacja mobilna:** W MVP tylko RWD web.
2.  **Przenoszenie fiszek:** Brak funkcji "Move" między taliami (wymagane usunięcie i dodanie w nowym miejscu).
3.  **Import plików:** Brak obsługi PDF/DOCX (tylko copy-paste tekstu).
4.  **Udostępnianie:** Brak funkcji społecznościowych i dzielenia się taliami.
5.  **Zaawansowany edytor:** Brak obsługi obrazków i audio na fiszkach.
6.  **Gamifikacja:** Brak rankingów, odznak (poza ekranem sukcesu sesji).

---

## 7. Harmonogram i Kamienie Milowe (Sugerowane)
1.  **Tydzień 1-2:** Setup projektu, Baza Danych, Auth, CRUD manualny fiszek/talii.
2.  **Tydzień 3:** Integracja API AI (Prompt engineering, obsługa błędów, limity).
3.  **Tydzień 4:** Frontend "Trybu Recenzji" i zapisywania kandydatów.
4.  **Tydzień 5:** Implementacja algorytmu powtórek i widoku sesji nauki.
5.  **Tydzień 6:** UI/UX (RWD, Empty states, Loadery), Testy, Deploy.