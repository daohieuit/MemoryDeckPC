
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, useParams, useNavigate } from 'react-router-dom';
import { WordProvider, useWords } from './hooks/useWords';
import { Home } from './components/Home';
import { FlashcardMode } from './components/FlashcardMode';
import { QuizMode } from './components/QuizMode';
import { MatchingMode } from './components/MatchingMode';
import { SpellingMode } from './components/SpellingMode';
import { WordListManager } from './components/WordListManager';
import { GameMode } from './types';
import { BookOpenIcon, PencilIcon, PuzzlePieceIcon, QuestionMarkCircleIcon, Squares2X2Icon, GearIcon, SunIcon, MoonIcon, GlobeAltIcon } from './components/icons/Icons';

const App: React.FC = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [language, setLanguage] = useState('english');

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'english' ? 'vietnamese' : 'english');
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    return (
        <WordProvider>
            <HashRouter>
                <div className="min-h-screen flex flex-col bg-[#F1F5F9] dark:bg-[#1A2B22] text-[#1A2B22] dark:text-[#F1F5F9] font-sans">
                    <Header theme={theme} toggleTheme={toggleTheme} language={language} toggleLanguage={toggleLanguage} />
                    <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/manage-words" element={<WordListManager />} />
                            <Route path="/learn/:deckId/:mode" element={<LearnScreen />} />
                        </Routes>
                    </main>
                </div>
            </HashRouter>
        </WordProvider>
    );
};

const Header: React.FC<{ theme: string, toggleTheme: () => void, language: string, toggleLanguage: () => void }> = ({ theme, toggleTheme, language, toggleLanguage }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

    return (
        <header className="bg-white/80 dark:bg-[#3A5A40]/50 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-[#EDE9DE] dark:border-[#3A5A40]/50">
            <nav className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
                <NavLink to="/" className="text-2xl font-bold text-[#56A652] hover:brightness-90 transition-colors duration-300">
                    <i className="fas fa-feather-alt mr-2"></i>MemoryDeck
                </NavLink>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#56A652] text-white' : 'text-[#1A2B22]/80 dark:text-[#F1F5F9]/80 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] hover:text-[#1A2B22] dark:hover:text-white'}`
                        }
                    >
                        <Squares2X2Icon />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink
                        to="/manage-words"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#56A652] text-white' : 'text-[#1A2B22]/80 dark:text-[#F1F5F9]/80 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] hover:text-[#1A2B22] dark:hover:text-white'}`
                        }
                    >
                        <BookOpenIcon />
                        <span>My Decks</span>
                    </NavLink>
                    <div className="relative" ref={settingsRef}>
                        <button onClick={() => setIsSettingsOpen(prev => !prev)} className="p-2 rounded-full text-[#1A2B22]/80 dark:text-[#F1F5F9]/80 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors">
                            <GearIcon />
                        </button>
                        {isSettingsOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#344E41] rounded-md shadow-lg py-1 border border-[#EDE9DE] dark:border-[#3A5A40] animate-fade-in-fast">
                                <div className="px-3 py-2 text-xs font-semibold text-[#AFBD96] uppercase">Appearance</div>
                                <button onClick={toggleTheme} className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[#1A2B22] dark:text-[#F1F5F9] hover:bg-[#e8e5da] dark:hover:bg-[#446843]">
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                                </button>
                                <div className="border-t border-[#EDE9DE] dark:border-[#3A5A40] my-1"></div>
                                <div className="px-3 py-2 text-xs font-semibold text-[#AFBD96] uppercase">Language</div>
                                <button onClick={toggleLanguage} className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-[#1A2B22] dark:text-[#F1F5F9] hover:bg-[#e8e5da] dark:hover:bg-[#446843]">
                                    <span>{language === 'english' ? 'Tiếng Việt' : 'English'}</span>
                                    <GlobeAltIcon />
                                </button>
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

    return (
        <div className="border-t border-[#EDE9DE] dark:border-[#3A5A40] mt-1 px-3 py-2 text-[10px] text-[#AFBD96] text-center">
            Version {version}
        </div>
    );
};

const LearnScreen: React.FC = () => {
    const { deckId, mode } = useParams<{ deckId: string; mode: GameMode }>();
    const { decks } = useWords();
    const navigate = useNavigate();

    const deck = decks.find(d => d.id.toString() === deckId);

    if (!deckId || !mode || !deck) {
        return <div className="text-center text-red-500">Invalid deck or mode selected.</div>;
    }

    const renderMode = () => {
        switch (mode) {
            case GameMode.Flashcard:
                return <FlashcardMode deckId={parseInt(deckId)} />; // Note: Component prop might still be named deckId, need to check
            case GameMode.Quiz:
                return <QuizMode deckId={parseInt(deckId)} />;
            case GameMode.Matching:
                return <MatchingMode deckId={parseInt(deckId)} />;
            case GameMode.Spelling:
                return <SpellingMode deckId={parseInt(deckId)} />;
            default:
                return <p>Unknown mode</p>;
        }
    };

    return (
        <div className="flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <button onClick={() => navigate('/')} className="text-[#56A652] hover:brightness-90 mb-2 flex items-center">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                    </button>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#1A2B22] dark:text-white capitalize">{mode.replace('-', ' ')} Mode</h1>
                    <p className="text-[#AFBD96]">Deck: <span className="font-semibold text-[#1A2B22]/90 dark:text-[#F1F5F9]/90">{deck.name}</span></p>
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
