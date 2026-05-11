import React, { useState, useEffect } from 'react';
import { Term } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { Rating } from 'ts-fsrs';

export interface PredictedIntervals {
    [Rating.Again]: string;
    [Rating.Hard]: string;
    [Rating.Good]: string;
    [Rating.Easy]: string;
}

interface FlashcardUIProps {
    term: Term;
    onNext: (rating: Rating) => void;
    predictedIntervals?: PredictedIntervals;
    autoPlayAudio?: boolean;
    paused?: boolean;
}

export const FlashcardUI: React.FC<FlashcardUIProps> = ({ term, onNext, predictedIntervals, autoPlayAudio = false, paused = false }) => {
    const { t } = useLanguage();
    const [isFlipped, setIsFlipped] = useState(false);

    const speak = (text: string) => {
        if (paused) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    // Reset flip state and handle auto-play when the term changes
    useEffect(() => {
        setIsFlipped(false);
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (autoPlayAudio && !paused) {
            speak(term.term);
        }
    }, [term, autoPlayAudio, paused]);

    const handleRating = (rating: Rating) => {
        if (paused) return;
        onNext(rating);
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div style={{ perspective: '1000px' }} className="w-full max-w-2xl h-80 mb-6">
                <div
                    className={`relative w-full h-full transform-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={() => {
                        if (paused) return;
                        setIsFlipped(!isFlipped);
                    }}
                >
                    <div className="absolute w-full h-full backface-hidden bg-white dark:bg-[#344E41] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-lg flex flex-col justify-center items-center p-6 cursor-pointer shadow-lg text-center">
                        <h2 className="text-5xl font-bold text-[#121e18] dark:text-white mb-3">{term.term}</h2>
                        {term.function && <p className="text-xl italic text-[#AFBD96] mb-3">{term.function}</p>}
                        {term.ipa && <p className="text-2xl text-[#AFBD96] font-mono mb-4">{term.ipa}</p>}

                        {/* Audio button positioned top-right */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (paused) return;
                                speak(term.term);
                            }}
                            disabled={paused}
                            className="absolute top-4 right-4 p-3 rounded-full bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={t("Play pronunciation")}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                        </button>

                        <div className="absolute bottom-4 text-xs text-[#AFBD96]">{t("Click to flip")}</div>
                    </div>
                    <div className="absolute w-full h-full backface-hidden bg-[#F1F5F9] dark:bg-[#446843] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-lg flex flex-col justify-center items-center p-6 cursor-pointer shadow-lg rotate-y-180">
                        <p className="text-3xl text-[#121e18] dark:text-white text-center">{term.definition}</p>
                        <div className="absolute bottom-4 text-xs text-[#AFBD96]">{t("Click to flip")}</div>
                    </div>
                </div>
            </div>

            <div className="flex space-x-4">
                <button disabled={paused} onClick={() => handleRating(Rating.Again)} className="flex flex-col items-center bg-[#EE4266] text-white font-bold py-2 px-6 rounded-lg hover:brightness-90 active:scale-95 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    <span>{t("Again")}</span>
                    {predictedIntervals && <span className="text-xs font-normal opacity-80">{predictedIntervals[Rating.Again]}</span>}
                </button>
                <button disabled={paused} onClick={() => handleRating(Rating.Hard)} className="flex flex-col items-center bg-[#FF9F1C] text-white font-bold py-2 px-6 rounded-lg hover:brightness-90 active:scale-95 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    <span>{t("Hard")}</span>
                    {predictedIntervals && <span className="text-xs font-normal opacity-80">{predictedIntervals[Rating.Hard]}</span>}
                </button>
                <button disabled={paused} onClick={() => handleRating(Rating.Good)} className="flex flex-col items-center bg-[#FFD23F] text-white font-bold py-2 px-6 rounded-lg hover:brightness-90 active:scale-95 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    <span>{t("Good")}</span>
                    {predictedIntervals && <span className="text-xs font-normal opacity-80">{predictedIntervals[Rating.Good]}</span>}
                </button>
                <button disabled={paused} onClick={() => handleRating(Rating.Easy)} className="flex flex-col items-center bg-[#0EAD69] text-white font-bold py-2 px-6 rounded-lg hover:brightness-90 active:scale-95 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    <span>{t("Easy")}</span>
                    {predictedIntervals && <span className="text-xs font-normal opacity-80">{predictedIntervals[Rating.Easy]}</span>}
                </button>
            </div>
        </div>
    );
};
