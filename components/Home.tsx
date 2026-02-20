import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { Deck, GameMode } from '../types';
import { PencilIcon } from './icons/Icons';
import { useModal } from '../hooks/useModal';
import { LearningModeSelector } from './LearningModeSelector';

export const Home: React.FC = () => {
    const { decks, getTermsForDeck } = useWords();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false); // New state for search bar
    const searchRef = useRef<HTMLDivElement>(null); // Ref for click-outside
    const [streakValue, setStreakValue] = useState(5); // Simulate a streak for UI purposes

    const { showModal, hideModal } = useModal();

    const handleStart = (deckId: number, mode: GameMode) => {
        navigate(`/learn/${deckId}/${mode}`);
    };

    const openModeModal = (deck: Deck) => {
        const handleEditDeck = () => {
            navigate(`/manage-words/${deck.id}`);
            hideModal(); // Close modal after navigating
        };

        const editButton = (
            <button
                onClick={handleEditDeck}
                className="text-sm text-[#AFBD96] hover:text-[#56A652] transition-colors flex items-center gap-1 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#446843]"
                aria-label={t("Edit Deck")}
            >
                <PencilIcon className="w-4 h-4" />
            </button>
        );

        showModal({
            title: deck.name,
            message: <LearningModeSelector deck={deck} handleStart={handleStart} onClose={hideModal} />,
            headerButtons: editButton,
        });
    };

    const closeModeModal = () => {
        hideModal();
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
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#121e18] dark:text-white mb-4">{t("Welcome Back! 👋")}</h1>
                    <p className="text-[#AFBD96] text-lg">{t("Choose a deck to start learning. 💪")}</p>
                </div>
                <div className="flex items-center relative" ref={searchRef}>
                    {/* Streak Icon and Counter */}
                    <button
                        className="flex items-center p-2 rounded-full transition-colors mr-2 group cursor-pointer"
                        aria-label={t("Streak")} // Placeholder label
                        onClick={() => { /* No logic required yet */ }}
                    >
                        <i className={`fas fa-fire text-xl transition-all duration-200 ease-in-out ${streakValue > 0 ? 'text-red-500 group-hover:text-red-600 group-hover:drop-shadow-vibrant-red-glow' : 'text-gray-500'}`}></i>
                        <span className={`ml-1 text-lg transition-all duration-200 ease-in-out ${streakValue > 0 ? 'font-bold text-red-500 group-hover:text-red-600' : 'text-gray-500 group-hover:text-black group-hover:font-bold'}`}>{streakValue}</span>
                    </button>

                    {!isSearchExpanded ? (
                        <>
                            {/* Search Button */}
                            <button
                                onClick={() => setIsSearchExpanded(true)}
                                className="p-2 rounded-full text-[#AFBD96] hover:text-[#56A652] transition-colors"
                                aria-label={t("Search decks...")}
                            >
                                <i className="fas fa-search text-xl"></i>
                            </button>
                        </>
                    ) : (
                        <div className="relative">
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
                        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    {filteredDecks.map(deck => (
                        <div key={deck.id} onClick={() => openModeModal(deck)} className="bg-white dark:bg-[#344E41] rounded-xl shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40] overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 relative cursor-pointer">
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/manage-words/${deck.id}`); }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-gray-200 dark:bg-[#446843] text-[#121e18] dark:text-white hover:bg-gray-300 dark:hover:bg-[#56A652] transition-colors duration-200"
                                aria-label={t("Edit Deck")}
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <div className="px-6 pt-6 pb-2">
                                <h2 className="text-2xl font-bold text-[#121e18] dark:text-white h-18 line-clamp-2 break-words text-start">{deck.name}</h2>
                                <p className="text-[#AFBD96] text-sm mb-2">{getTermsForDeck(deck.id).length} {t("cards")}</p>
                                {deck.created_at && (
                                    <p className="text-[#AFBD96] text-sm mb-0">
                                        {t("Created at")}: {new Date(deck.created_at).toLocaleDateString('en-GB')}
                                    </p>
                                )}
                                {/* Last Studied Date - Real Data */}
                                <p className="text-[#AFBD96] text-sm mb-2">
                                    {t("Last studied")}: {(() => {
                                        if (!deck.last_studied) return t("Not studied yet");
                                        const now = new Date();
                                        const studied = new Date(deck.last_studied);
                                        const diffMs = now.getTime() - studied.getTime();
                                        const diffMinutes = Math.floor(diffMs / (1000 * 60));
                                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                                        if (diffMinutes < 5) return t("Just now");
                                        if (diffMinutes < 60) return t("{0} minutes ago", diffMinutes);
                                        if (diffHours < 24) return diffHours === 1 ? t("1 hour ago") : t("{0} hours ago", diffHours);
                                        if (diffDays <= 3) return diffDays === 1 ? t("1 day ago") : t("{0} days ago", diffDays);
                                        return studied.toLocaleDateString('en-GB');
                                    })()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
