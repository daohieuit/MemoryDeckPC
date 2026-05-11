import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
    ArrowPathIcon, 
    RectangleStackIcon, 
    PuzzlePieceIcon, 
    QuestionMarkCircleIcon, 
    PencilIcon, 
    AdjustmentsHorizontalIcon 
} from './icons/Icons';
import { FlashcardSettings, SequenceType } from './FlashcardSettingsModal';
import { MatchingSettings, DifficultyType } from './MatchingSettingsModal';
import { QuizSettings, QuizLanguageType } from './QuizSettingsModal';
import { SpellingSettings } from './SpellingSettingsModal';

export interface StudySessionSettings {
    general: {
        sessionLimit: number;
        dailyGoal: number;
    };
    flashcard: FlashcardSettings;
    matching: MatchingSettings;
    quiz: QuizSettings;
    spelling: SpellingSettings;
}

interface StudySessionSettingsModalProps {
    settings: StudySessionSettings;
    maxAvailableCards: number;
    onUpdate: (settings: StudySessionSettings) => void;
    onReset: () => void;
    onClose: () => void;
}

type TabType = 'general' | 'flashcard' | 'matching' | 'quiz' | 'spelling';

const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner ${
            enabled ? 'bg-[#56A652]' : 'bg-[#e8e5da] dark:bg-[#446843]'
        }`}
    >
        <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

export const StudySessionSettingsModal: React.FC<StudySessionSettingsModalProps> = ({ 
    settings: initialSettings, 
    maxAvailableCards,
    onUpdate, 
    onReset, 
    onClose 
}) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [localSettings, setLocalSettings] = useState<StudySessionSettings>(initialSettings);

    const handleUpdate = (newSettings: StudySessionSettings) => {
        setLocalSettings(newSettings);
    };

    const handleSave = () => {
        onUpdate(localSettings);
        onClose();
    };

    const tabs: { id: TabType; label: string; icon: React.FC<any> }[] = [
        { id: 'general', label: t('General'), icon: AdjustmentsHorizontalIcon },
        { id: 'flashcard', label: t('Flashcard'), icon: RectangleStackIcon },
        { id: 'matching', label: t('Matching'), icon: PuzzlePieceIcon },
        { id: 'quiz', label: t('Quiz'), icon: QuestionMarkCircleIcon },
        { id: 'spelling', label: t('Spelling'), icon: PencilIcon },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Session Limit")}</p>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={localSettings.general.sessionLimit}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (isNaN(val)) return;
                                        setLocalSettings({
                                            ...localSettings,
                                            general: { ...localSettings.general, sessionLimit: Math.max(1, val) }
                                        });
                                    }}
                                    className="w-full p-4 rounded-2xl bg-[#e8e5da] dark:bg-[#446843] border-none text-[#121e18] dark:text-white font-bold focus:ring-2 focus:ring-[#56A652] shadow-inner transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AFBD96] text-xs font-bold">
                                    {t("cards")}
                                </div>
                            </div>
                            <p className="text-[10px] text-[#AFBD96] mt-2 italic">{t("Maximum number of cards to include in this session.")}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Daily Goal")}</p>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={localSettings.general.dailyGoal}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (isNaN(val)) return;
                                        setLocalSettings({
                                            ...localSettings,
                                            general: { ...localSettings.general, dailyGoal: Math.max(1, val) }
                                        });
                                    }}
                                    className="w-full p-4 rounded-2xl bg-[#e8e5da] dark:bg-[#446843] border-none text-[#121e18] dark:text-white font-bold focus:ring-2 focus:ring-[#56A652] shadow-inner transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AFBD96] text-xs font-bold">
                                    {t("cards/day")}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'flashcard':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Sequence")}</p>
                            <div className="flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                                {(['default', 'alpha', 'random'] as SequenceType[]).map((seq) => (
                                    <button
                                        key={seq}
                                        onClick={() => setLocalSettings({
                                            ...localSettings,
                                            flashcard: { ...localSettings.flashcard, sequence: seq }
                                        })}
                                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            localSettings.flashcard.sequence === seq
                                                ? 'bg-white dark:bg-[#56A652] text-[#56A652] dark:text-white shadow-md'
                                                : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                                        }`}
                                    >
                                        {t(seq.charAt(0).toUpperCase() + seq.slice(1))}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                                <span className="font-bold text-[#121e18] dark:text-white">{t("Auto-play Audio")}</span>
                                <Toggle 
                                    enabled={localSettings.flashcard.autoPlayAudio} 
                                    onChange={(val) => setLocalSettings({
                                        ...localSettings,
                                        flashcard: { ...localSettings.flashcard, autoPlayAudio: val }
                                    })} 
                                />
                            </div>
                            <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                                <span className="font-bold text-[#121e18] dark:text-white">{t("Show Review Prompt")}</span>
                                <Toggle 
                                    enabled={localSettings.flashcard.showReviewPrompt} 
                                    onChange={(val) => setLocalSettings({
                                        ...localSettings,
                                        flashcard: { ...localSettings.flashcard, showReviewPrompt: val }
                                    })} 
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'matching':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Difficulty")}</p>
                            <div className="flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                                {([4, 5, 6] as DifficultyType[]).map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setLocalSettings({
                                            ...localSettings,
                                            matching: { ...localSettings.matching, difficulty: num }
                                        })}
                                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            localSettings.matching.difficulty === num
                                                ? 'bg-white dark:bg-[#56A652] text-[#56A652] dark:text-white shadow-md'
                                                : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                                        }`}
                                    >
                                        {num} {t("Pairs")}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                            <span className="font-bold text-[#121e18] dark:text-white">{t("Show Timer")}</span>
                            <Toggle 
                                enabled={localSettings.matching.showTimer} 
                                onChange={(val) => setLocalSettings({
                                    ...localSettings,
                                    matching: { ...localSettings.matching, showTimer: val }
                                })} 
                            />
                        </div>
                    </div>
                );
            case 'quiz':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Sequence")}</p>
                            <div className="flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                                {(['default', 'alpha', 'random'] as SequenceType[]).map((seq) => (
                                    <button
                                        key={seq}
                                        onClick={() => setLocalSettings({
                                            ...localSettings,
                                            quiz: { ...localSettings.quiz, sequence: seq }
                                        })}
                                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            localSettings.quiz.sequence === seq
                                                ? 'bg-white dark:bg-[#56A652] text-[#56A652] dark:text-white shadow-md'
                                                : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                                        }`}
                                    >
                                        {t(seq.charAt(0).toUpperCase() + seq.slice(1))}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Language")}</p>
                            <div className="flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                                {(['EN', 'VN', 'Mixed'] as QuizLanguageType[]).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setLocalSettings({
                                            ...localSettings,
                                            quiz: { ...localSettings.quiz, language: lang }
                                        })}
                                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            localSettings.quiz.language === lang
                                                ? 'bg-white dark:bg-[#56A652] text-[#56A652] dark:text-white shadow-md'
                                                : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                                        }`}
                                    >
                                        {t(lang)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'spelling':
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <p className="text-xs font-bold text-[#AFBD96] uppercase mb-3 tracking-widest">{t("Language")}</p>
                            <div className="flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner">
                                {(['EN', 'VN', 'Mixed'] as QuizLanguageType[]).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setLocalSettings({
                                            ...localSettings,
                                            spelling: { ...localSettings.spelling, language: lang }
                                        })}
                                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            localSettings.spelling.language === lang
                                                ? 'bg-white dark:bg-[#56A652] text-[#56A652] dark:text-white shadow-md'
                                                : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white'
                                        }`}
                                    >
                                        {t(lang)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                                <span className="font-bold text-[#121e18] dark:text-white">{t("Override Button")}</span>
                                <Toggle 
                                    enabled={localSettings.spelling.showOverrideButton} 
                                    onChange={(val) => setLocalSettings({
                                        ...localSettings,
                                        spelling: { ...localSettings.spelling, showOverrideButton: val }
                                    })} 
                                />
                            </div>
                            <div className="flex items-center justify-between p-5 bg-white dark:bg-[#446843] rounded-2xl shadow-sm border border-[#EDE9DE] dark:border-[#4A6A50]">
                                <span className="font-bold text-[#121e18] dark:text-white">{t("Auto-advance")}</span>
                                <Toggle 
                                    enabled={localSettings.spelling.autoAdvance} 
                                    onChange={(val) => setLocalSettings({
                                        ...localSettings,
                                        spelling: { ...localSettings.spelling, autoAdvance: val }
                                    })} 
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto h-[600px] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-6">
                <h2 className="text-2xl font-bold text-[#121e18] dark:text-white">{t("Study Session Settings")}</h2>
                <button 
                    onClick={onReset}
                    className="p-2 rounded-xl bg-[#e8e5da] dark:bg-[#446843] text-[#AFBD96] hover:text-[#56A652] transition-all shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                    title={t("Global Reset")}
                >
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Horizontal Tab Bar - Expandable Icon-Only */}
            <div className="px-6 mb-6">
                <div className="flex bg-[#e8e5da] dark:bg-[#446843] p-1.5 rounded-2xl shadow-inner justify-between gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-500 ease-in-out ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-[#56A652] text-[#56A652] dark:text-white shadow-md flex-[2] scale-[1.02]'
                                    : 'text-[#AFBD96] hover:text-[#121e18] dark:hover:text-white flex-1'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${activeTab === tab.id ? 'text-[#56A652] dark:text-white' : 'text-[#AFBD96]'}`} />
                            <span className={`transition-all duration-500 overflow-hidden ${activeTab === tab.id ? 'max-w-[100px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}`}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area - Full Width */}
            <div className="flex-1 px-6 pb-6 overflow-hidden">
                <div className="h-full bg-[#F8F9FA] dark:bg-[#3A5A40] rounded-3xl p-8 overflow-y-auto shadow-inner border border-[#EDE9DE] dark:border-[#4A6A50]">
                    {renderContent()}
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
                <button
                    onClick={handleSave}
                    className="w-full py-4 rounded-2xl bg-[#56A652] text-white font-bold text-xl shadow-[0_8px_0_rgb(67,130,64)] hover:shadow-[0_4px_0_rgb(67,130,64)] hover:translate-y-[4px] transition-all duration-150 active:shadow-none active:translate-y-[8px]"
                >
                    {t("Save & Close")}
                </button>
            </div>
        </div>
    );
};
