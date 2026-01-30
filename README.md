# CertPrep Mobile

An offline-first, mobile-optimized web application for practicing certification exams using JSON dumps.

## 1. Architecture Overview (Mobile-First)

The application is designed as a **Single Page Application (SPA)** using **React** and **TypeScript**. It follows a strictly **client-side architecture** with no backend dependencies.

*   **View Management**: A simple state-machine in `App.tsx` manages the core views (`HOME`, `QUIZ`, `SUMMARY`, `LEADERBOARD`). This avoids complex router setups and ensures seamless transitions within a "app-like" container.
*   **Data Flow**:
    *   **Input**: JSON files are parsed and normalized in `utils.ts` using the browser's `DOMParser` to strip HTML safely.
    *   **State**: React's `useState` manages the active quiz session.
    *   **Persistence**: `localStorage` is used via `services/storage.ts` to persist leaderboard data indefinitely on the device.
*   **Styling**: **Tailwind CSS** is used for utility-first styling. The layout is constrained to a mobile viewport max-width on desktop to simulate a native app experience.
*   **Performance**: The app loads everything into memory (feasible for text-based JSON dumps up to several MBs) for instant navigation and offline capability.

## 2. Parsing & Logic Details

The core logic resides in `utils.ts` and `types.ts`.

### Normalization Pipeline
1.  **HTML Cleanup**: The `stripHtml` function uses the DOM API to decode entities and remove tags, ensuring clean text rendering while preserving line breaks.
2.  **Option Parsing**: Options are normalized into `{ key, text }` objects. The parser looks for patterns like "A. Text" but includes fallbacks for malformed inputs.
3.  **Type Detection**: The question type (`SINGLE` vs `MULTI`) is derived automatically from the length of the correct answer string (e.g., "A" vs "AB").

### Quiz Logic
*   **Strict Matching**: `isAnswerCorrect` enforces that the user must select *exactly* the correct set of options. No partial credit is given.
*   **Explanation Priority**: The explanation text is dynamically built based on the hierarchy:
    1.  Official Description
    2.  Top 3 Community Comments (by vote count)
    3.  Most Voted Answer Stats

## 3. Edge Cases Handling

*   **Invalid JSON**: The file uploader validates structure (`Array.isArray`, missing fields) and provides user-friendly error messages.
*   **HTML Entities**: Handled natively by `DOMParser`.
*   **Reloads**: Because state is in memory, a page reload returns the user to the Home screen (safe default).
*   **Empty History**: Leaderboard handles empty states gracefully.
*   **Mobile Notches**: Sticky headers/footers account for safe-areas via CSS padding.

## 4. Run Instructions

1.  Ensure you have a Node.js environment.
2.  Place the provided files in a project folder.
3.  Run `npm install react react-dom lucide-react recharts clsx tailwind-merge` (and dev deps: `typescript`, `vite` or `react-scripts`).
4.  Start the dev server (e.g., `npm run dev`).
5.  Upload a valid JSON file matching the specified schema.
