
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useModal } from '../hooks/useModal';
import { useLanguage } from '../hooks/useLanguage';
import { useSessionResults } from '../hooks/useSessionResults';
import { useStudySession } from '../hooks/useStudySessionContext';
import { Term } from '../types';
import { QuizUI } from './QuizUI';
import { GetReadyView } from './GetReadyView';
import { QuizSettingsModal, QuizSettings, QuizLanguageType } from './QuizSettingsModal';
import { SequenceType } from './FlashcardSettingsModal';
import { GearIcon } from './icons/Icons';

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const QuizMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, decks } = useWords();
    const { t } = useLanguage();
    const { showConfirm } = useModal();
    const navigate = useNavigate();
    const { startSession, endSession } = useStudySession();
    const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);
    const [isStarted, setIsStarted] = useState(false);
    const [settings, setSettings] = useState<QuizSettings>({
        questionCount: 10,
        sequence: 'default',
        language: 'EN'
    });
    const { addResult } = useSessionResults();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [shuffledTerms, setShuffledTerms] = useState<Term[]>([]);
    const [questionFields, setQuestionFields] = useState<('term' | 'definition')[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [options, setOptions] = useState<Term[]>([]);
    const [score, setScore] = useState(0);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
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
            startSession(deckId, 'quiz');
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
        }
        return sorted; // Default
    }, []);

    useEffect(() => {
        if (terms.length > 0) {
            const sorted = sortTerms(terms, settings.sequence);
            const sliced = sorted.slice(0, settings.questionCount);
            setShuffledTerms(sliced);
            
            const fields = sliced.map(() => {
                if (settings.language === 'EN') return 'term' as const;
                if (settings.language === 'VN') return 'definition' as const;
                return Math.random() > 0.5 ? 'term' as const : 'definition' as const;
            });
            setQuestionFields(fields);
            setCurrentQuestionIndex(0);
        }
    }, [terms, settings.sequence, settings.questionCount, settings.language, sortTerms]);

    const openSettings = () => {
        setIsPaused(true);
    };

    const generateOptions = useCallback(() => {
        if (shuffledTerms.length < 4) {
            setOptions(shuffleArray(shuffledTerms));
            return;
        }

        const correctAnswer = shuffledTerms[currentQuestionIndex];
        const distractors = shuffledTerms
            .filter(t => t.id !== correctAnswer.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        setOptions(shuffleArray([correctAnswer, ...distractors]));
    }, [currentQuestionIndex, shuffledTerms]);

    useEffect(() => {
        if (shuffledTerms.length > 0 && currentQuestionIndex < shuffledTerms.length) {
            generateOptions();
        }
    }, [currentQuestionIndex, shuffledTerms, generateOptions]);

    const handleComplete = useCallback((isCorrect: boolean) => {
        if (isCorrect) setScore(s => s + 1);

        if (currentQuestionIndex < shuffledTerms.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            setIsQuizCompleted(true);
            
            const finalScore = score + (isCorrect ? 1 : 0);
            
            addResult('quiz', {
                score: finalScore,
                totalQuestions: shuffledTerms.length
            });
            setTimeout(() => {
                showConfirm({
                    title: t('Quiz Finished!'),
                    message: (
                        <>
                            <p>{t('Your score:')} {finalScore}/{shuffledTerms.length}</p>
                            <p className="mt-2">{t('Proceed to next learning mode?')}</p>
                        </>
                    ),
                    confirmText: t('Yes'),
                    onConfirm: () => {
                        endSession();
                        setTimeout(() => navigate(`/learn/${deckId}/matching`), 300);
                    },
                    cancelText: t('No'),
                    onCancel: () => {
                        endSession();
                        navigate('/');
                    }
                });
            }, 200);
        }
    }, [currentQuestionIndex, shuffledTerms.length, score, deckId, navigate, showConfirm, t, addResult]);

    if (terms.length < 4) {
        return <p className="text-center text-[#AFBD96]">{t("You need at least 4 terms in this deck to start a quiz.")}</p>;
    }

    if (!isStarted) {
        return (
            <GetReadyView 
                deckName={deck?.name || ""}
                totalCards={shuffledTerms.length || terms.length}
                modeName={t("Quiz")}
                onStart={() => setIsStarted(true)}
                onCancel={() => navigate('/')}
                onSettings={openSettings}
            />
        );
    }

    const currentTerm = shuffledTerms[currentQuestionIndex];
    if (!currentTerm) return null;

    const currentQuestionField = questionFields[currentQuestionIndex] || 'term';
    const currentOptionField = currentQuestionField === 'term' ? 'definition' : 'term';

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

            <p className="text-[#AFBD96] mb-2">{t("Question")} {isQuizCompleted ? shuffledTerms.length : currentQuestionIndex + 1} {t("of")} {shuffledTerms.length}</p>
            <QuizUI
                term={currentTerm}
                options={options}
                onComplete={handleComplete}
                questionField={currentQuestionField}
                optionField={currentOptionField}
                paused={isPaused}
            />

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
                            <QuizSettingsModal
                                settings={settings}
                                maxQuestions={terms.length}
                                onUpdate={(newSettings) => setSettings(newSettings)}
                                onReset={() => setSettings({
                                    questionCount: Math.min(10, terms.length),
                                    sequence: 'default',
                                    language: 'EN'
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