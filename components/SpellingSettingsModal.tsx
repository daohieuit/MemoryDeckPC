import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowPathIcon } from './icons/Icons';
import { ToggleSwitch } from './ToggleSwitch';
import { SequenceType } from './FlashcardSettingsModal';
import { QuizLanguageType } from './QuizSettingsModal';

export interface SpellingSettings {
    questionCount: number;
    sequence: SequenceType;
    language: QuizLanguageType;
    showOverrideButton: boolean;
    autoAdvance: boolean;
}

interface SpellingSettingsModalProps {
    settings: SpellingSettings;
    maxQuestions: number;
    onUpdate: (settings: SpellingSettings) => void;
    onReset: () => void;
    onClose: () => void;
    showHeader?: boolean;
}

export const SpellingSettingsModal: React.FC<SpellingSettingsModalProps> = ({ settings, maxQuestions, onUpdate, onReset, onClose, showHeader = true }) => {
    const { t } = useLanguage();

    const handleUpdate = (key: keyof SpellingSettings, value: any) => {
        onUpdate({ ...settings, [key]: value });
    };

    const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;
        const clamped = Math.max(1, Math.min(val, maxQuestions));
        handleUpdate('questionCount', clamped);
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

            {/* Questions Input */}
            <div className="mb-8">
                <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Questions")}</p>
                <div className="relative">
                    <input
                        type="number"
                        value={settings.questionCount}
                        onChange={handleQuestionCountChange}
                        min={1}
                        max={maxQuestions}
                        className="w-full p-4 rounded-2xl bg-[#e8e5da] dark:bg-[#446843] border-none text-[#121e18] dark:text-white font-bold focus:ring-2 focus:ring-[#56A652] shadow-inner transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AFBD96] text-xs font-bold">
                        / {maxQuestions}
                    </div>
                </div>
            </div>

            {/* Sequence Selection */}
            <div className="mb-8">
                <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Sequence")}</p>
                <div className="relative flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                    <div
                        className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-[#56A652] shadow-md transition-all duration-300 ease-in-out"
                        style={{
                            left: `calc(${(['default', 'alpha', 'random'] as SequenceType[]).indexOf(settings.sequence)} * (100% / 3) + 0.375rem)`,
                            width: 'calc(33.333% - 0.75rem)',
                        }}
                    />
                    {(['default', 'alpha', 'random'] as SequenceType[]).map((seq) => (
                        <button
                            key={seq}
                            onClick={() => handleUpdate('sequence', seq)}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 relative z-10 ${
                                settings.sequence === seq
                                    ? 'text-[#56A652] dark:text-white'
                                    : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                            }`}
                        >
                            {t(seq.charAt(0).toUpperCase() + seq.slice(1))}
                        </button>
                    ))}
                </div>
            </div>

            {/* Language Selection */}
            <div className="mb-8">
                <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Language")}</p>
                <div className="relative flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                    <div
                        className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-[#56A652] shadow-md transition-all duration-300 ease-in-out"
                        style={{
                            left: `calc(${['EN', 'VN', 'Mixed'].indexOf(settings.language)} * (100% / 3) + 0.375rem)`,
                            width: 'calc(33.333% - 0.75rem)',
                        }}
                    />
                    {(['EN', 'VN', 'Mixed'] as QuizLanguageType[]).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => handleUpdate('language', lang)}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 relative z-10 ${
                                settings.language === lang
                                    ? 'text-[#56A652] dark:text-white'
                                    : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                            }`}
                        >
                            {t(lang)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                    <span className="font-bold text-[#121e18] dark:text-white">{t("Show Override Button")}</span>
                    <ToggleSwitch
                        checked={settings.showOverrideButton}
                        onChange={() => handleUpdate('showOverrideButton', !settings.showOverrideButton)}
                    />
                </div>

                <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                    <span className="font-bold text-[#121e18] dark:text-white">{t("Auto-advance")}</span>
                    <ToggleSwitch
                        checked={settings.autoAdvance}
                        onChange={() => handleUpdate('autoAdvance', !settings.autoAdvance)}
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
