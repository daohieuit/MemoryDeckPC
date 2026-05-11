# Implementation Plan: FSRS Study Session Mode

## 1. Overview and Architecture
The new `Study Session` mode will serve as the primary, intelligent learning path, orchestrated by the Free Spaced Repetition Scheduler (`ts-fsrs`). The existing individual modes (Flashcard, Matching, Quiz, Spelling) will be refactored to act as standalone practice modes. They will **not** mutate FSRS state. FSRS state updates will be strictly managed by the `Study Session` controller.

## 2. Decoupling Independent Modes
- **Current State:** Individual modes currently manage their own logic and directly trigger progress updates.
- **Action:** Remove database persistence (`updateProgress`) from independent modes. They will only calculate local session scores (for gamification/stats) but will not affect the `progress` table in the SQLite database.
- **Goal:** Allow users to freely practice specific modes without artificially inflating or destroying their spaced repetition intervals.

## 3. Study Session State Machine Design
The `Study Session` will act as a central state machine (controller) that queues words and dictates which UI mode is presented.

### 3.1. Phase Pipelines based on FSRS State
When a Study Session begins, the engine fetches due cards and assigns each a "Learning Pipeline" (a sequence of modes to pass) based on its current `ts-fsrs` State and Interval. The database uses the `progress` table to store these FSRS parameters.

| FSRS State | Condition | Assigned Pipeline (Sequence of Modes) | Rationale |
| :--- | :--- | :--- | :--- |
| `New` (0) | N/A | `[Flashcard -> Matching -> Quiz -> Spelling]` | Max exposure for unlearned words. |
| `Learning` (1) / `Relearning` (3) | N/A | `[Matching -> Quiz]` | Skip initial intro; focus on recognition & recall. |
| `Review` (2) | `scheduled_days < 21` (Young) | `[Quiz -> Spelling]` | Moderate familiarity requires active recall. |
| `Review` (2) | `scheduled_days >= 21` (Mature) | `[Spelling]` | High familiarity requires only strict validation. |

### 3.2. Intra-Session Progression Logic
- **Queueing:** The session groups all due cards by their *current active pipeline phase*. For example, all cards currently in the `Flashcard` phase will be shown first. Once the `Flashcard` queue is empty, the session moves to the `Matching` queue, and so on.
- **Advancement:** 
  - **Success:** If a user passes a mode (e.g., gets a Quiz question right, or matches correctly), the card advances to its *next* pipeline phase. 
  - **Failure:** If a user fails (e.g., rates Flashcard as Again, or misspells a word), the card's pipeline is **reset** to include `Flashcard`, forcing them to re-encode the word from scratch.
- **FSRS Rating Mapping (End of Pipeline):**
  - FSRS `scheduler.next()` (and subsequent `updateProgress`) is **only called when a card successfully completes its entire assigned pipeline**.
  - The final FSRS rating (`Again`, `Hard`, `Good`, `Easy`) applied to the database is calculated based on how many mistakes were made *during* the pipeline progression:
    - 0 mistakes across pipeline: `Easy` (4) or `Good` (3) depending on user speed/confidence.
    - 1 mistake: `Hard` (2)
    - 2+ mistakes / Pipeline Reset: `Again` (1)

## 4. UI/UX Flow for Study Session
1. **Dashboard:** A new prominent "Study Session" button is added to the deck view.
2. **Session Engine Component (`StudySession.tsx`):**
   - Fetches due words from SQLite via `electronAPI`.
   - Computes pipelines based on FSRS state.
   - Renders the appropriate sub-component (e.g., `<FlashcardUI />`, `<QuizUI />`) passing the current queued card as a prop.
   - Captures the `onResult(success: boolean)` callback from the UI components.
3. **Sub-components:**
   - Refactor existing modes to extract reusable, stateless components (`FlashcardUI`, `MatchingUI`, etc.) that accept a `term` prop and an `onComplete` callback, decoupling them from internal array states and hooks.
4. **Completion:** When all pipelines are empty, the final FSRS intervals are calculated using `ts-fsrs` and bulk-saved to the `progress` table via `updateProgress`. A comprehensive summary screen is shown.

## 5. Step-by-Step Implementation Tasks
1. **Extract UI Components:** Refactor `FlashcardMode`, `QuizMode`, `MatchingMode`, and `SpellingMode` into pure presentational components.
2. **Remove FSRS Side-Effects:** Strip `updateProgress` calls from the individual learning routes.
3. **Build the Session Controller (`hooks/useStudySession.ts`):** 
   - State to track pipelines for each due word.
   - Logic to pop the next card and its required mode.
   - Handlers for success/failure to advance or reset the pipeline.
   - Logic to compute the final FSRS `Rating` based on error count.
4. **Create `StudySession.tsx`:** Build the master view that mounts the correct UI component based on the controller's current phase.
5. **Database Sync:** Ensure the computed FSRS properties are saved via `updateProgress` at the very end of the session.

## 6. FSRS Specifics & Database Mapping

### Database Schema Context
The `progress` table in SQLite stores the exact properties of the `Card` interface from `ts-fsrs`:
- `due`: ISO 8601 string representing next review date.
- `stability`: Memory stability (interval scaling).
- `difficulty`: Card difficulty (1-10).
- `reps`, `lapses`: Usage statistics.
- `state`: Integer mapping to FSRS `State` enum (0=New, 1=Learning, 2=Review, 3=Relearning).

### Scheduling Logic
- **New Cards (`state === 0`)**: Assigned the full 4-phase pipeline. Upon completion, they receive their initial stability and graduate to `Learning` (or `Review` if `Easy`).
- **Learning Cards (`state === 1`)**: Assigned a 2-phase recognition/recall pipeline. They are repeated at short intervals until stability grows.
- **Review Cards (`state === 2`)**: Scheduled days/weeks/months into the future based on `stability`. Their pipeline depends on the scheduled interval (mature vs young).
- **Relearning Cards (`state === 3`)**: Cards that failed during Review (`Again` rating) are demoted and must complete the 2-phase pipeline to rebuild stability.

### Rating Impact on Intervals
When a card finishes its pipeline, the aggregated mistakes determine the rating passed to `ts-fsrs`:
- **`Rating.Again` (Failure)**: Resets interval to near-zero, increases difficulty slightly, increments `lapses`, demotes state to `Relearning` if previously in `Review`.
- **`Rating.Hard`**: Short interval, moderate difficulty adjustment.
- **`Rating.Good`**: Standard interval progression based on stability.
- **`Rating.Easy`**: Longer interval, slight difficulty decrease, fast-tracks graduation from `Learning`.