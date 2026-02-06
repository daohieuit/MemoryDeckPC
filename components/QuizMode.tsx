
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWords } from '../hooks/useWords';
import { Term } from '../types';

// Utility to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};


export const QuizMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, updateProgress } = useWords();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [options, setOptions] = useState<Term[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);

    const shuffledTerms = useMemo(() => shuffleArray(terms), [terms]);

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
        if (shuffledTerms.length > 0) {
            generateOptions();
        }
    }, [currentQuestionIndex, shuffledTerms, generateOptions]);

    const handleAnswer = (term: Term) => {
        if (selectedAnswer !== null) return;

        setSelectedAnswer(term.id);
        const correctAnswer = shuffledTerms[currentQuestionIndex];
        const wasCorrect = term.id === correctAnswer.id;

        setIsCorrect(wasCorrect);
        if (wasCorrect) {
            setScore(s => s + 1);
        }
        updateProgress(correctAnswer.id, {}); // Mark as reviewed
    };

    const handleNext = () => {
        setSelectedAnswer(null);
        setIsCorrect(null);
        if (currentQuestionIndex < shuffledTerms.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            // End of quiz
            alert(`Quiz finished! Your score: ${score}/${shuffledTerms.length}`);
            setCurrentQuestionIndex(0);
            setScore(0);
        }
    };

    if (terms.length < 4) {
        return <p className="text-center text-[#AFBD96]">You need at least 4 terms in this deck to start a quiz.</p>;
    }

    const currentTerm = shuffledTerms[currentQuestionIndex];
    if (!currentTerm) return null;

    return (
        <div className="max-w-3xl mx-auto text-center">
            <p className="text-[#AFBD96] mb-2">Question {currentQuestionIndex + 1} of {shuffledTerms.length}</p>
            <h2 className="text-4xl font-bold mb-4">{currentTerm.term}</h2>
            <p className="text-xl text-[#1A2B22]/80 dark:text-white/80 mb-8">Which of the following best defines this term?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {options.map(option => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrectAnswer = option.id === currentTerm.id;

                    let buttonClass = 'bg-white dark:bg-[#446843] hover:bg-[#DAD7CD] dark:hover:bg-[#467645]';
                    if (isSelected) {
                        buttonClass = isCorrect ? 'bg-[#0EAD69] text-white' : 'bg-[#EE4266] text-white';
                    } else if (selectedAnswer !== null && isCorrectAnswer) {
                        buttonClass = 'bg-[#0EAD69] text-white';
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleAnswer(option)}
                            disabled={selectedAnswer !== null}
                            className={`p-6 rounded-lg text-left transition-all duration-300 disabled:cursor-not-allowed ${buttonClass}`}
                        >
                            {option.definition}
                        </button>
                    );
                })}
            </div>

            {selectedAnswer !== null && (
                <div className="flex flex-col items-center">
                    <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-[#0EAD69]' : 'text-[#EE4266]'}`}>
                        {isCorrect ? 'Correct!' : 'Incorrect!'}
                    </p>
                    {!isCorrect && <p className="mb-4 text-[#1A2B22]/80 dark:text-white/80">The correct answer was: {currentTerm.definition}</p>}
                    <button
                        onClick={handleNext}
                        className="bg-[#56A652] text-white font-bold py-3 px-10 rounded-lg hover:brightness-90 transition-colors"
                    >
                        {currentQuestionIndex < shuffledTerms.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </button>
                </div>
            )}
        </div>
    );
};
