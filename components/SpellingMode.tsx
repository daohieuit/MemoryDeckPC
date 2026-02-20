
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useModal } from '../hooks/useModal';
import { useSessionResults } from '../hooks/useSessionResults'; // New import
import { useLanguage } from '../hooks/useLanguage';
import { Term } from '../types';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};


export const SpellingMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, updateProgress } = useWords();
    const { showAlert } = useModal();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { addResult } = useSessionResults(); // New line
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0); // New state

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            showAlert({
                title: t('Speech Synthesis Not Supported'),
                message: t('Your browser does not support the text-to-speech feature required for this mode.')
            });
        }
    };

    useEffect(() => {
        setSessionTerms(shuffleArray(terms));
        setCurrentIndex(0);
    }, [terms]);

    const handleSpeak = useCallback(() => {
        if (sessionTerms[currentIndex]) {
            speak(sessionTerms[currentIndex].term);
        }
    }, [currentIndex, sessionTerms]);

    useEffect(() => {
        // Automatically speak the term when the component mounts or the term changes
        const timeoutId = setTimeout(() => {
            handleSpeak();
        }, 500); // Small delay
        return () => clearTimeout(timeoutId);
    }, [handleSpeak]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback) return; // Don't submit again if feedback is showing

        const currentTerm = sessionTerms[currentIndex];
        if (inputValue.trim().toLowerCase() === currentTerm.term.toLowerCase()) {
            setFeedback('correct');
            updateProgress(currentTerm.id, {});
            setCorrectAnswersCount(prev => prev + 1); // Increment correct answers count
            setTimeout(() => {
                if (currentIndex < sessionTerms.length - 1) {
                    setCurrentIndex(i => i + 1);
                    setInputValue('');
                    setFeedback(null);
                } else {
                    // Spelling session completed
                    const finalCorrectAnswers = correctAnswersCount + 1; // Calculate final count before calling addResult
                    addResult('spelling', {
                        correctAnswers: finalCorrectAnswers,
                        totalTerms: sessionTerms.length
                    });
                    navigate(`/learn/${deckId}/summary`); // Navigate to summary after completing the deck
                }
            }, 1500);
        } else {
            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 1500);
        }
    };

    if (terms.length === 0) {
        return <p className="text-center text-[#AFBD96]">{t("No terms available in this deck.")}</p>;
    }

    const currentTerm = sessionTerms[currentIndex];
    if (!currentTerm) return null;

    let inputBorderColor = 'border-[#EDE9DE] dark:border-[#3A5A40]';
    if (feedback === 'correct') inputBorderColor = 'border-[#0EAD69]';
    if (feedback === 'incorrect') inputBorderColor = 'border-[#EE4266] animate-shake';

    return (
        <div className="max-w-2xl mx-auto text-center">
            <p className="text-[#AFBD96] mb-2">{t("Term")} {currentIndex + 1} {t("of")} {sessionTerms.length}</p>
            <p className="text-xl text-[#121e18]/80 dark:text-white/80 mb-4">{currentTerm.definition}</p>
            <button onClick={handleSpeak} className="bg-[#e8e5da] dark:bg-[#446843] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] p-4 rounded-full mb-8 text-2xl transition-colors">
                <i className="fas fa-volume-up"></i>
            </button>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`w-full bg-white dark:bg-[#344E41] text-[#121e18] dark:text-white text-2xl text-center py-4 px-6 rounded-lg border-2 ${inputBorderColor} outline-none transition-all duration-300`}
                    placeholder={t("Type the term here")}
                    autoFocus
                />
                <button type="submit" className="mt-6 bg-[#56A652] text-white font-bold py-3 px-10 rounded-lg hover:brightness-90 transition-colors">
                    {t("Check")}
                </button>
            </form>
        </div>
    );
};