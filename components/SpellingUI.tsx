import React, { useState, useEffect, useCallback } from 'react';
import { Term } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useModal } from '../hooks/useModal';

interface SpellingUIProps {
    term: Term;
    onComplete: (isCorrect: boolean) => void;
    autoAdvance?: boolean;
    showOverrideButton?: boolean;
    questionField?: 'term' | 'definition';
    answerField?: 'term' | 'definition';
    paused?: boolean;
}

export const SpellingUI: React.FC<SpellingUIProps> = ({ 
    term, 
    onComplete, 
    autoAdvance = false, 
    showOverrideButton = false,
    questionField = 'definition',
    answerField = 'term',
    paused = false
}) => {
    const { t } = useLanguage();
    const { showAlert } = useModal();
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    // Reset state on term change
    useEffect(() => {
        setInputValue('');
        setFeedback(null);
    }, [term]);

    const speak = useCallback((text: string) => {
        if (paused) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            showAlert({
                title: t('Speech Synthesis Not Supported'),
                message: t('Your browser does not support the text-to-speech feature required for this mode.')
            });
        }
    }, [paused, showAlert, t]);

    const handleSpeak = useCallback(() => {
        if (term) {
            speak(term.term);
        }
    }, [term, speak]);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (questionField === 'term' && !paused) {
            const timeoutId = setTimeout(() => {
                handleSpeak();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [handleSpeak, paused, questionField]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (paused || feedback === 'correct') return;

        const isCorrect = inputValue.trim().toLowerCase() === term[answerField].toLowerCase();
        
        if (isCorrect) {
            setFeedback('correct');
            const delay = autoAdvance ? 500 : 1500;
            setTimeout(() => {
                onComplete(true);
            }, delay);
        } else {
            setFeedback('incorrect');
            if (!showOverrideButton) {
                setTimeout(() => {
                    setFeedback(null);
                    onComplete(false);
                }, 1500);
            }
        }
    };

    const handleOverride = () => {
        if (paused) return;
        setFeedback('correct');
        onComplete(true);
    };

    let inputBorderColor = 'border-[#EDE9DE] dark:border-[#3A5A40]';
    if (feedback === 'correct') inputBorderColor = 'border-[#0EAD69]';
    if (feedback === 'incorrect') inputBorderColor = 'border-[#EE4266] animate-shake';

    return (
        <div className="w-full text-center">
            <p className="text-xl text-[#AFBD96] mb-4 uppercase tracking-widest font-bold">{t("Translate this")}</p>
            <p className="text-3xl text-[#121e18] dark:text-white font-bold mb-6">{term[questionField]}</p>
            
            {questionField === 'term' && (
                <button onClick={handleSpeak} disabled={paused} className="bg-[#e8e5da] dark:bg-[#446843] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] p-4 rounded-full mb-8 text-2xl transition-all active:scale-95 duration-150 shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                    <i className="fas fa-volume-up"></i>
                </button>
            )}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={paused}
                    className={`w-full bg-white dark:bg-[#344E41] text-[#121e18] dark:text-white text-2xl text-center py-4 px-6 rounded-lg border-2 ${inputBorderColor} outline-none transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60`}
                    placeholder={t("Type the term here")}
                    autoFocus
                />
                
                <div className="flex flex-col gap-4 mt-8 items-center">
                    {feedback === 'incorrect' && showOverrideButton && (
                        <button 
                            type="button"
                            onClick={handleOverride}
                            disabled={paused}
                            className="text-[#56A652] font-bold hover:underline active:scale-95 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {t("I was right, override")}
                        </button>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={paused || feedback === 'correct'}
                        className="bg-[#56A652] text-white font-black py-4 px-16 rounded-2xl shadow-[0_8px_0_rgb(67,130,64)] hover:shadow-[0_4px_0_rgb(67,130,64)] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] active:scale-95 transition-all duration-150 text-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_rgb(67,130,64)]"
                    >
                        {t("Check")}
                    </button>

                    {feedback === 'incorrect' && !showOverrideButton && (
                        <button 
                            type="button"
                            onClick={() => onComplete(false)}
                            disabled={paused}
                            className="text-[#AFBD96] font-bold hover:text-[#121e18] dark:hover:text-white active:scale-95 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {t("Don't know")}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
