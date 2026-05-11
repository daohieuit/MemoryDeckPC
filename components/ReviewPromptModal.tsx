import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Rating } from 'ts-fsrs';

interface ReviewPromptModalProps {
    againCount: number;
    hardCount: number;
    goodCount: number;
    easyCount: number;
    totalCards: number;
    onReview: () => void;
    onFinish: () => void;
}

export const ReviewPromptModal: React.FC<ReviewPromptModalProps> = ({
    againCount,
    hardCount,
    goodCount,
    easyCount,
    totalCards,
    onReview,
    onFinish
}) => {
    const { t } = useLanguage();

    const struggledCount = againCount + hardCount;

    return (
        <div className="flex flex-col w-full max-w-md mx-auto p-4">
            <h2 className="text-3xl font-bold text-[#121e18] dark:text-white mb-6 text-center">
                {t("Round Complete!")}
            </h2>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-red-100 dark:bg-red-900/30 rounded-2xl p-4 text-center border-2 border-red-300 dark:border-red-700">
                    <p className="text-3xl font-black text-red-600 dark:text-red-400 mb-1">{againCount}</p>
                    <p className="text-sm font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">{t("Again")}</p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-2xl p-4 text-center border-2 border-orange-300 dark:border-orange-700">
                    <p className="text-3xl font-black text-orange-600 dark:text-orange-400 mb-1">{hardCount}</p>
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">{t("Hard")}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-2xl p-4 text-center border-2 border-green-300 dark:border-green-700">
                    <p className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">{goodCount}</p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">{t("Good")}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-2xl p-4 text-center border-2 border-blue-300 dark:border-blue-700">
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">{easyCount}</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">{t("Easy")}</p>
                </div>
            </div>

            <p className="text-center text-[#AFBD96] mb-8 font-bold">
                {t("Total")}: {totalCards} {t("cards")}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
                {struggledCount > 0 ? (
                    <button
                        onClick={onReview}
                        className="w-full py-4 rounded-2xl bg-[#56A652] text-white font-bold text-xl shadow-[0_8px_0_rgb(67,130,64)] hover:shadow-[0_4px_0_rgb(67,130,64)] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-redo"></i>
                        {t("Review")} ({struggledCount})
                    </button>
                ) : (
                    <button
                        disabled
                        className="w-full py-4 rounded-2xl bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-bold text-xl cursor-not-allowed"
                    >
                        {t("All cards mastered!")}
                    </button>
                )}
                <button
                    onClick={onFinish}
                    className="w-full py-4 rounded-2xl text-[#AFBD96] font-bold text-lg hover:text-[#EE4266] active:scale-95 transition-all duration-150"
                >
                    {t("Finish")}
                </button>
            </div>
        </div>
    );
};
