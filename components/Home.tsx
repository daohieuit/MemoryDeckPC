
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { GameMode } from '../types';
import { BookOpenIcon, PencilIcon, PuzzlePieceIcon, QuestionMarkCircleIcon } from './icons/Icons';

export const Home: React.FC = () => {
    const { decks } = useWords();
    const navigate = useNavigate();

    const handleStart = (deckId: number, mode: GameMode) => {
        navigate(`/learn/${deckId}/${mode}`);
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-slate-900 dark:text-white">Welcome Back!</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">Choose a deck to start learning.</p>

            {decks.length === 0 ? (
                <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg border border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4">No Decks Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Get started by creating your first deck.</p>
                    <button
                        onClick={() => navigate('/manage-words')}
                        className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
                    >
                        Create a Deck
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map(deck => (
                        <div key={deck.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{deck.name}</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6 h-12">Select a mode to begin your learning session for this deck.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Flashcard)} icon={<BookOpenIcon />} label="Flashcard" />
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Quiz)} icon={<QuestionMarkCircleIcon />} label="Quiz" />
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Matching)} icon={<PuzzlePieceIcon />} label="Matching" />
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Spelling)} icon={<PencilIcon />} label="Spelling" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface ModeButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({ onClick, icon, label }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 px-4 rounded-lg hover:bg-sky-500 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"
    >
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);