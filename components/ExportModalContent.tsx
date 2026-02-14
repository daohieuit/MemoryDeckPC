
import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useModal } from '../hooks/useModal';
import { useWords } from '../hooks/useWords';

enum ExportStep {
    Initial,
    SelectDecks,
}

const ExportModalContent: React.FC = () => {
    const { t } = useLanguage();
    const { hideModal } = useModal();
    const { decks } = useWords();
    const [currentStep, setCurrentStep] = useState<ExportStep>(ExportStep.Initial);
    const [selectedDecks, setSelectedDecks] = useState<number[]>([]);
    const [selectAllDecks, setSelectAllDecks] = useState(false);

    const handleExportAll = () => {
        // Placeholder for actual export all logic
        console.log('Exporting all data');
        hideModal();
    };

    const handleExportDecksOnly = () => {
        setCurrentStep(ExportStep.SelectDecks);
    };

    const handleSelectSaveLocation = () => {
        // Placeholder for opening file dialog
        console.log('Selecting save location for decks:', selectedDecks);
        hideModal();
    };

    const handleDeckSelection = (deckId: number, isChecked: boolean) => {
        if (isChecked) {
            setSelectedDecks(prev => [...prev, deckId]);
        } else {
            setSelectedDecks(prev => prev.filter(id => id !== deckId));
        }
        setSelectAllDecks(false); // Uncheck "All Decks" if individual deck is toggled
    };

    const handleSelectAllDecks = (isChecked: boolean) => {
        setSelectAllDecks(isChecked);
        if (isChecked) {
            setSelectedDecks(decks.map(deck => deck.id));
        } else {
            setSelectedDecks([]);
        }
    };

    const renderInitialView = () => (
        <div className="flex flex-col gap-3 mt-4">
            <button
                onClick={handleExportAll}
                className="w-full text-left px-4 py-3 rounded-md text-[#1A2B22] dark:text-[#F1F5F9] bg-[#e8e5da] dark:bg-[#446843] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors font-medium"
                title={t("Export the entire database.")}
            >
                {t("Export All")}
            </button>
            <button
                onClick={handleExportDecksOnly}
                className="w-full text-left px-4 py-3 rounded-md text-[#1A2B22] dark:text-[#F1F5F9] bg-[#e8e5da] dark:bg-[#446843] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors font-medium"
                title={t("Choose one or more specific decks to export.")}
            >
                {t("Export Decks Only")}
            </button>
        </div>
    );

    const renderSelectDecksView = () => (
        <div className="flex flex-col gap-4 mt-4">
            <h3 className="text-lg font-semibold text-[#1A2B22] dark:text-[#F1F5F9]">{t("Select Decks to Export")}</h3>
            <div className="bg-[#e8e5da] dark:bg-[#446843] rounded-md p-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-[#56A652] rounded focus:ring-[#56A652] border-gray-300 dark:border-gray-600 dark:bg-[#344E41]"
                        checked={selectAllDecks}
                        onChange={(e) => handleSelectAllDecks(e.target.checked)}
                    />
                    <span className="text-[#1A2B22] dark:text-[#F1F5F9] font-medium">{t("All Decks")}</span>
                </label>
            </div>
            <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {decks.map(deck => (
                    <div key={deck.id} className="flex items-center justify-between py-2 pl-6 border-b border-[#EDE9DE] dark:border-[#3A4E40]/50 last:border-b-0">
                        <label className="flex items-center space-x-2 cursor-pointer w-full">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-[#56A652] rounded focus:ring-[#56A652] border-gray-300 dark:border-gray-600 dark:bg-[#344E41]"
                                checked={selectedDecks.includes(deck.id)}
                                onChange={(e) => handleDeckSelection(deck.id, e.target.checked)}
                                disabled={selectAllDecks} // Disable individual selection if "All Decks" is checked
                            />
                            <span className={`text-[#1A2B22] dark:text-[#F1F5F9] ${selectAllDecks ? 'opacity-60' : ''}`}>{deck.name}</span>
                        </label>
                    </div>
                ))}
            </div>
            <button
                onClick={handleSelectSaveLocation}
                disabled={selectedDecks.length === 0 && !selectAllDecks}
                className="w-full px-4 py-3 rounded-md text-white font-bold bg-[#56A652] hover:brightness-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {t("Select Save Location")}
            </button>
        </div>
    );

    return (
        <div className="modal-content animate-fade-in-fast"> {/* Added for animation */}
            {currentStep === ExportStep.Initial && renderInitialView()}
            {currentStep === ExportStep.SelectDecks && renderSelectDecksView()}
        </div>
    );
};

export default ExportModalContent;
