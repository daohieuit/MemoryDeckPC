import React from 'react';
import { Deck, GameMode } from '../types';
import { BookOpenIcon, PencilIcon, PuzzlePieceIcon, QuestionMarkCircleIcon } from './icons/Icons';
import { useLanguage } from '../hooks/useLanguage';
import { useWords } from '../hooks/useWords';

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

interface LearningModeSelectorProps {
    deck: Deck;
    handleStart: (deckId: number, mode: GameMode) => void;
    onClose: () => void;
}

export const LearningModeSelector: React.FC<LearningModeSelectorProps> = ({ deck, handleStart, onClose }) => {
    const { t } = useLanguage();
    const { getTermsForDeck } = useWords();
    const totalCards = getTermsForDeck(deck.id).length;

    const onModeSelect = (mode: GameMode) => {
        handleStart(deck.id, mode);
        onClose(); // Close modal after selection
    };

    return (
        <div className="p-4">
            <div className="flex flex-col items-start mb-4">
                <p className="text-[#AFBD96] text-sm mb-1">{totalCards} {t("cards")}</p>
                {deck.created_at && (
                    <p className="text-[#AFBD96] text-sm mb-0">
                        {t("Created at")}: {new Date(deck.created_at).toLocaleDateString('en-GB')}
                    </p>
                )}
                {/* Placeholder for Last Studied Date - UI Only */}
                {true && ( // Always render for UI only
                    <p className="text-[#AFBD96] text-sm mb-2">
                        {t("Last studied")}: {new Date('2024-02-17T10:00:00Z').toLocaleDateString('en-GB')} {/* Example date */}
                    </p>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <ModeButton onClick={() => onModeSelect(GameMode.Flashcard)} icon={<BookOpenIcon />} label={t("Flashcard")} />
                <ModeButton onClick={() => onModeSelect(GameMode.Quiz)} icon={<QuestionMarkCircleIcon />} label={t("Quiz")} />
                <ModeButton onClick={() => onModeSelect(GameMode.Matching)} icon={<PuzzlePieceIcon />} label={t("Ghép từ")} />
                <ModeButton onClick={() => onModeSelect(GameMode.Spelling)} icon={<PencilIcon />} label={t("Chính tả")} />
            </div>
        </div>
    );
};