
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionResults, ModeResults } from '../hooks/useSessionResults';
import { useLanguage } from '../hooks/useLanguage';
import { useWords } from '../hooks/useWords'; // To get deck name

export const DeckCompletedSummary: React.FC = () => {
    const { deckId } = useParams<{ deckId: string }>();
    const { results, clearResults } = useSessionResults();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { decks, updateDeckLastStudied } = useWords();

    const deck = decks.find(d => d.id.toString() === deckId);
    const deckName = deck ? deck.name : t('Unknown Deck');

    // Record the "last studied" timestamp at the moment the deck is completed
    useEffect(() => {
        if (deckId) {
            updateDeckLastStudied(parseInt(deckId));
        }
    }, [deckId, updateDeckLastStudied]);

    const handleReturnToDashboard = () => {
        clearResults();
        navigate('/');
    };

    const renderFlashcardResults = (data: ModeResults['flashcard']) => {
        if (!data) return null;
        const totalReviewed = data.easy + data.good + data.hard;
        return (
            <div className="bg-white dark:bg-[#446843] p-4 rounded-lg shadow-md mb-4">
                <h3 className="text-xl font-bold text-[#1A2B22] dark:text-white mb-2">{t("Flashcard Mode")}</h3>
                <p>{t("Total Cards Reviewed:")} {totalReviewed} / {data.totalCards}</p>
                <p>{t("Easy:")} {data.easy}</p>
                <p>{t("Good:")} {data.good}</p>
                <p>{t("Hard:")} {data.hard}</p>
            </div>
        );
    };

    const renderQuizResults = (data: ModeResults['quiz']) => {
        if (!data) return null;
        const percentage = data.totalQuestions > 0 ? ((data.score / data.totalQuestions) * 100).toFixed(0) : 0;
        return (
            <div className="bg-white dark:bg-[#446843] p-4 rounded-lg shadow-md mb-4">
                <h3 className="text-xl font-bold text-[#1A2B22] dark:text-white mb-2">{t("Quiz Mode")}</h3>
                <p>{t("Score:")} {data.score} / {data.totalQuestions} ({percentage}%)</p>
            </div>
        );
    };

    const renderMatchingResults = (data: ModeResults['matching']) => {
        if (!data) return null;
        const timeInSeconds = (data.timeTakenMs / 1000).toFixed(1);
        return (
            <div className="bg-white dark:bg-[#446843] p-4 rounded-lg shadow-md mb-4">
                <h3 className="text-xl font-bold text-[#1A2B22] dark:text-white mb-2">{t("Matching Mode")}</h3>
                <p>{t("Time Taken:")} {timeInSeconds}s</p>
                <p>{t("Matched Pairs:")} {data.matchedPairs} / {data.totalPairs}</p>
            </div>
        );
    };

    const renderSpellingResults = (data: ModeResults['spelling']) => {
        if (!data) return null;
        const percentage = data.totalTerms > 0 ? ((data.correctAnswers / data.totalTerms) * 100).toFixed(0) : 0;
        return (
            <div className="bg-white dark:bg-[#446843] p-4 rounded-lg shadow-md mb-4">
                <h3 className="text-xl font-bold text-[#1A2B22] dark:text-white mb-2">{t("Spelling Mode")}</h3>
                <p>{t("Correct Answers:")} {data.correctAnswers} / {data.totalTerms} ({percentage}%)</p>
            </div>
        );
    };

    return (
        <div className="animate-fade-in pt-8 max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#121e18] dark:text-white">{t("Deck Completed!")}</h1>
            <p className="text-xl text-[#AFBD96] mb-8">{t("You've finished your session for:")} <span className="font-semibold">{deckName}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {renderFlashcardResults(results.flashcard)}
                {renderQuizResults(results.quiz)}
                {renderMatchingResults(results.matching)}
                {renderSpellingResults(results.spelling)}
            </div>

            <button
                onClick={handleReturnToDashboard}
                className="bg-[#56A652] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-colors shadow-md"
            >
                {t("Return to Dashboard")}
            </button>
        </div>
    );
};
