import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { GearIcon } from './icons/Icons';

interface GetReadyViewProps {
    deckName: string;
    totalCards: number;
    modeName: string;
    onStart: () => void;
    onCancel: () => void;
    onSettings?: () => void;
}

export const GetReadyView: React.FC<GetReadyViewProps> = ({ deckName, totalCards, modeName, onStart, onCancel, onSettings }) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] w-full max-w-lg mx-auto p-4">
            <div className="relative w-full bg-white dark:bg-[#344E41] rounded-3xl p-12 shadow-xl border border-[#EDE9DE] dark:border-[#3A5A40] text-center transform transition-all">
                {/* Settings Button */}
                {onSettings && (
                    <button
                        onClick={onSettings}
                        className="absolute top-6 right-6 p-2 rounded-xl bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-all shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] active:scale-95 duration-150"
                        title={t("Settings")}
                    >
                        <GearIcon className="w-6 h-6" />
                    </button>
                )}

                {/* Card Count */}
                <div className="mb-6">
                    <div className="text-6xl font-black text-[#121e18] dark:text-white mb-2">{totalCards}</div>
                    <div className="text-[#AFBD96] uppercase tracking-[0.2em] text-sm font-bold">{t("Cards to study")}</div>
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                    <button
                        onClick={onStart}
                        className="w-full py-5 rounded-2xl bg-[#56A652] text-white font-black text-2xl shadow-[0_8px_0_rgb(67,130,64)] hover:shadow-[0_4px_0_rgb(67,130,64)] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] active:scale-95 transition-all duration-150 flex items-center justify-center gap-3"
                    >
                        <i className="fas fa-play text-xl"></i>
                        {t("Start")}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-4 rounded-2xl text-[#AFBD96] font-bold text-lg hover:text-[#EE4266] active:scale-95 transition-all duration-150"
                    >
                        {t("Cancel")}
                    </button>
                </div>
            </div>

            {/* Soft decorative background elements for Claymorphism feel */}
            <div className="fixed top-1/4 -left-20 w-64 h-64 bg-[#56A652]/5 rounded-full blur-3xl -z-10"></div>
            <div className="fixed bottom-1/4 -right-20 w-64 h-64 bg-[#FFD23F]/5 rounded-full blur-3xl -z-10"></div>
        </div>
    );
};
