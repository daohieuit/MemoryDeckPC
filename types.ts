export interface Deck {
    id: number;
    name: string;
}

export interface Term {
    id: number;
    deck_id: number;
    term: string;
    ipa: string;
    definition: string;
    function: string;
}

export interface Progress {
    term_id: number;
    status: ProgressStatus;
    last_reviewed: string; // ISO 8601 date string
}

export enum ProgressStatus {
    New = 0,
    Learning = 1,
    Mastered = 2,
}

export enum GameMode {
    Flashcard = 'flashcard',
    Quiz = 'quiz',
    Matching = 'matching',
    Spelling = 'spelling',
}