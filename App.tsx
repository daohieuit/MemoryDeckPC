
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, useParams, useNavigate } from 'react-router-dom';
import { WordProvider, useWords } from './hooks/useWords';
import { ToastProvider } from './hooks/useToast';
import { ModalProvider } from './hooks/useModal';
import { Home } from './components/Home';
import { FlashcardMode } from './components/FlashcardMode';
import { QuizMode } from './components/QuizMode';
import { MatchingMode } from './components/MatchingMode';
import { SpellingMode } from './components/SpellingMode';
import { WordListManager } from './components/WordListManager';
import { ToastContainer } from './components/Toast';
import { ModalContainer } from './components/Modal';
import { GameMode } from './types';
import { BookOpenIcon, PencilIcon, PuzzlePieceIcon, QuestionMarkCircleIcon, Squares2X2Icon, GearIcon, SunIcon, MoonIcon, GlobeAltIcon, InformationCircleIcon } from './components/icons/Icons';

import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { useModal } from './hooks/useModal'; // Import useModal hook
import { ArrowUpTrayIcon, ArrowDownTrayIcon } from './components/icons/Icons';
import ExportModalContent from './components/ExportModalContent';

const AboutPage: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="animate-fade-in pt-8 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#121e18] dark:text-white text-center">{t("About MemoryDeck")}</h1>

            <section className="bg-white dark:bg-[#344E41] p-8 rounded-xl shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40] mb-8">
                <p className="text-[#AFBD96] leading-relaxed mb-4">
                    <span className="font-bold text-[#1A2B22] dark:text-white">{t("Study Smarter. Remember Longer. Level Up Your English.")}</span>
                </p>
                <p className="text-[#AFBD96] leading-relaxed mb-4">{t("Tired of memorizing vocabulary only to forget it the next day?")}</p>
                <p className="text-[#AFBD96] leading-relaxed mb-4">{t("MemoryDeck is here to fix that.")}</p>

                <p className="text-[#AFBD96] leading-relaxed mb-4">
                    {t("Built on powerful learning science like Active Recall and Spaced Repetition, MemoryDeck helps you lock words into your long-term memory — not just cram and forget. You’ll spend less time re-reading and more time actually remembering.")}
                </p>
                <p className="text-[#AFBD96] leading-relaxed mb-4">
                    {t("Create your own decks, customize your learning flow, and focus on what truly matters to you — whether that’s TOEIC, IELTS, work vocabulary, or daily conversation skills.")}
                </p>

                <p className="text-[#AFBD96] leading-relaxed mb-2">{t("Switch things up with multiple learning modes:")}</p>
                <ul className="list-none pl-5 text-[#AFBD96] leading-relaxed mb-4 space-y-1">
                    <li>{t("🃏 Flashcards for quick recall")}</li>
                    <li>{t("📝 Quizzes to test your memory")}</li>
                    <li>{t("🎯 Matching games to boost speed")}</li>
                    <li>{t("🔊 AI-powered Spelling practice to train your ears and typing")}</li>
                </ul>

                <p className="text-[#AFBD96] leading-relaxed mb-4">{t("Clean design. No distractions. Works offline.")}</p>
                <p className="text-[#AFBD96] leading-relaxed mb-4">{t("Just you and your progress.")}</p>

                <p className="text-[#AFBD96] leading-relaxed mb-4">{t("MemoryDeck isn’t just another vocab app.")}</p>
                <p className="text-[#AFBD96] leading-relaxed">{t("It’s your glow-up tool for English fluency. 🚀")}</p>
            </section>

            <section className="bg-white dark:bg-[#344E41] p-8 rounded-xl shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40]">
                <h2 className="text-2xl font-bold text-[#121e18] dark:text-white mb-4">{t("About the Developer")}</h2>
                <p className="text-[#AFBD96] leading-relaxed mb-4">
                    <span className="font-bold text-[#1A2B22] dark:text-white">{t("Built with passion by Dao Hieu")}</span>
                </p>
                <p className="text-[#AFBD96] leading-relaxed mb-4">
                    {t("MemoryDeck was designed and developed by Dao Hieu (Đào Hiếu) — a passionate developer who believes that learning should be smart, efficient, and actually enjoyable.")}
                </p>
                <p className="text-[#AFBD96] leading-relaxed mb-4">
                    {t("This project is the result of a deep interest in language learning, cognitive science, and modern app development. Countless hours were spent researching how memory works, experimenting with UI/UX design, and refining every detail to create a smooth, distraction-free learning experience.")}
                </p>
                <p className="text-[#AFBD96] leading-relaxed mb-4">
                    {t("MemoryDeck isn’t just another side project — it’s a mission to build tools that genuinely help people grow.")}
                </p>

                <p className="text-[#AFBD96] leading-relaxed mb-2">{t("If you’d like to connect, collaborate, or share feedback:")}</p>
                <ul className="list-none pl-5 text-[#AFBD96] leading-relaxed mb-4 space-y-1">
                    <li><a href="https://github.com/daohieuit" target="_blank" rel="noopener noreferrer" className="text-[#56A652] hover:underline">{t("🌐 GitHub: https://github.com/daohieuit")}</a></li>
                    <li><a href="mailto:daohieuit0803@gmail.com" className="text-[#56A652] hover:underline">{t("📩 Email: daohieuit0803@gmail.com")}</a></li>
                </ul>

                <p className="text-[#AFBD96] leading-relaxed mb-4">{t("Thank you for being part of this journey.")}</p>
                <p className="text-[#AFBD96] leading-relaxed">{t("Let’s keep learning and leveling up together. 🚀")}</p>
            </section>

            <div className="text-center mt-8">
                <NavLink to="/" className="bg-[#56A652] text-white font-bold py-3 px-8 rounded-lg hover:brightness-90 transition-colors shadow-md">
                    {t("Back to Dashboard")}
                </NavLink>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        console.log('Theme changed to:', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            console.log('Added "dark" class to document.documentElement');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            console.log('Removed "dark" class from document.documentElement');
        }
    }, [theme]);

    return (
        <ToastProvider>
            <ModalProvider>
                <WordProvider>
                    <HashRouter>
                        <div className="min-h-screen flex flex-col bg-[#F1F5F9] dark:bg-[#1A2B22] text-[#1A2B22] dark:text-[#F1F5F9] font-sans">
                            <Header theme={theme} toggleTheme={toggleTheme} />
                            <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/manage-words/:deckId?" element={<WordListManager />} />
                                    <Route path="/learn/:deckId/:mode" element={<LearnScreen />} />
                                    <Route path="/about" element={<AboutPage />} />
                                </Routes>
                            </main>
                            <ToastContainer />
                            <ModalContainer />
                        </div>
                    </HashRouter>
                </WordProvider>
            </ModalProvider>
        </ToastProvider>
    );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
};

const Header: React.FC<{ theme: string, toggleTheme: () => void }> = ({ theme, toggleTheme }) => {
    const { language, toggleLanguage, t } = useLanguage();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { showModal, hideModal } = useModal(); // Use the useModal hook
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExportClick = () => {
        setIsSettingsOpen(false); // Close settings menu when opening export modal
        showModal({
            title: t("Export Options"),
            message: <ExportModalContent />
        });
    };

    return (
        <header className="bg-white/80 dark:bg-[#3A5A40]/50 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-[#EDE9DE] dark:border-[#3A5A40]/50">
            <nav className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
                <NavLink to="/" className="flex items-center space-x-2 text-2xl font-bold text-[#56A652] hover:brightness-90 transition-colors duration-300">
                    <img src="./assets/images/Deck_logo.png" alt="MemoryDeck Logo" className="h-8 w-auto" />
                    <span>MemoryDeck</span>
                </NavLink>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#56A652] text-white' : 'text-[#1A2B22]/80 dark:text-[#F1F5F9]/80 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] hover:text-[#1A2B22] dark:hover:text-white'}`
                        }
                    >
                        <Squares2X2Icon />
                        <span>{t("Dashboard")}</span>
                    </NavLink>
                    <NavLink
                        to="/manage-words"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#56A652] text-white' : 'text-[#1A2B22]/80 dark:text-[#F1F5F9]/80 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] hover:text-[#1A2B22] dark:hover:text-white'}`
                        }
                    >
                        <BookOpenIcon />
                        <span>{t("My Decks")}</span>
                    </NavLink>
                    <div className="relative" ref={settingsRef}>
                        <button onClick={() => setIsSettingsOpen(prev => !prev)} className="p-2 rounded-full text-[#1A2B22]/80 dark:text-[#F1F5F9]/80 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors">
                            <GearIcon />
                        </button>
                        {isSettingsOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#344E41] rounded-md shadow-lg py-1 border border-[#EDE9DE] dark:border-[#3A5A40] animate-fade-in-fast">
                                <div className="px-3 py-2 text-xs font-semibold text-[#AFBD96] uppercase">{t("Appearance")}</div>
                                <button onClick={toggleTheme} className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[#1A2B22] dark:text-[#F1F5F9] hover:bg-[#e8e5da] dark:hover:bg-[#446843]">
                                    <span>{theme === 'dark' ? t("Light Mode") : t("Dark Mode")}</span>
                                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                                </button>
                                <div className="border-t border-[#EDE9DE] dark:border-[#3A5A40] my-1"></div>
                                <div className="px-3 py-2 text-xs font-semibold text-[#AFBD96] uppercase">{t("Language")}</div>
                                <button onClick={toggleLanguage} className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[#1A2B22] dark:text-[#F1F5F9] hover:bg-[#e8e5da] dark:hover:bg-[#446843]">
                                    <span>{language === 'english' ? t("Tiếng Việt") : t("English")}</span>
                                    <GlobeAltIcon />
                                </button>
                                <div className="border-t border-[#EDE9DE] dark:border-[#3A5A40] my-1"></div>
                                <div className="px-3 py-2 text-xs font-semibold text-[#AFBD96] uppercase">{t("Application")}</div>
                                <button onClick={handleExportClick} className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[#1A2B22] dark:text-[#F1F5F9] hover:bg-[#e8e5da] dark:hover:bg-[#446843]">
                                    <span>{t("Export Data")}</span>
                                    <ArrowUpTrayIcon />
                                </button>
                                <button onClick={() => { /* Import logic here */ setIsSettingsOpen(false); }} className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[#1A2B22] dark:text-[#F1F5F9] hover:bg-[#e8e5da] dark:hover:bg-[#446843]">
                                    <span>{t("Import Data")}</span>
                                    <ArrowDownTrayIcon />
                                </button>
                                <NavLink to="/about" onClick={() => setIsSettingsOpen(false)} className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[#1A2B22] dark:text-[#F1F5F9] hover:bg-[#e8e5da] dark:hover:bg-[#446843]">
                                    <span>{t("About")}</span>
                                    <InformationCircleIcon />
                                </NavLink>
                                <VersionDisplay />
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

const VersionDisplay: React.FC = () => {
    const { t } = useLanguage();
    const { showModal } = useModal(); // Use the useModal hook
    const [version, setVersion] = useState('0.0.0');

    useEffect(() => {
        const fetchVersion = async () => {
            if (window.electronAPI) {
                const v = await window.electronAPI.getAppVersion();
                setVersion(v);
            }
        };
        fetchVersion();
    }, []);

    const handleVersionClick = () => {
        showModal({
            title: t("What's New"),
            message: (
                <div className="flex flex-col gap-2 text-sm text-[#1A2B22]/80 dark:text-white/80">
                    <p className="font-semibold text-base mb-1">{t("Whats New Introduction")}</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>{t("Enhanced Import/Export UI")}</li>
                        <li>{t("Integrated Search Functionality")}</li>
                    </ul>
                </div>
            )
        });
    };

    return (
        <div className="border-t border-[#EDE9DE] dark:border-[#3A5A40] mt-1 px-3 py-2 text-[10px] text-center">
            <button
                className="text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white transition-colors"
                onClick={handleVersionClick}
            >
                {t("Version")} {version}
            </button>
        </div>
    );
};

const LearnScreen: React.FC = () => {
    const { deckId, mode } = useParams<{ deckId: string; mode: GameMode }>();
    const { decks } = useWords();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const deck = decks.find(d => d.id.toString() === deckId);

    if (!deckId || !mode || !deck) {
        return <div className="text-center text-red-500">{t("Invalid deck or mode selected.")}</div>;
    }

    const renderMode = () => {
        switch (mode) {
            case 'flashcard': // Assuming URL param might be lowercase? No, GameMode enum is usually passed. If it comes from URL it's string.
            // But let's assume it matches the keys in localization.md (Flashcard, Quiz, etc) or I capititalize it.
            // The existing code did `mode.replace('-', ' ')` so it seems it expects some format.
            // localization.md has "Flashcard", "Quiz", "Matching", "Spelling".
            // I'll capitalize the first letter of mode for the key.
            case GameMode.Flashcard:
                return <FlashcardMode deckId={parseInt(deckId)} />;
            case GameMode.Quiz:
                return <QuizMode deckId={parseInt(deckId)} />;
            case GameMode.Matching:
                return <MatchingMode deckId={parseInt(deckId)} />;
            case GameMode.Spelling:
                return <SpellingMode deckId={parseInt(deckId)} />;
            default:
                return <p>{t("Unknown mode")}</p>;
        }
    };

    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

    return (
        <div className="flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <button onClick={() => navigate('/')} className="text-[#56A652] hover:brightness-90 mb-2 flex items-center">
                        <i className="fas fa-arrow-left mr-2"></i> {t("Back to Dashboard")}
                    </button>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#1A2B22] dark:text-white capitalize">{t(modeLabel)} {t("Mode")}</h1>
                    <p className="text-[#AFBD96]">{t("Deck:")} <span className="font-semibold text-[#1A2B22]/90 dark:text-[#F1F5F9]/90">{deck.name}</span></p>
                </div>
                <div className="flex space-x-2">
                    <ModeNavButton currentMode={mode} targetMode={GameMode.Flashcard} deckId={deckId} icon={<BookOpenIcon />} />
                    <ModeNavButton currentMode={mode} targetMode={GameMode.Quiz} deckId={deckId} icon={<QuestionMarkCircleIcon />} />
                    <ModeNavButton currentMode={mode} targetMode={GameMode.Matching} deckId={deckId} icon={<PuzzlePieceIcon />} />
                    <ModeNavButton currentMode={mode} targetMode={GameMode.Spelling} deckId={deckId} icon={<PencilIcon />} />
                </div>
            </div>
            {renderMode()}
        </div>
    )
};

interface ModeNavButtonProps {
    currentMode: GameMode;
    targetMode: GameMode;
    deckId: string;
    icon: React.ReactNode;
}

const ModeNavButton: React.FC<ModeNavButtonProps> = ({ currentMode, targetMode, deckId, icon }) => {
    const navigate = useNavigate();
    const isActive = currentMode === targetMode;
    const baseClasses = "p-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#F1F5F9] dark:focus:ring-offset-[#1A2B22] focus:ring-[#56A652]";
    const activeClasses = "bg-[#56A652] text-white shadow-lg";
    const inactiveClasses = "bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22]/80 dark:text-[#F1F5F9]/80 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] hover:text-[#1A2B22] dark:hover:text-white";

    return (
        <button
            onClick={() => navigate(`/learn/${deckId}/${targetMode}`)}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            title={`${targetMode.charAt(0).toUpperCase() + targetMode.slice(1)} Mode`}
        >
            {icon}
        </button>
    );
};

export default App;
