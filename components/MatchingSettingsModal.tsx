import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowPathIcon } from './icons/Icons';

export type DifficultyType = 4 | 5 | 6;

export interface MatchingSettings {
    difficulty: DifficultyType;
    showTimer: boolean;
}

interface MatchingSettingsModalProps {
    settings: MatchingSettings;
    onUpdate: (settings: MatchingSettings) => void;
    onReset: () => void;
    onClose: () => void;
    showHeader?: boolean;
}

const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-[250ms] ease-in-out focus:outline-none shadow-inner ${
            enabled ? 'bg-[#56A652]' : 'bg-[#e8e5da] dark:bg-[#446843]'
        } cursor-pointer hover:shadow-md active:scale-95`}
    >
        <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-[250ms] ease-in-out ${
                enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

export const MatchingSettingsModal: React.FC<MatchingSettingsModalProps> = ({ settings, onUpdate, onReset, onClose, showHeader = true }) => {
    const { t } = useLanguage();

    const handleDifficultyChange = (difficulty: DifficultyType) => {
        onUpdate({ ...settings, difficulty });
    };

    const handleToggleTimer = () => {
        onUpdate({ ...settings, showTimer: !settings.showTimer });
    };

    return (
        <div className="flex flex-col w-full max-w-md mx-auto p-2">
            {showHeader && (
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-[#121e18] dark:text-white">{t("Settings")}</h2>
                    <button
                        onClick={onReset}
                        className="p-2 rounded-xl bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-all shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] active:scale-95 duration-150"
                        title={t("Reset to Default")}
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Difficulty Selection */}
            <div className="mb-8">
                <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Difficulty")}</p>
                <div className="relative flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                    <div
                        className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-[#56A652] shadow-md transition-all duration-300 ease-in-out"
                        style={{
                            left: `calc(${[4, 5, 6].indexOf(settings.difficulty)} * (100% / 3) + 0.375rem)`,
                            width: 'calc(33.333% - 0.75rem)',
                        }}
                    />
                    {([4, 5, 6] as DifficultyType[]).map((num) => (
                        <button
                            key={num}
                            onClick={() => handleDifficultyChange(num)}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 relative z-10 ${
                                settings.difficulty === num
                                    ? 'text-[#56A652] dark:text-white'
                                    : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                            }`}
                        >
                            {num} {t("Pairs")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toggle Option */}
            <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                    <span className="font-bold text-[#121e18] dark:text-white">{t("Show Timer")}</span>
                    <Toggle
                        enabled={settings.showTimer}
                        onChange={handleToggleTimer}
                    />
                </div>
            </div>

            {!showHeader && (
                <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-[#56A652] text-white font-bold text-xl shadow-[0_8px_0_rgb(67,130,64)] hover:shadow-[0_4px_0_rgb(67,130,64)] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] active:scale-95 transition-all duration-150"
                >
                    {t("Save")}
                </button>
            )}
        </div>
    );
};
