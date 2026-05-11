export interface Deck {
    id: number;
    name: string;
    created_at?: string;
    last_studied?: string;
}

export interface Term {
    id: number;
    deck_id: number;
    term: string;
    ipa: string;
    definition: string;
    function: string;
}

import { State } from 'ts-fsrs';

export interface Progress {
    term_id: number;
    due: string;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: State;
    last_review?: string;
}

export enum GameMode {
    Flashcard = 'flashcard',
    Quiz = 'quiz',
    Matching = 'matching',
    Spelling = 'spelling',
    Study = 'study',
}