import React from 'react';
import { Deck, GameMode } from '../types';
import { BookOpenIcon, PencilIcon, PuzzlePieceIcon, QuestionMarkCircleIcon, SparklesIcon, ChevronDownIcon } from './icons/Icons';
import { useLanguage } from '../hooks/useLanguage';
import { useWords } from '../hooks/useWords';

interface ModeButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    primary?: boolean;
}

const ModeButton: React.FC<ModeButtonProps> = ({ onClick, icon, label, primary }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#56A652] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#344E41] ${
            primary 
            ? 'bg-[#56A652] text-white hover:brightness-110 shadow-lg' 
            : 'bg-[#e8e5da] dark:bg-[#446843] text-[#121e18] dark:text-[#F1F5F9] hover:bg-[#56A652] hover:text-white'
        }`}
    >
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);

interface LearningModeSelectorProps {
    deck: Deck;
    handleStart: (deckId: number, mode: GameMode) => void;
    onClose: () => void;
    onOpenCardList?: () => void;
}

export const LearningModeSelector: React.FC<LearningModeSelectorProps> = ({ deck, handleStart, onClose, onOpenCardList }) => {
    const { t } = useLanguage();
    const { getTermsForDeck } = useWords();
    const totalCards = getTermsForDeck(deck.id).length;

    const onModeSelect = (mode: GameMode) => {
        handleStart(deck.id, mode);
        onClose(); // Close modal after selection
    };

    return (
        <div className="p-4">
            <div className="bg-[#F8F9FA] dark:bg-[#3A5A40]/30 rounded-2xl p-5 mb-6 border border-[#EDE9DE] dark:border-[#3A5A40]">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-[#AFBD96] uppercase tracking-wider mb-1">{t("Total Cards")}</p>
                            <p className="text-2xl font-bold text-[#121e18] dark:text-white">{totalCards}</p>
                        </div>
                        {deck.created_at && (
                            <div>
                                <p className="text-[10px] font-bold text-[#AFBD96] uppercase tracking-wider mb-1">{t("Created")}</p>
                                <p className="text-sm font-medium text-[#121e18] dark:text-white">
                                    {new Date(deck.created_at).toLocaleDateString('en-GB')}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-[#AFBD96] uppercase tracking-wider mb-1">{t("Last Studied")}</p>
                            <p className="text-sm font-medium text-[#121e18] dark:text-white">
                                {deck.last_studied ? (() => {
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
                                })() : t("Not studied yet")}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Show more information link */}
                <div className="mt-4 pt-3 border-t border-[#EDE9DE] dark:border-[#3A5A40]/50">
                    <button
                        onClick={() => {
                            if (onOpenCardList) {
                                onClose();
                                onOpenCardList();
                            }
                        }}
                        className="text-xs text-[#56A652] hover:text-[#124170] hover:underline flex items-center gap-1 transition-colors font-medium"
                    >
                        {t("Show more information")}
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <p className="text-xs font-bold text-[#AFBD96] uppercase mb-2 tracking-wider">{t("Recommended")}</p>
                <ModeButton 
                    onClick={() => onModeSelect(GameMode.Study)} 
                    icon={<SparklesIcon className="w-6 h-6" />} 
                    label={t("Smart Study Session")} 
                    primary
                />
            </div>

            <div className="mb-2">
                <p className="text-xs font-bold text-[#AFBD96] uppercase mb-2 tracking-wider">{t("Independent Modes")}</p>
                <div className="grid grid-cols-2 gap-3">
                    <ModeButton onClick={() => onModeSelect(GameMode.Flashcard)} icon={<BookOpenIcon />} label={t("Flashcard")} />
                    <ModeButton onClick={() => onModeSelect(GameMode.Matching)} icon={<PuzzlePieceIcon />} label={t("Ghép từ")} />
                    <ModeButton onClick={() => onModeSelect(GameMode.Quiz)} icon={<QuestionMarkCircleIcon />} label={t("Quiz")} />
                    <ModeButton onClick={() => onModeSelect(GameMode.Spelling)} icon={<PencilIcon />} label={t("Chính tả")} />
                </div>
            </div>
        </div>
    );
};