import React, { useState, useEffect, useRef } from 'react';
import { Term } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface QuizUIProps {
    term: Term;
    options: Term[];
    onComplete: (isCorrect: boolean) => void;
    questionField?: 'term' | 'definition';
    optionField?: 'term' | 'definition';
    paused?: boolean;
}

export const QuizUI: React.FC<QuizUIProps> = ({ term, options, onComplete, questionField = 'term', optionField = 'definition', paused = false }) => {
    const { t } = useLanguage();
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [showCountdown, setShowCountdown] = useState(false);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Reset state when term changes
    useEffect(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setCountdown(0);
        setShowCountdown(false);
    }, [term]);

    const handleNext = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        // Only trigger completion if they actually answered
        if (isCorrect !== null) {
            onComplete(isCorrect);
        }
    };

    // Countdown logic
    useEffect(() => {
        if (showCountdown && countdown > 0 && !paused) {
            countdownRef.current = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (showCountdown && countdown === 0 && !paused) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            handleNext(); // Auto-advance
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [showCountdown, countdown, paused]);

    const handleAnswer = (selectedOption: Term) => {
        if (selectedAnswer !== null) return;

        setSelectedAnswer(selectedOption.id);
        const wasCorrect = selectedOption.id === term.id;
        setIsCorrect(wasCorrect);

        if (wasCorrect) {
            setShowCountdown(true);
            setCountdown(5);
        }
    };

    return (
        <div className="max-w-3xl mx-auto text-center w-full">
            <h2 className="text-4xl font-bold mb-4 text-[#121e18] dark:text-white">{term[questionField]}</h2>
            <p className="text-xl text-[#AFBD96] mb-8">{t("Which of the following best defines this term?")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {options.map(option => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrectAnswer = option.id === term.id;

                    let buttonClass = 'bg-white dark:bg-[#446843] hover:bg-[#e8e5da] dark:hover:bg-[#467645]';
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
                            className={`p-6 rounded-lg text-left transition-all duration-300 active:scale-95 disabled:cursor-not-allowed ${buttonClass}`}
                        >
                            {option[optionField]}
                        </button>
                    );
                })}
            </div>

            {selectedAnswer !== null && (
                <div className="flex flex-col items-center">
                    <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-[#0EAD69]' : 'text-[#EE4266]'}`}>
                        {isCorrect ? t('Correct! 🎯') : t('Incorrect!')}
                    </p>
                    {!isCorrect && <p className="mb-4 text-[#AFBD96] font-medium">{t("The correct answer was:")} {term[optionField]}</p>}
                    {isCorrect && showCountdown && (
                        <p className="text-[#AFBD96] mb-4">{t("Next in {0}s...", countdown)}</p>
                    )}
                    {(isCorrect || !showCountdown) && (
                        <button
                            onClick={handleNext}
                            className="bg-[#56A652] text-white font-bold py-3 px-10 rounded-lg hover:brightness-90 active:scale-95 transition-all duration-150"
                        >
                            {t('Continue')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
