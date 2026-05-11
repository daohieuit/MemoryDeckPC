import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { Term } from '../types';
import { useModal } from '../hooks/useModal';
import { useSessionResults } from '../hooks/useSessionResults';
import { useStudySession } from '../hooks/useStudySessionContext';
import { FlashcardUI } from './FlashcardUI';
import { GetReadyView } from './GetReadyView';
import { FlashcardSettingsModal, FlashcardSettings, SequenceType } from './FlashcardSettingsModal';
import { ReviewPromptModal } from './ReviewPromptModal';
import { Rating } from 'ts-fsrs';
import { GearIcon, ArrowPathIcon } from './icons/Icons';

export const FlashcardMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, getProgressForTerm, decks, getFlashcardSettings, saveFlashcardSettings } = useWords();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { showConfirm, showModal, hideModal } = useModal();
    const { startSession, endSession } = useStudySession();
    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);
    const [isStarted, setIsStarted] = useState(false);
    const [settings, setSettings] = useState<FlashcardSettings>({
        sequence: 'default',
        autoPlayAudio: true,
        showReviewPrompt: true
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const { addResult } = useSessionResults();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
    const [isSessionCompleted, setIsSessionCompleted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Track term ratings during session for review sub-session
    const termRatingsRef = useRef<Map<number, Rating>>(new Map());
    const [subSessionTerms, setSubSessionTerms] = useState<Term[]>([]);
    const [isSubSession, setIsSubSession] = useState(false);

    // FSRS rating counts (for local session stats only)
    const [againCount, setAgainCount] = useState(0);
    const [hardCount, setHardCount] = useState(0);
    const [goodCount, setGoodCount] = useState(0);
    const [easyCount, setEasyCount] = useState(0);

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const saved = await getFlashcardSettings(deckId);
                setSettings(saved);
            } catch (err) {
                console.error("Failed to load flashcard settings:", err);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        loadSettings();
    }, [deckId, getFlashcardSettings]);

    // Handle Escape key to close settings modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isPaused) {
                setIsPaused(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isPaused]);

    // Start study session when user clicks Start
    useEffect(() => {
        if (isStarted) {
            startSession(deckId, 'flashcard');
        }
    }, [isStarted, deckId, startSession]);

    // End session on unmount (cleanup)
    useEffect(() => {
        return () => {
            if (isStarted) {
                endSession();
            }
        };
    }, [isStarted, endSession]);

    const sortTerms = useCallback((currentTerms: Term[], sequence: SequenceType) => {
        const sorted = [...currentTerms];
        if (sequence === 'alpha') {
            return sorted.sort((a, b) => a.term.localeCompare(b.term));
        } else if (sequence === 'random') {
            return sorted.sort(() => Math.random() - 0.5);
        } else {
            // Default: by due date
            return sorted.sort((a, b) => {
                const progressA = getProgressForTerm(a.id);
                const progressB = getProgressForTerm(b.id);
                return new Date(progressA.due).getTime() - new Date(progressB.due).getTime();
            });
        }
    }, [getProgressForTerm]);

    useEffect(() => {
        if (terms.length > 0) {
            const sorted = sortTerms(terms, settings.sequence);
            setSessionTerms(sorted);
            setCurrentIndex(0);
            // Clear term ratings when sequence changes
            termRatingsRef.current.clear();
        }
    }, [terms, settings.sequence, sortTerms]);

    const handleUpdateSettings = useCallback((newSettings: FlashcardSettings) => {
        setSettings(newSettings);
        // Save to database in background without blocking UI
        saveFlashcardSettings(deckId, newSettings).catch(err => {
            console.error("Failed to save settings:", err);
        });
    }, [deckId, saveFlashcardSettings]);

    const handleResetSettings = useCallback(() => {
        const defaults: FlashcardSettings = {
            sequence: 'default',
            autoPlayAudio: true,
            showReviewPrompt: true
        };
        setSettings(defaults);
        // Save to database in background without blocking UI
        saveFlashcardSettings(deckId, defaults).catch(err => {
            console.error("Failed to save settings:", err);
        });
    }, [deckId, saveFlashcardSettings]);

    const openSettings = () => {
        setIsPaused(true);
    };

    const startReviewSubSession = useCallback(() => {
        // Filter session terms to only those rated Again or Hard
        const struggled = sessionTerms.filter(term => {
            const rating = termRatingsRef.current.get(term.id);
            return rating === Rating.Again || rating === Rating.Hard;
        });

        if (struggled.length === 0) {
            showModal({
                title: t("No Struggled Cards"),
                message: <p className="text-center text-[#AFBD96]">{t("All cards were mastered! No cards to review.")}</p>,
                hideFooter: true
            });
            return;
        }

        setSubSessionTerms(struggled);
        setIsSubSession(true);
        setCurrentIndex(0);
        // Reset rating counts for sub-session
        setAgainCount(0);
        setHardCount(0);
        setGoodCount(0);
        setEasyCount(0);
        // Clear previous sub-session ratings when starting new one
        termRatingsRef.current.clear();
        hideModal();
    }, [sessionTerms, showModal, t]);

    const handleNext = (rating: Rating) => {
        const currentTerm = isSubSession ? subSessionTerms[currentIndex] : sessionTerms[currentIndex];
        if (!currentTerm) return;

        // Record rating for this term
        termRatingsRef.current.set(currentTerm.id, rating);

        // Update counts
        switch (rating) {
            case Rating.Again: setAgainCount(prev => prev + 1); break;
            case Rating.Hard: setHardCount(prev => prev + 1); break;
            case Rating.Good: setGoodCount(prev => prev + 1); break;
            case Rating.Easy: setEasyCount(prev => prev + 1); break;
        }

        const termsList = isSubSession ? subSessionTerms : sessionTerms;
        if (currentIndex < termsList.length - 1) {
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
            }, 200);
        } else {
            // Session completed (either main or sub-session)
            if (isSubSession) {
                // Sub-session completed
                const subSessionAgain = againCount;
                const subSessionHard = hardCount;
                const subSessionGood = goodCount;
                const subSessionEasy = easyCount;

                // Reset state
                setIsSubSession(false);
                setSubSessionTerms([]);

                // Show sub-session completion modal
                setTimeout(() => {
                    showModal({
                        title: t("Review Complete!"),
                        message: (
                            <div className="text-center">
                                <p className="text-lg font-bold text-[#121e18] dark:text-white mb-4">
                                    {t("You reviewed")} {subSessionAgain + subSessionHard + subSessionGood + subSessionEasy} {t("cards")}
                                </p>
                                <div className="flex justify-center gap-4">
                                    <div className="text-red-600 dark:text-red-400">
                                        <p className="text-2xl font-bold">{subSessionAgain}</p>
                                        <p className="text-xs uppercase">{t("Again")}</p>
                                    </div>
                                    <div className="text-orange-600 dark:text-orange-400">
                                        <p className="text-2xl font-bold">{subSessionHard}</p>
                                        <p className="text-xs uppercase">{t("Hard")}</p>
                                    </div>
                                    <div className="text-green-600 dark:text-green-400">
                                        <p className="text-2xl font-bold">{subSessionGood}</p>
                                        <p className="text-xs uppercase">{t("Good")}</p>
                                    </div>
                                    <div className="text-blue-600 dark:text-blue-400">
                                        <p className="text-2xl font-bold">{subSessionEasy}</p>
                                        <p className="text-xs uppercase">{t("Easy")}</p>
                                    </div>
                                </div>
                            </div>
                        ),
                        confirmText: t("OK"),
                        onConfirm: () => {
                            hideModal();
                            endSession();
                            navigate('/');
                        },
                        hideCloseButton: true
                    });
                }, 200);
                return;
            } else {
                // Main session completed
                setIsSessionCompleted(true);

                // The counts already include the last rating
                const finalAgain = againCount;
                const finalHard = hardCount;
                const finalGood = goodCount;
                const finalEasy = easyCount;

                addResult('flashcard', {
                    totalCards: sessionTerms.length,
                    again: finalAgain,
                    hard: finalHard,
                    good: finalGood,
                    easy: finalEasy,
                });

                // Show review prompt if enabled, otherwise auto-finish
                if (settings.showReviewPrompt) {
                    setTimeout(() => {
                        showModal({
                            title: t("Round Complete!"),
                            message: (
                                <ReviewPromptModal
                                    againCount={finalAgain}
                                    hardCount={finalHard}
                                    goodCount={finalGood}
                                    easyCount={finalEasy}
                                    totalCards={sessionTerms.length}
                                    onReview={startReviewSubSession}
                                    onFinish={() => {
                                        hideModal();
                                        endSession();
                                        navigate('/');
                                    }}
                                />
                            ),
                            hideCloseButton: true,
                            hideFooter: true
                        });
                    }, 200);
                } else {
                    // Auto-finish to next mode or home
                    setTimeout(() => {
                        showConfirm({
                            title: t("Session Completed!"),
                            message: (<p>{t("Proceed to next learning mode?")}</p>),
                            confirmText: t("Yes"),
                            onConfirm: () => {
                                endSession();
                                setTimeout(() => navigate(`/learn/${deckId}/quiz`), 300);
                            },
                            cancelText: t("No"),
                            onCancel: () => {
                                endSession();
                                navigate('/');
                            }
                        });
                    }, 200);
                }
            }
        }
    };

    if (isLoadingSettings) {
        return <p className="text-center text-[#AFBD96]">{t("Loading settings...")}</p>;
    }

    if (terms.length === 0) {
        return <p className="text-center text-[#AFBD96]">{t("No terms available in this deck.")}</p>;
    }

    if (!isStarted) {
        return (
            <>
                <GetReadyView
                    deckName={deck?.name || ""}
                    totalCards={terms.length}
                    modeName={t("Flashcard")}
                    onStart={() => setIsStarted(true)}
                    onCancel={() => navigate('/')}
                    onSettings={openSettings}
                />
                
                {isPaused && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#344E41] rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-[#EDE9DE] dark:border-[#3A5A40] max-h-[90vh] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#EDE9DE] dark:border-[#3A5A40] flex justify-between items-center bg-white dark:bg-[#344E41] shrink-0">
                                <h2 className="text-xl md:text-2xl font-bold text-[#121e18] dark:text-white">{t("Settings")}</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleResetSettings}
                                        className="p-2 rounded-xl bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-all shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] active:scale-95 duration-150"
                                        title={t("Reset to Default")}
                                    >
                                        <ArrowPathIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsPaused(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#446843] text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white transition-all active:scale-95"
                                        aria-label="Close modal"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <FlashcardSettingsModal
                                    settings={settings}
                                    onUpdate={handleUpdateSettings}
                                    onReset={handleResetSettings}
                                    onClose={() => setIsPaused(false)}
                                    showHeader={false}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Determine which terms list to use (sub-session or main session)
    const displayTerms = isSubSession ? subSessionTerms : sessionTerms;
    const displayCurrentIndex = isSessionCompleted && !isSubSession ? displayTerms.length : currentIndex;
    const progressPerc = (displayCurrentIndex / displayTerms.length) * 100;

    const currentTerm = displayTerms[currentIndex];
    if (displayTerms.length === 0 || !currentTerm) {
        return <p className="text-center text-[#AFBD96]">{t("No cards to review!")}</p>;
    }

    return (
        <div className="flex flex-col items-center relative">
            {isStarted && (
                <button
                    onClick={openSettings}
                    className="absolute top-0 right-0 p-2 rounded-xl bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-all shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] z-10"
                    title={t("Settings")}
                >
                    <GearIcon className="w-6 h-6" />
                </button>
            )}

            <div className="w-full max-w-2xl mb-4">
                <div className="bg-[#e8e5da] dark:bg-[#446843] rounded-full h-2.5">
                    <div className="bg-[#56A652] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPerc}%` }}></div>
                </div>
                <p className="text-center mt-2 text-[#AFBD96]">
                    {isSubSession ? `${t("Review")}: ` : ''}
                    {displayCurrentIndex} / {displayTerms.length}
                </p>
            </div>

            <FlashcardUI
                term={currentTerm}
                onNext={handleNext}
                autoPlayAudio={settings.autoPlayAudio}
                paused={isPaused}
            />

            {isPaused && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#344E41] rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-[#EDE9DE] dark:border-[#3A5A40] max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EDE9DE] dark:border-[#3A5A40] flex justify-between items-center bg-white dark:bg-[#344E41] shrink-0">
                            <h2 className="text-xl md:text-2xl font-bold text-[#121e18] dark:text-white">{t("Settings")}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleResetSettings}
                                    className="p-2 rounded-xl bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-all shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] active:scale-95 duration-150"
                                    title={t("Reset to Default")}
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsPaused(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#446843] text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white transition-all active:scale-95"
                                    aria-label="Close modal"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <FlashcardSettingsModal
                                settings={settings}
                                onUpdate={handleUpdateSettings}
                                onReset={handleResetSettings}
                                onClose={() => setIsPaused(false)}
                                showHeader={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
