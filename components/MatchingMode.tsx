
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWords } from '../hooks/useWords';
import { Term } from '../types';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

export const MatchingMode: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, updateProgress } = useWords();
    const terms = useMemo(() => getTermsForDeck(deckId), [deckId, getTermsForDeck]);

    const [gameTerms, setGameTerms] = useState<Term[]>([]);
    const [shuffledDefinitions, setShuffledDefinitions] = useState<Term[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const [selectedDefinition, setSelectedDefinition] = useState<Term | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
    const [incorrectMatch, setIncorrectMatch] = useState<[number, number] | null>(null);

    const [startTime, setStartTime] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<number | null>(null);

    const isComplete = useMemo(() => gameTerms.length > 0 && matchedPairs.length === gameTerms.length, [gameTerms.length, matchedPairs.length]);

    const setupGame = useCallback(() => {
        const gameTermsSubset = shuffleArray(terms).slice(0, 5);
        setGameTerms(gameTermsSubset);
        setShuffledDefinitions(shuffleArray(gameTermsSubset));
        setMatchedPairs([]);
        setSelectedTerm(null);
        setSelectedDefinition(null);
        setStartTime(Date.now());
        setCurrentTime(Date.now());
    }, [terms]);

    useEffect(() => {
        if (terms.length >= 2) {
            setupGame();
        }
    }, [terms, setupGame]);

    useEffect(() => {
        if (!isComplete && startTime) {
            const timer = setInterval(() => {
                setCurrentTime(Date.now());
            }, 10);
            return () => clearInterval(timer);
        }
    }, [isComplete, startTime]);

    useEffect(() => {
        if (selectedTerm && selectedDefinition) {
            if (selectedTerm.id === selectedDefinition.id) {
                // Correct match
                setMatchedPairs(prev => [...prev, selectedTerm.id]);
                updateProgress(selectedTerm.id, {});
            } else {
                // Incorrect match
                setIncorrectMatch([selectedTerm.id, selectedDefinition.id]);
                setTimeout(() => setIncorrectMatch(null), 1000);
            }
            setSelectedTerm(null);
            setSelectedDefinition(null);
        }
    }, [selectedTerm, selectedDefinition, updateProgress]);

    const handleRestart = () => {
        setupGame();
    }

    if (terms.length < 2) {
        return <p className="text-center text-[#AFBD96]">You need at least 2 terms in this deck to play the matching game.</p>;
    }

    const elapsedTime = startTime && currentTime ? currentTime - startTime : 0;

    const formatTime = (totalMilliseconds: number) => {
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
        return `${totalSeconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    };

    if (isComplete) {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold text-[#0EAD69] mb-4">Congratulations!</h2>
                <p className="text-[#121e18]/80 dark:text-white/80 mb-6">You've matched all the terms in <span className="font-bold text-lg">{formatTime(elapsedTime)}</span>.</p>
                <button onClick={handleRestart} className="bg-[#56A652] text-white font-bold py-2 px-6 rounded-lg hover:brightness-90 transition-colors">Play Again</button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
                <div className="text-4xl font-mono font-bold text-[#121e18] dark:text-white tracking-wider">
                    {formatTime(elapsedTime)}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Terms Column */}
                <div className="space-y-3">
                    {gameTerms.map(term => {
                        const isMatched = matchedPairs.includes(term.id);
                        const isSelected = selectedTerm?.id === term.id;
                        const isIncorrect = incorrectMatch?.[0] === term.id;

                        let bgClass = 'bg-white dark:bg-[#446843] hover:bg-[#e8e5da] dark:hover:bg-[#467645]';
                        if (isMatched) bgClass = 'bg-[#0EAD69]/20 dark:bg-[#0EAD69]/30 cursor-default';
                        if (isSelected) bgClass = 'bg-[#56A652] text-white';
                        if (isIncorrect) bgClass = 'bg-[#EE4266] text-white animate-shake';

                        return (
                            <button
                                key={term.id}
                                disabled={isMatched}
                                onClick={() => setSelectedTerm(term)}
                                className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${bgClass}`}
                            >
                                <span className={isMatched ? 'line-through text-[#AFBD96]' : 'text-[#121e18] dark:text-white'}>{term.term}</span>
                            </button>
                        );
                    })}
                </div>
                {/* Definitions Column */}
                <div className="space-y-3">
                    {shuffledDefinitions.map(term => {
                        const isMatched = matchedPairs.includes(term.id);
                        const isSelected = selectedDefinition?.id === term.id;
                        const isIncorrect = incorrectMatch?.[1] === term.id;

                        let bgClass = 'bg-white dark:bg-[#446843] hover:bg-[#e8e5da] dark:hover:bg-[#467645]';
                        if (isMatched) bgClass = 'bg-[#0EAD69]/20 dark:bg-[#0EAD69]/30 cursor-default';
                        if (isSelected) bgClass = 'bg-[#56A652] text-white';
                        if (isIncorrect) bgClass = 'bg-[#EE4266] text-white animate-shake';

                        return (
                            <button
                                key={term.id}
                                disabled={isMatched}
                                onClick={() => setSelectedDefinition(term)}
                                className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${bgClass}`}
                            >
                                <span className={isMatched ? 'line-through text-[#AFBD96]' : 'text-[#121e18]/80 dark:text-white/80'}>{term.definition}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
