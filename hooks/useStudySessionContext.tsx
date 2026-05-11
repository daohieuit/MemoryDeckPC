import React, { createContext, useContext, useState, useCallback } from 'react';

interface StudySessionContextType {
    isSessionActive: boolean;
    startSession: (deckId: number, mode: string) => void;
    endSession: () => void;
    deckId: number | null;
    mode: string | null;
}

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined);

export const StudySessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [deckId, setDeckId] = useState<number | null>(null);
    const [mode, setMode] = useState<string | null>(null);

    const startSession = useCallback((newDeckId: number, newMode: string) => {
        setDeckId(newDeckId);
        setMode(newMode);
        setIsSessionActive(true);
    }, []);

    const endSession = useCallback(() => {
        setIsSessionActive(false);
        setDeckId(null);
        setMode(null);
    }, []);

    return (
        <StudySessionContext.Provider value={{ isSessionActive, startSession, endSession, deckId, mode }}>
            {children}
        </StudySessionContext.Provider>
    );
};

export const useStudySession = (): StudySessionContextType => {
    const context = useContext(StudySessionContext);
    if (!context) {
        throw new Error('useStudySession must be used within a StudySessionProvider');
    }
    return context;
};
