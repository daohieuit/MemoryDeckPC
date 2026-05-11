import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudySession } from '../hooks/useStudySession';
import { useLanguage } from '../hooks/useLanguage';
import { useWords } from '../hooks/useWords';
import { useModal } from '../hooks/useModal';
import { FlashcardUI } from './FlashcardUI';
import { QuizUI } from './QuizUI';
import { MatchingUI } from './MatchingUI';
import { SpellingUI } from './SpellingUI';
import { GetReadyView } from './GetReadyView';
import { StudySessionSettingsModal, StudySessionSettings } from './StudySessionSettingsModal';
import { GearIcon } from './icons/Icons';
import { Rating } from 'ts-fsrs';
import { Term } from '../types';
import { useStudySession as useActiveStudySession } from '../hooks/useStudySessionContext';

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const StudySession: React.FC<{ deckId: number }> = ({ deckId }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { getTermsForDeck, decks } = useWords();
    const { showConfirm, showModal, hideModal } = useModal();
    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);
    const [isStarted, setIsStarted] = useState(false);
    const [settings, setSettings] = useState<StudySessionSettings>({
        general: { sessionLimit: 20, dailyGoal: 50 },
        flashcard: { sequence: 'default', autoPlayAudio: true, showReviewPrompt: true },
        matching: { difficulty: 5, showTimer: true },
        quiz: { questionCount: 10, sequence: 'default', language: 'EN' },
        spelling: { questionCount: 10, sequence: 'default', language: 'VN', showOverrideButton: true, autoAdvance: true }
    });
    const allTerms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const {
        currentGlobalPhase,
        currentPhaseCards,
        handleCardResult,
        finalizeSession,
        getPredictedIntervals,
        isInitialized,
        totalCards,
        completedCards
    } = useStudySession(deckId, settings.general.sessionLimit);

    const { startSession: startActiveSession, endSession: endActiveSession } = useActiveStudySession();
    const [isSaving, setIsSaving] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Start study session when user clicks Start
    useEffect(() => {
        if (isStarted) {
            startActiveSession(deckId, 'study');
        }
    }, [isStarted, deckId, startActiveSession]);

    // End session on unmount (cleanup)
    useEffect(() => {
        return () => {
            if (isStarted) {
                endActiveSession();
            }
        };
    }, [isStarted, endActiveSession]);

    // Handle session completion
    useEffect(() => {
        if (isInitialized && currentGlobalPhase === 'completed' && !isSaving) {
            const saveAndExit = async () => {
                setIsSaving(true);
                await finalizeSession();
                showConfirm({
                    title: t("Session Completed!"),
                    message: t("All due cards have been reviewed and intervals updated."),
                    confirmText: t("Back to Dashboard"),
                    onConfirm: () => {
                        endActiveSession();
                        navigate('/');
                    },
                    cancelText: t("Review Again (Standalone)"),
                    onCancel: () => {
                        endActiveSession();
                        navigate(`/learn/${deckId}/flashcard`);
                    }
                });
            };
            saveAndExit();
        }
    }, [currentGlobalPhase, isInitialized, finalizeSession, navigate, t, deckId, isSaving, showConfirm, endActiveSession]);

    // Generate options for Quiz
    const getQuizOptions = useCallback((correctTerm: Term) => {
        if (allTerms.length < 4) return shuffleArray(allTerms);
        const distractors = allTerms
            .filter(t => t.id !== correctTerm.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
        return shuffleArray([correctTerm, ...distractors]);
    }, [allTerms]);

    if (!isInitialized) return <p className="text-center text-[#AFBD96]">{t("Initializing session...")}</p>;
    if (totalCards === 0) return <p className="text-center text-[#AFBD96]">{t("No cards due for study right now!")}</p>;

    const openSettings = () => {
        setIsPaused(true);
        showModal({
            title: t("Study Session Settings"),
            message: (
                <StudySessionSettingsModal 
                    settings={settings}
                    maxAvailableCards={allTerms.length}
                    onUpdate={(newSettings) => setSettings(newSettings)}
                    onReset={() => setSettings({
                        general: { sessionLimit: 20, dailyGoal: 50 },
                        flashcard: { sequence: 'default', autoPlayAudio: true, showReviewPrompt: true },
                        matching: { difficulty: 5, showTimer: true },
                        quiz: { questionCount: 10, sequence: 'default', language: 'EN' },
                        spelling: { questionCount: 10, sequence: 'default', language: 'VN', showOverrideButton: true, autoAdvance: true }
                    })}
                    onClose={() => {
                        setIsPaused(false);
                        hideModal();
                    }}
                />
            )
        });
    };

    if (!isStarted) {
        return (
            <GetReadyView 
                deckName={deck?.name || ""}
                totalCards={totalCards}
                modeName={t("Smart Study Session")}
                onStart={() => setIsStarted(true)}
                onCancel={() => navigate('/')}
                onSettings={openSettings}
            />
        );
    }

    if (currentGlobalPhase === 'completed') return <p className="text-center text-[#AFBD96]">{t("Session complete! Saving progress...")}</p>;

    const progressPerc = (completedCards / totalCards) * 100;

    // Render based on phase
    const renderPhaseUI = () => {
        if (currentPhaseCards.length === 0) return null;

        switch (currentGlobalPhase) {
        case 'flashcard': {
                const currentCard = currentPhaseCards[0];
                return (
                    <FlashcardUI
                        term={currentCard.term}
                        onNext={(rating) => handleCardResult(currentCard.term.id, rating !== Rating.Again)}
                        predictedIntervals={getPredictedIntervals(currentCard.term.id)}
                        autoPlayAudio={settings.flashcard.autoPlayAudio}
                        paused={isPaused}
                    />
                );
            }
            case 'matching': {
                // Matching takes up to 5 cards
                const batch = currentPhaseCards.slice(0, 5).map(c => c.term);
                return (
                    <MatchingUI
                        terms={batch}
                        onComplete={(mistakesByTermId) => {
                            batch.forEach(term => {
                                const mistakeCount = mistakesByTermId[term.id] || 0;
                                handleCardResult(term.id, mistakeCount === 0);
                            });
                        }}
                        showTimer={settings.matching.showTimer}
                        paused={isPaused}
                    />
                );
            }
            case 'quiz': {
                const currentCard = currentPhaseCards[0];
                return (
                    <QuizUI
                        term={currentCard.term}
                        options={getQuizOptions(currentCard.term)}
                        onComplete={(success) => handleCardResult(currentCard.term.id, success)}
                        questionField={settings.quiz.language === 'VN' ? 'definition' : 'term'}
                        optionField={settings.quiz.language === 'VN' ? 'term' : 'definition'}
                        paused={isPaused}
                    />
                );
            }
            case 'spelling': {
                const currentCard = currentPhaseCards[0];
                return (
                    <SpellingUI
                        term={currentCard.term}
                        onComplete={(success) => handleCardResult(currentCard.term.id, success)}
                        autoAdvance={settings.spelling.autoAdvance}
                        showOverrideButton={settings.spelling.showOverrideButton}
                        questionField={settings.spelling.language === 'EN' ? 'term' : 'definition'}
                        answerField={settings.spelling.language === 'EN' ? 'definition' : 'term'}
                        paused={isPaused}
                    />
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
            <div className="w-full flex justify-end mb-4">
                <button
                    onClick={openSettings}
                    className="group inline-flex items-center justify-center rounded-2xl border border-[#EDE9DE] dark:border-[#567457] bg-[#f6f2e8] dark:bg-[#446843] p-3 text-[#7C8F68] dark:text-[#DDE7D0] shadow-[0_6px_0_rgba(205,198,174,0.9)] dark:shadow-[0_6px_0_rgba(45,74,44,0.95)] transition-all duration-150 hover:-translate-y-0.5 hover:text-[#56A652] hover:shadow-[0_8px_0_rgba(205,198,174,0.85)] dark:hover:shadow-[0_8px_0_rgba(45,74,44,0.95)] active:translate-y-[4px] active:shadow-[0_2px_0_rgba(205,198,174,0.75)] dark:active:shadow-[0_2px_0_rgba(45,74,44,0.85)]"
                    aria-label={t("Study session settings")}
                    title={t("Settings")}
                >
                    <GearIcon className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
                </button>
            </div>

            <div className="w-full mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold text-[#121e18] dark:text-white capitalize">
                        {t(currentGlobalPhase)} {t("Phase")}
                    </h1>
                    <span className="text-[#AFBD96]">{completedCards} / {totalCards}</span>
                </div>
                <div className="bg-[#e8e5da] dark:bg-[#446843] rounded-full h-3">
                    <div 
                        className="bg-[#56A652] h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPerc}%` }}
                    ></div>
                </div>
            </div>

            <div className="w-full">
                {renderPhaseUI()}
            </div>
        </div>
    );
};
