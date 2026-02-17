
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { Term, ProgressStatus } from '../types';
import { useModal } from '../hooks/useModal';
import { useSessionResults } from '../hooks/useSessionResults'; // New import

export const FlashcardMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, getProgressForTerm, updateProgress } = useWords();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { showConfirm } = useModal();
    const { addResult } = useSessionResults(); // New line
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
    const [isSessionCompleted, setIsSessionCompleted] = useState(false);

    // New state for difficulty counts
    const [easyCount, setEasyCount] = useState(0);
    const [goodCount, setGoodCount] = useState(0);
    const [hardCount, setHardCount] = useState(0);

    const sortTermsForReview = useCallback(() => {
        return [...terms].sort((a, b) => {
            const progressA = getProgressForTerm(a.id);
            const progressB = getProgressForTerm(b.id);

            // Prioritize terms that are 'Learning' or 'New'
            if (progressA.status !== progressB.status) {
                return progressA.status - progressB.status;
            }

            // Prioritize older reviewed terms
            // FIX: Access `last_reviewed` from the progress object `progressB`, not directly from term `b`.
            return new Date(progressA.last_reviewed).getTime() - new Date(progressB.last_reviewed).getTime();
        });
    }, [terms, getProgressForTerm]);

    useEffect(() => {
        if (terms.length > 0) {
            setSessionTerms(sortTermsForReview());
            setCurrentIndex(0);
            setIsFlipped(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [terms]); // Only reset session when the deck's terms change, not on every progress update.

    const handleNext = (difficulty: 'easy' | 'good' | 'hard') => {
        const term = sessionTerms[currentIndex];
        if (!term) return;

        const currentProgress = getProgressForTerm(term.id);
        let newStatus = currentProgress.status;

        switch (difficulty) {
            case 'easy':
                newStatus = ProgressStatus.Mastered;
                setEasyCount(prev => prev + 1); // Increment easy count
                break;
            case 'good':
                newStatus = newStatus === ProgressStatus.New ? ProgressStatus.Learning : newStatus;
                setGoodCount(prev => prev + 1); // Increment good count
                break;
            case 'hard':
                newStatus = ProgressStatus.Learning;
                setHardCount(prev => prev + 1); // Increment hard count
                break;
        }

        updateProgress(term.id, { status: newStatus });

        setIsFlipped(false);
        // Check if this is the last term
        if (currentIndex < sessionTerms.length - 1) {
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
            }, 200);
        } else {
            // This is the last term. Mark session as completed.
            setIsSessionCompleted(true); // Signal completion

            // Calculate the final counts including the current card's selection
            let finalEasyCount = easyCount;
            let finalGoodCount = goodCount;
            let finalHardCount = hardCount;

            switch (difficulty) { // Use the 'difficulty' from the current handleNext call
                case 'easy':
                    finalEasyCount++;
                    break;
                case 'good':
                    finalGoodCount++;
                    break;
                case 'hard':
                    finalHardCount++;
                    break;
            }

            // Add flashcard session results with the final calculated counts
            addResult('flashcard', {
                totalCards: sessionTerms.length,
                easy: finalEasyCount,
                good: finalGoodCount,
                hard: finalHardCount,
            });
            setTimeout(() => {
                // Then, after a slight delay, show the confirmation modal
                showConfirm({
                    title: t("Session Completed!"),
                    message: (<p>{t("Proceed to next learning mode?")}</p>),
                    confirmText: t("Yes"),
                    onConfirm: () => setTimeout(() => navigate(`/learn/${deckId}/quiz`), 300),
                    cancelText: t("No"),
                    onCancel: () => navigate('/') // Go to dashboard if user says no
                });
            }, 200); // Change delay to 200ms
        }
    };

    if (terms.length === 0) {
        return <p className="text-center text-[#AFBD96]">{t("No terms available in this deck.")}</p>;
    }

    const currentTerm = sessionTerms[currentIndex];

    // Don't render anything until sessionTerms is populated to avoid division by zero or flicker
    if (sessionTerms.length === 0 || !currentTerm) {
        return null;
    }

    const displayCurrentIndex = isSessionCompleted ? sessionTerms.length : currentIndex;
    const progress = (displayCurrentIndex / sessionTerms.length) * 100;

    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-2xl mb-4">
                <div className="bg-[#e8e5da] dark:bg-[#446843] rounded-full h-2.5">
                    <div className="bg-[#56A652] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-center mt-2 text-[#AFBD96]">{displayCurrentIndex} / {sessionTerms.length}</p>
            </div>

            <div style={{ perspective: '1000px' }} className="w-full max-w-2xl h-80 mb-6">
                <div
                    className={`relative w-full h-full transform-preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front of card */}
                    <div className="absolute w-full h-full backface-hidden bg-white dark:bg-[#344E41] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-lg flex flex-col justify-center items-center p-6 cursor-pointer shadow-lg text-center">
                        <h2 className="text-5xl font-bold text-[#121e18] dark:text-white mb-3">{currentTerm.term}</h2>
                        {currentTerm.function && (
                            <p className="text-xl italic text-[#AFBD96] mb-3">{currentTerm.function}</p>
                        )}
                        {currentTerm.ipa && (
                            <p className="text-2xl text-[#AFBD96] font-mono">{currentTerm.ipa}</p>
                        )}
                        <div className="absolute bottom-4 text-xs text-[#AFBD96]">{t("Click to flip")}</div>
                    </div>
                    {/* Back of card */}
                    <div className="absolute w-full h-full backface-hidden bg-[#F1F5F9] dark:bg-[#446843] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-lg flex flex-col justify-center items-center p-6 cursor-pointer shadow-lg rotate-y-180">
                        <p className="text-3xl text-[#121e18] dark:text-white text-center">{currentTerm.definition}</p>
                        <div className="absolute bottom-4 text-xs text-[#AFBD96]">{t("Click to flip")}</div>
                    </div>
                </div>
            </div>

            <div className="flex space-x-4">
                <button onClick={() => handleNext('hard')} className="bg-[#EE4266] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-transform transform hover:scale-105">{t("Hard 😵")}</button>
                <button onClick={() => handleNext('good')} className="bg-[#FFD23F] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-transform transform hover:scale-105">{t("Good 👍")}</button>
                <button onClick={() => handleNext('easy')} className="bg-[#0EAD69] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-transform transform hover:scale-105">{t("Easy 😎")}</button>
            </div>
        </div>
    );
};
