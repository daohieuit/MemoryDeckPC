import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { GameMode } from '../types';
import { BookOpenIcon, PencilIcon, PuzzlePieceIcon, QuestionMarkCircleIcon } from './icons/Icons';

export const Home: React.FC = () => {
    const { decks } = useWords();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false); // New state for search bar
    const searchRef = useRef<HTMLDivElement>(null); // Ref for click-outside

    const handleStart = (deckId: number, mode: GameMode) => {
        navigate(`/learn/${deckId}/${mode}`);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const filteredDecks = decks.filter(deck =>
        deck.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Effect for handling clicks outside the search bar to collapse it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchExpanded(false);
                setSearchTerm(''); // Clear search when collapsing
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);


    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#121e18] dark:text-white">{t("Welcome Back! 👋")}</h1>
                    <p className="text-[#AFBD96] text-lg">{t("Choose a deck to start learning. 💪")}</p>
                </div>
                <div className="relative" ref={searchRef}>
                    {!isSearchExpanded ? (
                        <button
                            onClick={() => setIsSearchExpanded(true)}
                            className="p-2 rounded-full text-[#AFBD96] hover:text-[#56A652] transition-colors"
                            aria-label={t("Search decks...")}
                        >
                            <i className="fas fa-search text-xl"></i>
                        </button>
                    ) : (
                        <>
                            <input
                                type="text"
                                placeholder={t("Search decks...")}
                                className="w-48 sm:w-64 py-2 pl-10 pr-10 rounded-lg bg-white dark:bg-[#344E41] border border-[#EDE9DE] dark:border-[#3A5A40] text-[#121e18] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#56A652] transition-all duration-300 ease-in-out"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus // Focus when expanded
                            />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#AFBD96] text-lg"></i>
                            {searchTerm && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AFBD96] hover:text-[#EE4266] transition-colors"
                                    aria-label={t("Clear search")}
                                >
                                    <i className="fas fa-times text-lg"></i>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {filteredDecks.length === 0 && decks.length > 0 && (
                <div className="text-center text-[#AFBD96] text-lg mt-8">
                    {t("No decks found matching your search.")}
                </div>
            )}

            {decks.length === 0 ? (
                <div className="text-center bg-white dark:bg-[#344E41] p-8 rounded-lg border border-[#EDE9DE] dark:border-[#3A5A40]">
                    <h2 className="text-2xl font-bold mb-4">{t("No Decks Found")}</h2>
                    <p className="text-[#AFBD96] mb-6">{t("Get started by creating your first deck.")}</p>
                    <button
                        onClick={() => navigate('/manage-words')}
                        className="bg-[#56A652] text-white font-bold py-2 px-6 rounded-lg hover:brightness-90 transition-colors duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#56A652] focus:ring-opacity-75"
                    >
                        {t("Create a Deck")}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {filteredDecks.map(deck => (
                        <div key={deck.id} className="bg-white dark:bg-[#344E41] rounded-xl shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40] overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 relative">
                            <button
                                onClick={() => navigate(`/manage-words/${deck.id}`)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-gray-200 dark:bg-[#446843] text-[#121e18] dark:text-white hover:bg-gray-300 dark:hover:bg-[#56A652] transition-colors duration-200"
                                aria-label={t("Edit Deck")}
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-[#121e18] dark:text-white mb-4">{deck.name}</h2>
                                <p className="text-[#AFBD96] mb-6 h-12">{t("Select a mode to begin your learning session for this deck.")}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Flashcard)} icon={<BookOpenIcon />} label={t("Flashcard")} />
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Quiz)} icon={<QuestionMarkCircleIcon />} label={t("Quiz")} />
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Matching)} icon={<PuzzlePieceIcon />} label={t("Ghép từ")} />
                                    <ModeButton onClick={() => handleStart(deck.id, GameMode.Spelling)} icon={<PencilIcon />} label={t("Chính tả")} />
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
        className="w-full flex items-center justify-center space-x-2 bg-[#e8e5da] dark:bg-[#446843] text-[#121e18] dark:text-[#F1F5F9] py-3 px-4 rounded-lg hover:bg-[#56A652] hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#56A652] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#344E41]"
    >
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);
