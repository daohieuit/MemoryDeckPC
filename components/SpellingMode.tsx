
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWords } from '../hooks/useWords';
import { Term } from '../types';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};


export const SpellingMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, updateProgress } = useWords();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Your browser does not support text-to-speech.');
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
            setTimeout(() => {
                if (currentIndex < sessionTerms.length - 1) {
                    setCurrentIndex(i => i + 1);
                    setInputValue('');
                    setFeedback(null);
                } else {
                    alert('You have completed all spelling terms!');
                    setCurrentIndex(0);
                    setSessionTerms(shuffleArray(terms));
                    setFeedback(null);
                }
            }, 1500);
        } else {
            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 1500);
        }
    };

    if (terms.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400">No terms available in this deck.</p>;
    }

    const currentTerm = sessionTerms[currentIndex];
    if (!currentTerm) return null;

    let inputBorderColor = 'border-gray-300 dark:border-slate-600 focus:border-sky-500';
    if (feedback === 'correct') inputBorderColor = 'border-green-500';
    if (feedback === 'incorrect') inputBorderColor = 'border-red-500 animate-shake';

    return (
        <div className="max-w-2xl mx-auto text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-2">Term {currentIndex + 1} of {sessionTerms.length}</p>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">{currentTerm.definition}</p>
            <button onClick={handleSpeak} className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 p-4 rounded-full mb-8 text-2xl transition-colors">
                <i className="fas fa-volume-up"></i>
            </button>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-2xl text-center py-4 px-6 rounded-lg border-2 ${inputBorderColor} outline-none transition-all duration-300`}
                    placeholder="Type the term here"
                    autoFocus
                />
                <button type="submit" className="mt-6 bg-sky-500 text-white font-bold py-3 px-10 rounded-lg hover:bg-sky-600 transition-colors">
                    Check
                </button>
            </form>
        </div>
    );
};