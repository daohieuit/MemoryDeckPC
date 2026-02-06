
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWords } from '../hooks/useWords';
import { Term, ProgressStatus } from '../types';

export const FlashcardMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, getProgressForTerm, updateProgress } = useWords();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionTerms, setSessionTerms] = useState<Term[]>([]);

    const sortTermsForReview = useCallback(() => {
        return [...terms].sort((a, b) => {
            const progressA = getProgressForTerm(a.id);
            const progressB = getProgressForTerm(b.id);

            // Prioritize terms that are 'Learning' or 'New'
            if (progressA.status !== progressB.status) {
                return progressA.status - progressB.status;
            }

            // Prioritize older reviewed terms
            return new Date(progressA.last_reviewed).getTime() - new Date(progressB.last_reviewed).getTime();
        });
    }, [terms, getProgressForTerm]);

    useEffect(() => {
        if (terms.length > 0) {
            setSessionTerms(sortTermsForReview());
            setCurrentIndex(0);
        }
    }, [terms, sortTermsForReview]);

    const handleNext = (difficulty: 'easy' | 'good' | 'hard') => {
        const term = sessionTerms[currentIndex];
        if (!term) return;

        const currentProgress = getProgressForTerm(term.id);
        let newStatus = currentProgress.status;

        switch (difficulty) {
            case 'easy':
                newStatus = ProgressStatus.Mastered;
                break;
            case 'good':
                newStatus = newStatus === ProgressStatus.New ? ProgressStatus.Learning : newStatus;
                break;
            case 'hard':
                newStatus = ProgressStatus.Learning;
                break;
        }

        updateProgress(term.id, { status: newStatus });

        setIsFlipped(false);
        setTimeout(() => {
            if (currentIndex < sessionTerms.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                // Reshuffle and start over
                setSessionTerms(sortTermsForReview());
                setCurrentIndex(0);
            }
        }, 200);
    };

    if (terms.length === 0) {
        return <p className="text-center text-[#AFBD96]">No terms available in this deck.</p>;
    }

    const currentTerm = sessionTerms[currentIndex];
    if (!currentTerm) return null;

    const progress = (currentIndex / terms.length) * 100;

    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-2xl mb-4">
                <div className="bg-[#e8e5da] dark:bg-[#446843] rounded-full h-2.5">
                    <div className="bg-[#56A652] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-center mt-2 text-[#AFBD96]">{currentIndex} / {terms.length}</p>
            </div>

            <div style={{ perspective: '1000px' }} className="w-full max-w-2xl h-80 mb-6">
                <div
                    className={`relative w-full h-full transform-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front of card */}
                    <div className="absolute w-full h-full backface-hidden bg-white dark:bg-[#344E41] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-lg flex flex-col justify-center items-center p-6 cursor-pointer shadow-lg">
                        <h2 className="text-5xl font-bold text-[#1A2B22] dark:text-white mb-4">{currentTerm.term}</h2>
                        <p className="text-2xl text-[#AFBD96]">/{currentTerm.ipa}/</p>
                        <div className="absolute bottom-4 text-xs text-[#AFBD96]">Click to flip</div>
                    </div>
                    {/* Back of card */}
                    <div className="absolute w-full h-full backface-hidden bg-[#F1F5F9] dark:bg-[#446843] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-lg flex flex-col justify-center items-center p-6 cursor-pointer shadow-lg rotate-y-180">
                        <p className="text-2xl text-[#1A2B22] dark:text-white text-center mb-4">{currentTerm.definition}</p>
                        <p className="text-lg text-[#1A2B22]/80 dark:text-white/80 italic text-center">"{currentTerm.function}"</p>
                        <div className="absolute bottom-4 text-xs text-[#AFBD96]">Click to flip</div>
                    </div>
                </div>
            </div>

            <div className="flex space-x-4">
                <button onClick={() => handleNext('hard')} className="bg-[#EE4266] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-transform transform hover:scale-105">Hard</button>
                <button onClick={() => handleNext('good')} className="bg-[#FFD23F] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-transform transform hover:scale-105">Good</button>
                <button onClick={() => handleNext('easy')} className="bg-[#0EAD69] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-transform transform hover:scale-105">Easy</button>
            </div>
        </div>
    );
};
