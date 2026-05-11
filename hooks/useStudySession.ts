import { useState, useMemo, useCallback, useEffect } from 'react';
import { Term, Progress } from '../types';
import { useWords } from './useWords';
import { useLanguage } from './useLanguage';
import { State, Rating, fsrs, Card } from 'ts-fsrs';

export type StudyPhase = 'flashcard' | 'matching' | 'quiz' | 'spelling';

interface CardSessionState {
    term: Term;
    pipeline: StudyPhase[];
    currentPhaseIndex: number;
    mistakes: number;
    isCompleted: boolean;
}

export const useStudySession = (deckId: number, limit: number = 20) => {
    const { getTermsForDeck, getProgressForTerm, updateProgress } = useWords();
    const { t } = useLanguage();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);
    const scheduler = useMemo(() => fsrs(), []);

    const [sessionCards, setSessionCards] = useState<CardSessionState[]>([]);
    const [currentGlobalPhase, setCurrentGlobalPhase] = useState<StudyPhase | 'completed'>('flashcard');
    const [isInitialized, setIsInitialized] = useState(false);

    // 1. Initialize pipelines for due words
    useEffect(() => {
        if (terms.length > 0 && !isInitialized) {
            const now = new Date();

            const allPotentialCards = terms.map(term => {
                const progress = getProgressForTerm(term.id);
                const isDue = new Date(progress.due) <= now;
                const isNew = progress.state === State.New;
                const isMastered = progress.state === State.Review && progress.scheduled_days >= 21;

                return { term, progress, isDue, isNew, isMastered };
            });

            const dueCardsCount = allPotentialCards.filter(c => c.isDue).length;
            const availableForNew = Math.max(0, limit - dueCardsCount);
            let newCardsCount = 0;

            const dueAndNewCards = allPotentialCards.filter(c => {
                if (c.isDue) return true;
                if (c.isNew && newCardsCount < availableForNew) {
                    newCardsCount++;
                    return true;
                }
                return false;
            });

            // Retention Mix-in: ~10% of mastered cards (not due)
            const masteredNotDue = allPotentialCards.filter(c => c.isMastered && !c.isDue);
            const mixInCount = Math.max(1, Math.floor(dueAndNewCards.length * 0.1));
            const mixInCards = masteredNotDue
                .sort(() => 0.5 - Math.random())
                .slice(0, mixInCount);

            const selectedCards = [...dueAndNewCards, ...mixInCards];

            const sessionCards: CardSessionState[] = selectedCards.map(({ term, progress }) => {
                let pipeline: StudyPhase[] = [];
                if (progress.state === State.New) {
                    pipeline = ['flashcard', 'matching', 'quiz', 'spelling'];
                } else if (progress.state === State.Learning || progress.state === State.Relearning) {
                    pipeline = ['matching', 'quiz'];
                } else if (progress.state === State.Review) {
                    if (progress.scheduled_days < 21) {
                        pipeline = ['quiz', 'spelling'];
                    } else {
                        pipeline = ['spelling'];
                    }
                }

                return {
                    term,
                    pipeline,
                    currentPhaseIndex: 0,
                    mistakes: 0,
                    isCompleted: false
                };
            }).sort(() => 0.5 - Math.random()); // Shuffle the session

            setSessionCards(sessionCards);
            setIsInitialized(true);
            
            // Set initial phase based on what's available
            if (sessionCards.length === 0) {
                setCurrentGlobalPhase('completed');
            } else {
                // Find first phase that has cards in the shuffled session
                const phases: StudyPhase[] = ['flashcard', 'matching', 'quiz', 'spelling'];
                for (const p of phases) {
                    if (sessionCards.some(c => c.pipeline[0] === p)) {
                        setCurrentGlobalPhase(p);
                        break;
                    }
                }
            }
        }
    }, [terms, getProgressForTerm, isInitialized]);

    // Get cards for the current phase
    const currentPhaseCards = useMemo(() => {
        return sessionCards.filter(c => !c.isCompleted && c.pipeline[c.currentPhaseIndex] === currentGlobalPhase);
    }, [sessionCards, currentGlobalPhase]);

    // Handle progress for a single card
    const handleCardResult = useCallback((termId: number, success: boolean) => {
        setSessionCards(prev => {
            const newCards = prev.map(c => {
                if (c.term.id !== termId) return c;

                if (success) {
                    const nextIndex = c.currentPhaseIndex + 1;
                    if (nextIndex >= c.pipeline.length) {
                        return { ...c, isCompleted: true };
                    }
                    return { ...c, currentPhaseIndex: nextIndex };
                } else {
                    // Failure: reset pipeline to include flashcard (re-encode)
                    // FSRS.md: "the card's pipeline is reset to include Flashcard"
                    return {
                        ...c,
                        pipeline: ['flashcard', ...c.pipeline.slice(c.currentPhaseIndex)],
                        currentPhaseIndex: 0,
                        mistakes: c.mistakes + 1
                    };
                }
            });

            // If current phase is empty, move to next phase
            const currentPhaseStillHasCards = newCards.some(c => !c.isCompleted && c.pipeline[c.currentPhaseIndex] === currentGlobalPhase);
            if (!currentPhaseStillHasCards) {
                const phases: StudyPhase[] = ['flashcard', 'matching', 'quiz', 'spelling'];
                const currentIndex = phases.indexOf(currentGlobalPhase as StudyPhase);
                
                let nextPhase: StudyPhase | 'completed' = 'completed';
                
                // Try to find the next available phase in order
                for (let i = currentIndex + 1; i < phases.length; i++) {
                    if (newCards.some(c => !c.isCompleted && c.pipeline[c.currentPhaseIndex] === phases[i])) {
                        nextPhase = phases[i];
                        break;
                    }
                }
                
                // If no later phases, check if any cards were reset to an earlier phase
                if (nextPhase === 'completed') {
                    for (let i = 0; i <= currentIndex; i++) {
                        if (newCards.some(c => !c.isCompleted && c.pipeline[c.currentPhaseIndex] === phases[i])) {
                            nextPhase = phases[i];
                            break;
                        }
                    }
                }

                setCurrentGlobalPhase(nextPhase);
            }

            return newCards;
        });
    }, [currentGlobalPhase]);

    // Finalize session and save FSRS states
    const finalizeSession = useCallback(async () => {
        const now = new Date();
        for (const cardState of sessionCards) {
            const currentProgress = getProgressForTerm(cardState.term.id);
            
            // Map mistakes to FSRS rating as defined in FSRS.md
            let rating = Rating.Good;
            if (cardState.mistakes === 0) {
                rating = Rating.Easy;
            } else if (cardState.mistakes === 1) {
                rating = Rating.Hard;
            } else {
                rating = Rating.Again;
            }

            const result = scheduler.next(currentProgress as unknown as Card, now, rating);
            const nextCard = result.card;

            await updateProgress(cardState.term.id, {
                ...nextCard,
                due: nextCard.due.toISOString(),
                last_review: nextCard.last_review?.toISOString()
            } as any);
        }
    }, [sessionCards, getProgressForTerm, scheduler, updateProgress]);

    // Get predicted intervals for a card
    const getPredictedIntervals = useCallback((termId: number): Record<Rating, string> => {
        const progress = getProgressForTerm(termId);
        const card = progress as unknown as Card;
        const repeat = scheduler.repeat(card, new Date());
        
        const formatInterval = (days: number) => {
            if (days < 1) return t("Today");
            if (days === 1) return t("1 day");
            return `${days} ${t("days")}`;
        };

        return {
            [Rating.Again]: formatInterval(repeat[Rating.Again].card.scheduled_days),
            [Rating.Hard]: formatInterval(repeat[Rating.Hard].card.scheduled_days),
            [Rating.Good]: formatInterval(repeat[Rating.Good].card.scheduled_days),
            [Rating.Easy]: formatInterval(repeat[Rating.Easy].card.scheduled_days),
        };
    }, [getProgressForTerm, scheduler]);

    return {
        sessionCards,
        currentGlobalPhase,
        currentPhaseCards,
        handleCardResult,
        finalizeSession,
        getPredictedIntervals,
        isInitialized,
        totalCards: sessionCards.length,
        completedCards: sessionCards.filter(c => c.isCompleted).length
    };
};
