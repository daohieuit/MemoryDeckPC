import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { Deck, GameMode } from '../types';
import { PencilIcon } from './icons/Icons';
import { useModal } from '../hooks/useModal';
import { LearningModeSelector } from './LearningModeSelector';
import { SnowfallEffect } from './SnowfallEffect';
import { DeckModalContent } from './DeckModalContent';

export const Home: React.FC = () => {
    const { decks, getTermsForDeck, progress } = useWords();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false); // New state for search bar
    const searchRef = useRef<HTMLDivElement>(null); // Ref for click-outside
    const [streakValue, setStreakValue] = useState(5); // Simulate a streak for UI purposes
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [currentSortKey, setCurrentSortKey] = useState('name'); // Default sort key
    const [currentSortDirection, setCurrentSortDirection] = useState('asc'); // Default direction for all (Ascending)
    const sortDropdownRef = useRef<HTMLDivElement>(null);
    const [isSnowfallActive, setIsSnowfallActive] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);

    const handleFabClick = () => {
        if (!isCooldown) {
            setIsSnowfallActive(true);
            setIsCooldown(true);
            setTimeout(() => {
                setIsSnowfallActive(false);
                setIsCooldown(false);
            }, 10000);
        }
    };

    const { showModal, hideModal } = useModal();

    // Helper to get next review status for a deck (similar to WordListManager)
    const getDeckStatus = (deckId: number): { text: string; isDue: boolean } => {
        const terms = getTermsForDeck(deckId);
        if (terms.length === 0) {
            return { text: "", isDue: false };
        }

        const now = new Date();
        let earliestDue: Date | null = null;
        let hasDueCards = false;

        for (const term of terms) {
            const termProgress = progress.find(p => p.term_id === term.id);
            // If no progress exists, this is a new card - it's due now
            if (!termProgress) {
                hasDueCards = true;
                earliestDue = now;
                continue;
            }

            const dueDate = new Date(termProgress.due);
            if (dueDate <= now) {
                hasDueCards = true;
                if (!earliestDue || dueDate < earliestDue) {
                    earliestDue = dueDate;
                }
            } else if (!hasDueCards) {
                if (!earliestDue || dueDate < earliestDue) {
                    earliestDue = dueDate;
                }
            }
        }

        if (!earliestDue) {
            return { text: "", isDue: false };
        }

        const diffMs = earliestDue.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (hasDueCards) {
            if (diffMinutes <= 0) return { text: "Now", isDue: true };
            if (diffMinutes < 60) return { text: `${diffMinutes}m`, isDue: true };
            if (diffHours < 24) return { text: `${diffHours}h`, isDue: true };
            if (diffDays <= 3) return { text: `${diffDays}d`, isDue: true };
            return { text: earliestDue.toLocaleDateString('en-GB'), isDue: true };
        } else {
            if (diffMinutes < 60 && diffMinutes > 0) return { text: `${diffMinutes}m`, isDue: false };
            if (diffHours < 24) return { text: `${diffHours}h`, isDue: false };
            if (diffDays === 1) return { text: "1d", isDue: false };
            if (diffDays <= 7) return { text: `${diffDays}d`, isDue: false };
            return { text: earliestDue.toLocaleDateString('en-GB'), isDue: false };
        }
    };

    const SORT_OPTIONS = [
        {
            key: 'name',
            label: t('Name'),
            defaultDirection: 'asc',
        },
        {
            key: 'last-studied',
            label: t('Last Studied'),
            defaultDirection: 'asc',
        },
        {
            key: 'created-at',
            label: t('Created At'),
            defaultDirection: 'asc',
        },
    ];

    const handleSortOptionClick = (option: typeof SORT_OPTIONS[0]) => {
        if (option.key === currentSortKey) {
            // If the same option is clicked, toggle direction
            setCurrentSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            // If a new option is clicked, set it as current and use its default direction (always 'asc' now)
            setCurrentSortKey(option.key);
            setCurrentSortDirection('asc');
        }
        setIsSortDropdownOpen(false);
    };
    const handleStart = (deckId: number, mode: GameMode) => {
        navigate(`/learn/${deckId}/${mode}`);
    };

    const openModeModal = (deck: Deck) => {
        const handleEditDeck = () => {
            navigate(`/manage-words/${deck.id}`);
            hideModal(); // Close modal after navigating
        };

        // Calculate next review status for badge
        const getNextReviewStatus = (deckId: number): { text: string; isDue: boolean } => {
            const terms = getTermsForDeck(deckId);
            if (terms.length === 0) {
                return { text: "", isDue: false };
            }

            const now = new Date();
            let earliestDue: Date | null = null;
            let hasDueCards = false;

            for (const term of terms) {
                const termProgress = progress.find(p => p.term_id === term.id);
                if (!termProgress) {
                    hasDueCards = true;
                    earliestDue = now;
                    continue;
                }

                const dueDate = new Date(termProgress.due);
                if (dueDate <= now) {
                    hasDueCards = true;
                    if (!earliestDue || dueDate < earliestDue) {
                        earliestDue = dueDate;
                    }
                } else if (!hasDueCards) {
                    if (!earliestDue || dueDate < earliestDue) {
                        earliestDue = dueDate;
                    }
                }
            }

            if (!earliestDue) {
                return { text: "", isDue: false };
            }

            const diffMs = earliestDue.getTime() - now.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (hasDueCards) {
                if (diffMinutes <= 0) return { text: "Now", isDue: true };
                if (diffMinutes < 60) return { text: `${diffMinutes}m`, isDue: true };
                if (diffHours < 24) return { text: `${diffHours}h`, isDue: true };
                if (diffDays <= 3) return { text: `${diffDays}d`, isDue: true };
                return { text: earliestDue.toLocaleDateString('en-GB'), isDue: true };
            } else {
                if (diffMinutes < 60 && diffMinutes > 0) return { text: `${diffMinutes}m`, isDue: false };
                if (diffHours < 24) return { text: `${diffHours}h`, isDue: false };
                if (diffDays === 1) return { text: "1d", isDue: false };
                if (diffDays <= 7) return { text: `${diffDays}d`, isDue: false };
                return { text: earliestDue.toLocaleDateString('en-GB'), isDue: false };
            }
        };

        const nextReview = getNextReviewStatus(deck.id);
        const nextReviewBadge = nextReview.text ? (
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap ${
                nextReview.isDue ? 'bg-[#EE4266] text-white' : 'bg-[#56A652] text-white'
            }`}>
                {nextReview.text}
            </div>
        ) : null;

        const editButton = (
            <button
                onClick={handleEditDeck}
                className="text-sm text-[#AFBD96] hover:text-[#56A652] transition-colors flex items-center gap-1 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#446843]"
                aria-label={t("Edit Deck")}
            >
                <PencilIcon className="w-4 h-4" />
            </button>
        );

        const handleOpenCardList = () => {
            hideModal();
            showModal({
                title: t("Cards in: {0}", deck.name),
                size: 'lg',
                message: (
                    <DeckModalContent
                        deckId={deck.id}
                        mode="manage-cards"
                        onClose={hideModal}
                        onSaved={() => {
                            showToast({ message: t("Cards updated successfully!") });
                        }}
                    />
                ),
            });
        };

        showModal({
            title: deck.name,
            message: <LearningModeSelector deck={deck} handleStart={handleStart} onClose={hideModal} onOpenCardList={handleOpenCardList} />,
            headerButtons: [nextReviewBadge, editButton].filter(Boolean) as React.ReactNode[],
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

    // Effect for handling clicks outside the search bar and sort dropdown to collapse them
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchExpanded(false);
                setSearchTerm(''); // Clear search when collapsing
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef, sortDropdownRef]);


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

            {/* Sort Dropdown */}
            <div className="flex justify-start mb-4 relative" ref={sortDropdownRef}>
                <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center p-1.5 rounded-full text-[#AFBD96] hover:text-[#56A652] transition-colors hover:bg-gray-200 dark:hover:bg-[#446843]"
                    aria-label={t("Sort decks")}
                >
                    <i className="fa-solid fa-arrow-down-wide-short text-xl"></i>
                </button>

                {isSortDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 mt-2 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-xl border border-[#EDE9DE] dark:border-[#3A5A40] overflow-hidden backdrop-blur-md">
                        {SORT_OPTIONS.map((option) => (
                            <button
                                key={option.key}
                                onClick={() => handleSortOptionClick(option)}
                                className={`flex items-center justify-between w-full text-left px-4 py-2 transition-colors ${currentSortKey === option.key ? 'bg-[#56A652] text-white font-bold' : 'text-[#121e18] dark:text-white hover:bg-[#E0E0E0] dark:hover:bg-[#446843]'}`}
                            >
                                {option.label}
                                {currentSortKey === option.key && (
                                    <i className={`${currentSortDirection === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'} text-lg ml-2`}></i>
                                )}
                            </button>
                        ))}
                    </div>
                )}
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
                    {filteredDecks.map(deck => {
                        const deckStatus = getDeckStatus(deck.id);
                        return (
                        <div key={deck.id} onClick={() => openModeModal(deck)} className="bg-white dark:bg-[#344E41] rounded-xl shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40] overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 relative cursor-pointer">
                            {deckStatus.text && (
                                <div className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${deckStatus.isDue ? 'bg-[#EE4266] text-white' : 'bg-[#56A652] text-white'}`}>
                                    {deckStatus.text}
                                </div>
                            )}
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
                            <div className="px-6 pb-6 pt-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/learn/${deck.id}/study`); }}
                                    className="w-full bg-[#56A652] text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_0_rgb(67,130,64)] hover:shadow-[0_2px_0_rgb(67,130,64)] hover:translate-y-[2px] transition-all duration-150 active:shadow-none active:translate-y-[4px] focus:outline-none focus:ring-2 focus:ring-[#56A652] focus:ring-opacity-75"
                                >
                                    {t("Study")}
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={handleFabClick}
                className="fixed bottom-6 right-6 bg-[#124170] text-white font-bold py-2 px-6 rounded-xl shadow-[0_6px_0_rgb(0,35,82)] ring-2 ring-[#124170] ring-opacity-40 hover:shadow-[0_3px_0_rgb(0,35,82)] hover:ring-opacity-60 hover:translate-y-[3px] active:shadow-none active:ring-0 active:translate-y-[6px] transition-all duration-150 whitespace-nowrap z-50"
                aria-label={t("Quick Action")}
            >
                {t("Click me")}
            </button>

            {isSnowfallActive && <SnowfallEffect duration={10000} onEnd={() => setIsSnowfallActive(false)} />}
        </div>
    );
};
