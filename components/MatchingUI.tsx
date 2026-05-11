import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Term } from '../types';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

const formatTime = (totalMilliseconds: number) => {
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
    return `${totalSeconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
};

interface MatchingUIProps {
    terms: Term[];
    onComplete: (mistakesByTermId: Record<number, number>, timeTakenMs: number) => void;
    showTimer?: boolean;
    paused?: boolean;
}

export const MatchingUI: React.FC<MatchingUIProps> = ({ terms, onComplete, showTimer = true, paused = false }) => {
    const [shuffledDefinitions, setShuffledDefinitions] = useState<Term[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const [selectedDefinition, setSelectedDefinition] = useState<Term | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
    const [incorrectMatch, setIncorrectMatch] = useState<[number, number] | null>(null);
    const [mistakes, setMistakes] = useState<Record<number, number>>({});

    const [startTime, setStartTime] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<number | null>(null);
    const [pauseStart, setPauseStart] = useState<number | null>(null);

    const elapsedTime = startTime && currentTime ? currentTime - startTime : 0;
    const isComplete = useMemo(() => terms.length > 0 && matchedPairs.length === terms.length, [terms.length, matchedPairs.length]);

    const setupGame = useCallback(() => {
        setShuffledDefinitions(shuffleArray(terms));
        setMatchedPairs([]);
        setSelectedTerm(null);
        setSelectedDefinition(null);
        setMistakes({});
        setStartTime(Date.now());
        setCurrentTime(Date.now());
    }, [terms]);

    useEffect(() => {
        if (terms.length >= 2) {
            setupGame();
        }
    }, [terms, setupGame]);

    useEffect(() => {
        if (!isComplete && startTime && !paused) {
            const timer = setInterval(() => {
                setCurrentTime(Date.now());
            }, 10);
            return () => clearInterval(timer);
        }
    }, [isComplete, startTime, paused]);

    useEffect(() => {
        if (selectedTerm && selectedDefinition) {
            if (selectedTerm.id === selectedDefinition.id) {
                // Correct match
                setMatchedPairs(prev => [...prev, selectedTerm.id]);
            } else {
                // Incorrect match
                setIncorrectMatch([selectedTerm.id, selectedDefinition.id]);
                setMistakes(prev => ({
                    ...prev,
                    [selectedTerm.id]: (prev[selectedTerm.id] || 0) + 1,
                    [selectedDefinition.id]: (prev[selectedDefinition.id] || 0) + 1,
                }));
                setTimeout(() => setIncorrectMatch(null), 1000);
            }
            setSelectedTerm(null);
            setSelectedDefinition(null);
        }
    }, [selectedTerm, selectedDefinition]);

    useEffect(() => {
        if (paused) {
            setPauseStart(Date.now());
        } else {
            if (pauseStart !== null && startTime !== null) {
                const pauseDuration = Date.now() - pauseStart;
                setStartTime(prev => prev !== null ? prev + pauseDuration : prev);
                // Also update currentTime to avoid a jump when interval resumes
                setCurrentTime(Date.now());
                setPauseStart(null);
            }
        }
    }, [paused, pauseStart, startTime]);

    useEffect(() => {
        if (isComplete && terms.length > 0) {
            // Delay slightly to show final match state
            const timer = setTimeout(() => {
                onComplete(mistakes, elapsedTime);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isComplete, terms.length, onComplete, mistakes, elapsedTime]);

    if (terms.length < 2) return null;
    if (isComplete) return null;

    return (
        <div className="max-w-4xl mx-auto w-full">
            {showTimer && (
                <div className="text-center mb-6">
                    <div className="text-4xl font-mono font-bold text-[#121e18] dark:text-white tracking-wider">
                        {formatTime(elapsedTime)}
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Terms Column */}
                <div className="space-y-3">
                    {terms.map(term => {
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
                                className={`w-full p-4 rounded-lg text-left transition-all duration-200 active:scale-95 ${bgClass}`}
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
                                className={`w-full p-4 rounded-lg text-left transition-all duration-200 active:scale-95 ${bgClass}`}
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
