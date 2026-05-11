import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { Term } from '../types';
import { useModal } from '../hooks/useModal';
import { useSessionResults } from '../hooks/useSessionResults';
import { useStudySession } from '../hooks/useStudySessionContext';
import { SpellingUI } from './SpellingUI';
import { GetReadyView } from './GetReadyView';
import { SpellingSettingsModal, SpellingSettings } from './SpellingSettingsModal';
import { SequenceType } from './FlashcardSettingsModal';
import { GearIcon } from './icons/Icons';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

export const SpellingMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, decks } = useWords();
    const { t } = useLanguage();
    const { showConfirm } = useModal();
    const navigate = useNavigate();
    const { startSession, endSession } = useStudySession();
    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);
    const [isStarted, setIsStarted] = useState(false);
    const [settings, setSettings] = useState<SpellingSettings>({
        questionCount: 10,
        sequence: 'default',
        language: 'VN',
        showOverrideButton: true,
        autoAdvance: true
    });
    const { addResult } = useSessionResults();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
    const [questionFields, setQuestionFields] = useState<('term' | 'definition')[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Start study session when user clicks Start
    useEffect(() => {
        if (isStarted) {
            startSession(deckId, 'spelling');
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

    const sortTerms = useCallback((currentTerms: Term[], sequence: SequenceType) => {
        const sorted = [...currentTerms];
        if (sequence === 'alpha') {
            return sorted.sort((a, b) => a.term.localeCompare(b.term));
        } else if (sequence === 'random') {
            return sorted.sort(() => Math.random() - 0.5);
        }
        return sorted; // Default
    }, []);

    useEffect(() => {
        if (terms.length > 0) {
            const sorted = sortTerms(terms, settings.sequence);
            const sliced = sorted.slice(0, settings.questionCount);
            setSessionTerms(sliced);

            const fields = sliced.map(() => {
                if (settings.language === 'EN') return 'term' as const;
                if (settings.language === 'VN') return 'definition' as const;
                return Math.random() > 0.5 ? 'term' as const : 'definition' as const;
            });
            setQuestionFields(fields);
            setCurrentIndex(0);
        }
    }, [terms, settings.sequence, settings.questionCount, settings.language, sortTerms]);

    const openSettings = () => {
        setIsPaused(true);
    };

    const handleComplete = useCallback((isCorrect: boolean) => {
        let currentCorrectCount = correctAnswersCount;
        if (isCorrect) {
            currentCorrectCount += 1;
            setCorrectAnswersCount(currentCorrectCount);
        }

        if (isCorrect) {
            if (currentIndex < sessionTerms.length - 1) {
                setCurrentIndex(i => i + 1);
            } else {
                addResult('spelling', {
                    correctAnswers: currentCorrectCount,
                    totalTerms: sessionTerms.length
                });
                endSession();
                navigate(`/learn/${deckId}/summary`);
            }
        }
    }, [correctAnswersCount, currentIndex, sessionTerms.length, addResult, navigate, deckId, endSession]);

    if (terms.length === 0) {
        return <p className="text-center text-[#AFBD96]">{t("No terms available in this deck.")}</p>;
    }

    if (!isStarted) {
        return (
            <GetReadyView
                deckName={deck?.name || ""}
                totalCards={sessionTerms.length || terms.length}
                modeName={t("Chính tả")}
                onStart={() => setIsStarted(true)}
                onCancel={() => navigate('/')}
                onSettings={openSettings}
            />
        );
    }

    const currentTerm = sessionTerms[currentIndex];
    if (!currentTerm) return null;

    const currentQuestionField = questionFields[currentIndex] || (settings.language === 'EN' ? 'term' : 'definition');
    const currentAnswerField = currentQuestionField === 'term' ? 'definition' : 'term';

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

            <div className="w-full max-w-2xl">
                <p className="text-[#AFBD96] mb-6 text-center">{t("Term")} {currentIndex + 1} {t("of")} {sessionTerms.length}</p>
                <SpellingUI
                    term={currentTerm}
                    onComplete={handleComplete}
                    autoAdvance={settings.autoAdvance}
                    showOverrideButton={settings.showOverrideButton}
                    questionField={currentQuestionField}
                    answerField={currentAnswerField}
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
                            <SpellingSettingsModal
                                settings={settings}
                                maxQuestions={terms.length}
                                onUpdate={(newSettings) => setSettings(newSettings)}
                                onReset={() => setSettings({
                                    questionCount: Math.min(10, terms.length),
                                    sequence: 'default',
                                    language: 'VN',
                                    showOverrideButton: true,
                                    autoAdvance: true
                                })}
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
