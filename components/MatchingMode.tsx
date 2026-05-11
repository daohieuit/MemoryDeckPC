
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { Term } from '../types';
import { useModal } from '../hooks/useModal';
import { useSessionResults } from '../hooks/useSessionResults';
import { useStudySession } from '../hooks/useStudySessionContext';
import { MatchingUI } from './MatchingUI';
import { GetReadyView } from './GetReadyView';
import { MatchingSettingsModal, MatchingSettings, DifficultyType } from './MatchingSettingsModal';
import { GearIcon } from './icons/Icons';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

export const MatchingMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, decks } = useWords();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { showConfirm } = useModal();
    const { startSession, endSession } = useStudySession();
    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);
    const [isStarted, setIsStarted] = useState(false);
    const [settings, setSettings] = useState<MatchingSettings>({
        difficulty: 5,
        showTimer: true
    });
    const { addResult } = useSessionResults();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [gameTerms, setGameTerms] = useState<Term[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

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
            startSession(deckId, 'matching');
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

    useEffect(() => {
        if (terms.length >= 2) {
            setGameTerms(shuffleArray(terms).slice(0, settings.difficulty));
        }
    }, [terms, settings.difficulty]);

    const openSettings = () => {
        setIsPaused(true);
    };

    const handleComplete = useCallback((mistakes: Record<number, number>, timeTakenMs: number) => {
        setIsComplete(true);
        
        const totalSeconds = Math.floor(timeTakenMs / 1000);
        const milliseconds = Math.floor((timeTakenMs % 1000) / 10);
        const timeTaken = `${totalSeconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;

        addResult('matching', {
            timeTakenMs,
            matchedPairs: gameTerms.length,
            totalPairs: gameTerms.length
        });

        showConfirm({
            title: t('Congratulations! 🎉'),
            message: (
                <>
                    <p>{t("You've matched all the terms in")} {timeTaken}.</p>
                    <p className="mt-2">{t('Proceed to next learning mode?')}</p>
                </>
            ),
            confirmText: t('Yes'),
            onConfirm: () => {
                endSession();
                navigate(`/learn/${deckId}/spelling`);
            },
            cancelText: t('No'),
            onCancel: () => {
                endSession();
                navigate('/');
            }
        });
    }, [addResult, gameTerms.length, showConfirm, t, navigate, deckId]);

    if (terms.length < 2) {
        return <p className="text-center text-[#AFBD96]">{t("You need at least 2 terms in this deck to play the matching game.")}</p>;
    }

    if (!isStarted) {
        return (
            <GetReadyView 
                deckName={deck?.name || ""}
                totalCards={gameTerms.length}
                modeName={t("Ghép từ")}
                onStart={() => setIsStarted(true)}
                onCancel={() => navigate('/')}
                onSettings={openSettings}
            />
        );
    }

    if (isComplete) {
        return null;
    }

    return (
        <div className="flex flex-col items-center w-full relative">
            {isStarted && (
                <button
                    onClick={openSettings}
                    className="absolute top-0 right-0 p-2 rounded-xl bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-all shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] z-10"
                    title={t("Settings")}
                >
                    <GearIcon className="w-6 h-6" />
                </button>
            )}

            <div className="w-full">
                <MatchingUI
                    terms={gameTerms}
                    onComplete={handleComplete}
                    showTimer={settings.showTimer}
                    paused={isPaused}
                />
            </div>

            {isPaused && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#344E41] rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-[#EDE9DE] dark:border-[#3A5A40] max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EDE9DE] dark:border-[#3A5A40] flex justify-between items-center bg-white dark:bg-[#344E41] shrink-0">
                            <h2 className="text-xl md:text-2xl font-bold text-[#121e18] dark:text-white">{t("Settings")}</h2>
                            <button
                                onClick={() => setIsPaused(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#446843] text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white transition-all active:scale-95"
                                aria-label="Close modal"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <MatchingSettingsModal
                                settings={settings}
                                onUpdate={(newSettings) => {
                                    setSettings(newSettings);
                                }}
                                onReset={() => {
                                    setSettings({
                                        difficulty: 5,
                                        showTimer: true
                                    });
                                }}
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
