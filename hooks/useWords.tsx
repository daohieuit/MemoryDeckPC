
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from './useToast';
import { useModal } from './useModal';
import { useLanguage } from './useLanguage';
import { Deck, Term, Progress } from '../types';
import { createEmptyCard } from 'ts-fsrs';
import { FlashcardSettings } from '../components/FlashcardSettingsModal';

declare global {
    interface Window {
        electronAPI?: {
            getAppVersion: () => Promise<string>;
            db: {
                getDecks: () => Promise<Deck[]>;
                addDeck: (name: string) => Promise<number>;
                renameDeck: (id: number, name: string) => Promise<void>;
                updateDeckLastStudied: (id: number, lastStudied: string) => Promise<void>;
                deleteDeck: (id: number) => Promise<void>;
                getTerms: () => Promise<Term[]>;
                addTerm: (deckId: number, term: string, definition: string, ipa: string, functionValue: string) => Promise<number>;
                updateTerm: (termId: number, termData: Partial<Omit<Term, 'id' | 'deck_id'>>) => Promise<void>;
                deleteTerm: (termId: number) => Promise<void>;
                getAllProgress: () => Promise<Progress[]>;
                updateProgress: (termId: number, card: Progress) => Promise<void>;
                getFlashcardSettings: (deckId: number) => Promise<any>;
                saveFlashcardSettings: (deckId: number, settings: any) => Promise<void>;
                deleteFlashcardSettings: (deckId: number) => Promise<void>;
            };
        };
    }
}

interface NewTerm {
    term: string;
    definition: string;
    ipa: string;
    function: string;
}

interface WordsContextType {
    decks: Deck[];
    terms: Term[];
    progress: Progress[];
    addDeck: (name: string) => Promise<number> | number;
    renameDeck: (id: number, name: string) => Promise<void>;
    deleteDeck: (id: number) => void;
    addTermsToDeck: (deckId: number, newTerms: NewTerm[]) => void;
    updateTerm: (termId: number, termData: Partial<Omit<Term, 'id' | 'deck_id'>>) => void;
    deleteTerm: (termId: number) => void;
    getTermsForDeck: (deckId: number) => Term[];
    getProgressForTerm: (termId: number) => Progress;
    updateProgress: (termId: number, newProgress: Partial<Progress>) => void;
    updateDeckLastStudied: (deckId: number) => Promise<void>;
    getFlashcardSettings: (deckId: number) => Promise<FlashcardSettings>;
    saveFlashcardSettings: (deckId: number, settings: FlashcardSettings) => Promise<void>;
}

const WordsContext = createContext<WordsContextType | undefined>(undefined);

export const WordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const { showConfirm } = useModal();
    const { t } = useLanguage();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial load from SQLite
    useEffect(() => {
        const loadData = async () => {
            if (window.electronAPI) {
                try {
                    const [savedDecks, savedTerms, savedProgress] = await Promise.all([
                        window.electronAPI.db.getDecks(),
                        window.electronAPI.db.getTerms(),
                        window.electronAPI.db.getAllProgress(),
                    ]);
                    setDecks(savedDecks);
                    setTerms(savedTerms);
                    setProgress(savedProgress);
                } catch (err) {
                    console.error("Failed to load data from SQLite:", err);
                }
            } else {
                // Fallback to localStorage for browser testing
                const savedDecks = localStorage.getItem('decks');
                const savedTerms = localStorage.getItem('terms');
                const savedProgress = localStorage.getItem('progress');
                if (savedDecks) setDecks(JSON.parse(savedDecks));
                if (savedTerms) setTerms(JSON.parse(savedTerms));
                if (savedProgress) setProgress(JSON.parse(savedProgress));
            }
            setIsLoaded(true);
        };
        loadData();
    }, []);

    // Helper to persist data for web fallback
    const persistWeb = (key: string, data: any) => {
        if (!window.electronAPI) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    };

    const addDeck = useCallback(async (name: string) => {
        if (window.electronAPI) {
            const id = await window.electronAPI.db.addDeck(name);
            setDecks(prev => [...prev, { id, name }]);
            return id;
        } else {
            const newDeckId = decks.length > 0 ? Math.max(...decks.map(c => c.id)) + 1 : 1;
            const newDeck: Deck = { id: newDeckId, name };
            setDecks(prev => {
                const updated = [...prev, newDeck];
                persistWeb('decks', updated);
                return updated;
            });
            return newDeckId;
        }
    }, [decks]);

    const renameDeck = useCallback(async (id: number, name: string) => {
        if (window.electronAPI) {
            await window.electronAPI.db.renameDeck(id, name);
        }
        setDecks(prev => {
            const updated = prev.map(d => d.id === id ? { ...d, name } : d);
            persistWeb('decks', updated);
            return updated;
        });
    }, []);

    const updateDeckLastStudied = useCallback(async (deckId: number) => {
        const lastStudied = new Date().toISOString();
        if (window.electronAPI) {
            await window.electronAPI.db.updateDeckLastStudied(deckId, lastStudied);
        }
        setDecks(prev => {
            const updated = prev.map(d => d.id === deckId ? { ...d, last_studied: lastStudied } : d);
            persistWeb('decks', updated);
            return updated;
        });
    }, []);

    const deleteDeck = useCallback((id: number) => {
        showConfirm({
            title: t('Delete Deck'),
            message: t('Are you sure you want to delete this entire deck and all its cards? This action cannot be undone.'),
            confirmText: t('Delete'),
            confirmVariant: 'danger',
            onConfirm: async () => {
                if (window.electronAPI) {
                    await window.electronAPI.db.deleteDeck(id);
                    setTerms(prev => prev.filter(t => t.deck_id !== id));
                    setDecks(prev => prev.filter(d => d.id !== id));
                } else {
                    const termsToDelete = terms.filter(t => t.deck_id === id).map(t => t.id);
                    setTerms(prev => {
                        const updated = prev.filter(t => t.deck_id !== id);
                        persistWeb('terms', updated);
                        return updated;
                    });
                    setProgress(prev => {
                        const updated = prev.filter(p => !termsToDelete.includes(p.term_id));
                        persistWeb('progress', updated);
                        return updated;
                    });
                    setDecks(prev => {
                        const updated = prev.filter(d => d.id !== id);
                        persistWeb('decks', updated);
                        return updated;
                    });
                }
            }
        });
    }, [terms, showConfirm]);

    const addTermsToDeck = useCallback(async (deckId: number, newTerms: NewTerm[]) => {
        if (window.electronAPI) {
            const addedTerms: Term[] = [];
            for (const nt of newTerms) {
                if (nt.term.trim() && nt.definition.trim()) {
                    const id = await window.electronAPI.db.addTerm(deckId, nt.term.trim(), nt.definition.trim(), nt.ipa.trim(), nt.function.trim());
                    addedTerms.push({
                        id,
                        deck_id: deckId,
                        term: nt.term.trim(),
                        definition: nt.definition.trim(),
                        ipa: nt.ipa.trim(),
                        function: nt.function.trim()
                    });
                }
            }
            setTerms(prev => [...prev, ...addedTerms]);
        } else {
            setTerms(prevTerms => {
                let lastId = prevTerms.length > 0 ? Math.max(...prevTerms.map(t => t.id)) : 0;
                const termsToAdd: Term[] = newTerms
                    .filter(nt => nt.term.trim() && nt.definition.trim())
                    .map(nt => {
                        lastId++;
                        return {
                            id: lastId,
                            deck_id: deckId,
                            term: nt.term.trim(),
                            definition: nt.definition.trim(),
                            ipa: nt.ipa.trim(),
                            function: nt.function.trim()
                        };
                    });
                const updated = [...prevTerms, ...termsToAdd];
                persistWeb('terms', updated);
                return updated;
            });
        }
    }, []);

    const updateTerm = useCallback(async (termId: number, termData: Partial<Omit<Term, 'id' | 'deck_id'>>) => {
        if (window.electronAPI) {
            await window.electronAPI.db.updateTerm(termId, termData);
        }

        setTerms(prev => {
            const updated = prev.map(t =>
                t.id === termId ? { ...t, ...termData } : t
            );
            persistWeb('terms', updated);
            return updated;
        });
    }, []);

    const deleteTerm = useCallback(async (termId: number) => {
        try {
            const termToDelete = terms.find(t => t.id === termId);
            if (!termToDelete) {
                console.error('deleteTerm: Term not found with id:', termId);
                return;
            }

            const progressToDelete = progress.find(p => p.term_id === termId);

            // Delete from database IMMEDIATELY to handle app-close scenario
            if (window.electronAPI) {
                console.log('deleteTerm: Deleting from SQLite, termId:', termId);
                await window.electronAPI.db.deleteTerm(termId);
                console.log('deleteTerm: SQLite delete successful');
            } else {
                // For web fallback, persist the filtered state immediately
                const newTerms = terms.filter(t => t.id !== termId);
                const newProgress = progress.filter(p => p.term_id !== termId);
                persistWeb('terms', newTerms);
                persistWeb('progress', newProgress);
            }

            // Update React state (UI updates instantly)
            setTerms(prev => prev.filter(t => t.id !== termId));
            setProgress(prev => prev.filter(p => p.term_id !== termId));

            const handleUndo = async () => {
                try {
                    // Restore to database
                    if (window.electronAPI) {
                        // Re-add the term to the database (will get the same ID due to SQLite re-insertion)
                        const newId = await window.electronAPI.db.addTerm(
                            termToDelete.deck_id,
                            termToDelete.term,
                            termToDelete.definition,
                            termToDelete.ipa,
                            termToDelete.function
                        );

                        // Restore term with the new database ID
                        const restoredTerm: Term = { ...termToDelete, id: newId };
                        setTerms(prev => [...prev, restoredTerm].sort((a, b) => a.id - b.id));

                        // Restore progress if it existed, linking to the new term ID
                        if (progressToDelete) {
                            await window.electronAPI.db.updateProgress(
                                newId,
                                progressToDelete
                            );
                            const restoredProgress: Progress = { ...progressToDelete, term_id: newId };
                            setProgress(prev => [...prev, restoredProgress].sort((a, b) => a.term_id - b.term_id));
                        }
                    } else {
                        // For web fallback, restore using current state to avoid stale closures
                        setTerms(prev => {
                            const updated = [...prev, termToDelete].sort((a, b) => a.id - b.id);
                            persistWeb('terms', updated);
                            return updated;
                        });
                        if (progressToDelete) {
                            setProgress(prev => {
                                const updated = [...prev, progressToDelete].sort((a, b) => a.term_id - b.term_id);
                                persistWeb('progress', updated);
                                return updated;
                            });
                        }
                    }
                } catch (undoError) {
                    console.error('deleteTerm: Undo failed:', undoError);
                }
            };

            showToast({
                message: t('Deleted "..."').replace('...', termToDelete.term),
                duration: 5000,
                onUndo: handleUndo,
                // No onTimeout needed - deletion is already persisted
            });
        } catch (error) {
            console.error('deleteTerm: Error occurred:', error);
        }
    }, [terms, progress, showToast]);

    const getTermsForDeck = useCallback((deckId: number) => {
        return terms.filter(term => term.deck_id === deckId);
    }, [terms]);

    const getProgressForTerm = useCallback((termId: number): Progress => {
        const p = progress.find(p => p.term_id === termId);
        if (p) return p;

        const emptyCard = createEmptyCard();
        return {
            ...emptyCard,
            term_id: termId,
            due: emptyCard.due.toISOString(),
            last_review: emptyCard.last_review?.toISOString()
        } as Progress;
    }, [progress]);

    const updateProgress = useCallback(async (termId: number, newProgress: Partial<Progress>) => {
        const current = getProgressForTerm(termId);
        const updatedProgress = { ...current, ...newProgress };

        if (window.electronAPI) {
            await window.electronAPI.db.updateProgress(
                termId,
                updatedProgress
            );
        }

        setProgress(prev => {
            const existingIndex = prev.findIndex(p => p.term_id === termId);
            let updated;
            if (existingIndex !== -1) {
                updated = [...prev];
                updated[existingIndex] = updatedProgress;
            } else {
                updated = [...prev, updatedProgress];
            }
            persistWeb('progress', updated);
            return updated;
        });
    }, [getProgressForTerm]);

    const GLOBAL_DEFAULTS: FlashcardSettings = {
        sequence: 'default',
        autoPlayAudio: true,
        showReviewPrompt: true
    };

    const getFlashcardSettings = useCallback(async (deckId: number): Promise<FlashcardSettings> => {
        if (window.electronAPI?.db?.getFlashcardSettings) {
            try {
                const saved = await window.electronAPI.db.getFlashcardSettings(deckId);
                if (saved) {
                    return {
                        sequence: saved.sequence,
                        autoPlayAudio: saved.auto_play_audio === 1,
                        showReviewPrompt: saved.show_review_prompt === 1
                    };
                }
            } catch (err) {
                console.error("Failed to load flashcard settings from SQLite:", err);
                // If the handler is not registered or call fails, fallback to localStorage
                if (err.message && err.message.includes('No handler registered')) {
                    const key = `flashcard_settings_${deckId}`;
                    const saved = localStorage.getItem(key);
                    if (saved) {
                        return JSON.parse(saved);
                    }
                }
            }
        } else {
            // localStorage fallback when electronAPI not available
            const key = `flashcard_settings_${deckId}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved);
            }
        }
        return GLOBAL_DEFAULTS;
    }, []);

    const saveFlashcardSettings = useCallback(async (deckId: number, settings: FlashcardSettings) => {
        if (window.electronAPI?.db?.saveFlashcardSettings) {
            try {
                await window.electronAPI.db.saveFlashcardSettings(deckId, settings);
            } catch (err) {
                console.error("Failed to save flashcard settings to SQLite:", err);
                if (err.message && err.message.includes('No handler registered')) {
                    localStorage.setItem(`flashcard_settings_${deckId}`, JSON.stringify(settings));
                }
            }
        } else {
            // localStorage fallback when electronAPI not available
            localStorage.setItem(`flashcard_settings_${deckId}`, JSON.stringify(settings));
        }
    }, []);

    if (!isLoaded) return null; // Or a loading spinner

    const value = {
        decks,
        terms,
        progress,
        addDeck,
        renameDeck,
        deleteDeck,
        addTermsToDeck,
        updateTerm,
        deleteTerm,
        getTermsForDeck,
        getProgressForTerm,
        updateProgress,
        updateDeckLastStudied,
        getFlashcardSettings,
        saveFlashcardSettings,
    };

    return (
        <WordsContext.Provider value={value}>
            {children}
        </WordsContext.Provider>
    );
};

export const useWords = (): WordsContextType => {
    const context = useContext(WordsContext);
    if (context === undefined) {
        throw new Error('useWords must be used within a WordProvider');
    }
    return context;
};