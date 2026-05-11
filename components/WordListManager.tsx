
import React, { useState, useCallback, useEffect } from 'react';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { Term } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

import { SparklesIcon, PencilIcon } from './icons/Icons';
import { useModal } from '../hooks/useModal';
import { GameMode } from '../types';
import { LearningModeSelector } from './LearningModeSelector';
import { SnowfallEffect } from './SnowfallEffect';
import { DeckModalContent } from './DeckModalContent';







export const WordListManager: React.FC = () => {
    const { decks, addDeck, renameDeck, deleteDeck, getTermsForDeck, progress } = useWords();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const { showModal, hideModal } = useModal();
    const { deckId: paramDeckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const gridRef = React.useRef<HTMLDivElement>(null);
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

    // Helper to get next review status for a deck
    const getNextReviewStatus = (deckId: number): { text: string; isDue: boolean } => {
        const terms = getTermsForDeck(deckId);
        if (terms.length === 0) {
            return { text: t("No cards"), isDue: false };
        }

        const now = new Date();
        let earliestDue: Date | null = null;
        let hasDueCards = false;

        for (const term of terms) {
            const termProgress = progress.find(p => p.term_id === term.id);
            // If no progress exists, this is a new card - it's due now
            if (!termProgress) {
                hasDueCards = true;
                // New cards are due immediately, so earliestDue is now
                earliestDue = now;
                continue;
            }

            const dueDate = new Date(termProgress.due);
            if (dueDate <= now) {
                hasDueCards = true;
                // Keep track of the most overdue
                if (!earliestDue || dueDate < earliestDue) {
                    earliestDue = dueDate;
                }
            } else if (!hasDueCards) {
                // No due cards yet, track earliest upcoming
                if (!earliestDue || dueDate < earliestDue) {
                    earliestDue = dueDate;
                }
            }
        }

        if (!earliestDue) {
            return { text: t("No cards"), isDue: false };
        }

        const diffMs = earliestDue.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let text: string;
        if (hasDueCards) {
            // Card is due or overdue (including new cards with no progress)
            if (diffMinutes <= 0) return { text: t("Now"), isDue: true };
            if (diffMinutes < 60) return { text: t("In {0}m", diffMinutes), isDue: true };
            if (diffHours < 24) return { text: t("In {0}h", diffHours), isDue: true };
            if (diffDays <= 3) return { text: t("In {0}d", diffDays), isDue: true };
            return { text: earliestDue.toLocaleDateString('en-GB'), isDue: true };
        } else {
            // Upcoming review
            if (diffMinutes < 60 && diffMinutes > 0) return { text: t("In {0}m", diffMinutes), isDue: false };
            if (diffHours < 24) return { text: t("In {0}h", diffHours), isDue: false };
            if (diffDays === 1) return { text: t("Tomorrow"), isDue: false };
            if (diffDays <= 7) return { text: t("In {0}d", diffDays), isDue: false };
            return { text: earliestDue.toLocaleDateString('en-GB'), isDue: false };
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const initialDeckId = paramDeckId ? parseInt(paramDeckId) : null;

    const [expandedDeckId, setExpandedDeckId] = useState<number | null>(initialDeckId);
    const [newlyCreatedDeckId, setNewlyCreatedDeckId] = useState<number | null>(null);

    // If a deckId is provided in the URL, ensure it's expanded
    useEffect(() => {
        if (initialDeckId && !expandedDeckId) {
            setExpandedDeckId(initialDeckId);
        }
    }, [initialDeckId]);

    const openCreateDeckModal = () => {
        showModal({
            title: t("Create New Deck"),
            size: 'lg',
            message: <DeckModalContent 
                onClose={hideModal} 
                onSaved={(newId) => {
                    setExpandedDeckId(newId);
                    setNewlyCreatedDeckId(newId);
                    showToast({ message: t("Deck created successfully!") });
                }} 
            />
        });
    };

    const openEditDeckModal = (e: React.MouseEvent, deckId: number) => {
        e.stopPropagation();
        showModal({
            title: t("Edit Deck"),
            size: 'lg',
            message: <DeckModalContent 
                deckId={deckId}
                onClose={hideModal} 
                onSaved={() => {
                    showToast({ message: t("Deck updated successfully!") });
                }} 
            />
        });
    };


    const handleStart = (deckId: number, mode: GameMode) => {
        navigate(`/learn/${deckId}/${mode}`);
    };

    const openModeModal = (deck: any) => {
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
                onClick={() => {
                    navigate(`/manage-words/${deck.id}`);
                    hideModal();
                }}
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

    const toggleDeck = (id: number) => {
        setNewlyCreatedDeckId(null);
        setExpandedDeckId(prevId => prevId === id ? null : id);
    };

    // Keep click-outside logic for general UI robustness, though less critical now
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (expandedDeckId && gridRef.current && !gridRef.current.contains(event.target as Node)) {
                // If the click is outside the entire grid container, collapse
                setExpandedDeckId(null);
            } else if (expandedDeckId) {
                // If the click is inside the grid, check if it's outside the specifically expanded card
                const expandedCard = document.querySelector(`[data-deck-id="${expandedDeckId}"]`);
                if (expandedCard && !expandedCard.contains(event.target as Node)) {
                    setExpandedDeckId(null);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [expandedDeckId]);

    const filteredDecks = decks.filter(deck =>
        deck.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#121e18] dark:text-white mb-4">{t("Manage My Decks")}</h1>
                    <p className="text-[#AFBD96] text-lg">{t("Organize and refine your learning materials. 📚")}</p>
                </div>
                <button
                    onClick={openCreateDeckModal}
                    className="bg-[#56A652] text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-1"
                >
                    <SparklesIcon className="w-6 h-6" />
                    <span className="text-lg">{t("Create Deck")}</span>
                </button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-baseline">
                    <h2 className="text-2xl font-bold text-[#121e18] dark:text-white">{t("My Decks")}</h2>
                    <span className="text-[#AFBD96] text-lg ml-2">({decks.length} {t("decks")})</span>
                </div>
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder={t("Search decks...")}
                        className="w-full py-2.5 pl-11 pr-11 rounded-xl bg-white dark:bg-[#344E41] border border-[#EDE9DE] dark:border-[#3A5A40] text-[#121e18] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#56A652] text-sm shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#AFBD96] text-lg"></i>
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AFBD96] hover:text-[#EE4266] transition-colors"
                            aria-label={t("Clear search")}
                        >
                            <i className="fas fa-times text-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            {filteredDecks.length === 0 && decks.length > 0 && (
                <div className="text-center text-[#AFBD96] text-lg mt-8">
                    {t("No decks found matching your search.")}
                </div>
            )}
            
            {decks.length === 0 && (
                <div className="text-center bg-white dark:bg-[#344E41] p-12 rounded-2xl border border-[#EDE9DE] dark:border-[#3A5A40] shadow-xl">
                    <h2 className="text-2xl font-bold mb-4">{t("No Decks Yet")}</h2>
                    <p className="text-[#AFBD96] mb-8">{t("Get started by creating your very first flashcard deck.")}</p>
                    <button
                        onClick={openCreateDeckModal}
                        className="bg-[#56A652] text-white font-bold py-3 px-8 rounded-xl hover:brightness-110 shadow-lg transition-all"
                    >
                        {t("Create a Deck")}
                    </button>
                </div>
            )}

            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {filteredDecks.map(deck => (
                    <div
                        key={deck.id}
                        data-deck-id={deck.id}
                        onClick={() => openModeModal(deck)}
                        className={`bg-white dark:bg-[#344E41] rounded-xl shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40] overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer`}
                    >
                        <div className="p-6 flex flex-col h-full relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h3 className="text-2xl font-bold text-[#121e18] dark:text-white line-clamp-2 break-words mb-2">{deck.name}</h3>
                                    <p className="text-[#AFBD96] text-sm font-semibold mb-2">{getTermsForDeck(deck.id).length} {t("cards")}</p>
                                    <div className="space-y-1 text-xs">
                                        <p className="text-[#AFBD96]">
                                            {t("Created")}: <span className="text-[#121e18] dark:text-white/80 font-medium">{new Date(deck.created_at).toLocaleDateString('en-GB')}</span>
                                        </p>
                                        <p className="text-[#AFBD96]">
                                            {t("Last studied")}: <span className="text-[#121e18] dark:text-white/80 font-medium">
                                                {(() => {
                                                    if (!deck.last_studied) return t("Not studied yet");
                                                    const now = new Date();
                                                    const studied = new Date(deck.last_studied);
                                                    const diffMs = now.getTime() - studied.getTime();
                                                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                                                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                                                    if (diffMinutes < 5) return t("Just now");
                                                    if (diffMinutes < 60) return t("{0}m ago", diffMinutes);
                                                    if (diffHours < 24) return t("{0}h ago", diffHours);
                                                    if (diffDays <= 3) return t("{0}d ago", diffDays);
                                                    return studied.toLocaleDateString('en-GB');
                                                })()}
                                            </span>
                                        </p>
                                        {(() => {
                                            const nextReview = getNextReviewStatus(deck.id);
                                            const colorClass = nextReview.isDue ? 'text-[#EE4266]' : 'text-[#56A652]';
                                            return (
                                                <p className={`text-[#AFBD96]`}>
                                                    {t("Next review")}: <span className={`font-medium ${colorClass}`}>{nextReview.text}</span>
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button
                                        onClick={(e) => openEditDeckModal(e, deck.id)}
                                        className="w-10 h-10 rounded-full transition-all flex items-center justify-center text-[#56A652] bg-[#56A652]/10 hover:bg-[#56A652]/20 border border-[#56A652]/20 shadow-sm"
                                        aria-label={t("Edit deck")}
                                        title={t("Edit Deck")}
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                                        className="w-10 h-10 rounded-full transition-all flex items-center justify-center text-[#EE4266] bg-[#EE4266]/10 hover:bg-[#EE4266]/20 border border-[#EE4266]/20 shadow-sm"
                                        aria-label={t("Delete deck")}
                                        title={t("Delete Deck")}
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/learn/${deck.id}/study`); }}
                                className="w-full bg-[#56A652] text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_0_rgb(67,130,64)] hover:shadow-[0_2px_0_rgb(67,130,64)] hover:translate-y-[2px] transition-all duration-150 active:shadow-none active:translate-y-[4px] focus:outline-none focus:ring-2 focus:ring-[#56A652] focus:ring-opacity-75"
                            >
                                {t("Study")}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
