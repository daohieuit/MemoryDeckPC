
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ModeResults {
    // Flashcard Mode
    flashcard?: {
        totalCards: number;
        easy: number;
        good: number;
        hard: number;
    };
    // Quiz Mode
    quiz?: {
        score: number;
        totalQuestions: number;
    };
    // Matching Mode
    matching?: {
        timeTakenMs: number;
        matchedPairs: number;
        totalPairs: number;
    };
    // Spelling Mode
    spelling?: {
        correctAnswers: number;
        totalTerms: number;
    };
}

interface SessionResultsContextType {
    results: ModeResults;
    addResult: (mode: keyof ModeResults, result: any) => void;
    clearResults: () => void;
}

const SessionResultsContext = createContext<SessionResultsContextType | undefined>(undefined);

export const SessionResultsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [results, setResults] = useState<ModeResults>({});

    const addResult = useCallback((mode: keyof ModeResults, result: any) => {
        setResults(prev => ({
            ...prev,
            [mode]: result
        }));
    }, []);

    const clearResults = useCallback(() => {
        setResults({});
    }, []);

    const value = { results, addResult, clearResults };

    return (
        <SessionResultsContext.Provider value={value}>
            {children}
        </SessionResultsContext.Provider>
    );
};

export const useSessionResults = (): SessionResultsContextType => {
    const context = useContext(SessionResultsContext);
    if (!context) {
        throw new Error('useSessionResults must be used within a SessionResultsProvider');
    }
    return context;
};
