import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { Term } from '../types';
import { State } from 'ts-fsrs';

const formatIPA = (ipa: string): string => {
    const content = ipa.trim().replace(/^\/|\/$/g, '').trim();
    return content ? `/${content}/` : '';
};

const formatFunction = (func: string): string => {
    const content = func.trim();
    if (!content) return '';
    if (content.startsWith('(') && content.endsWith(')')) {
        return content;
    }
    return `(${content})`;
};

interface DeckModalContentProps {
    onClose: () => void;
    onSaved?: (deckId: number) => void;
    deckId?: number; // Optional deckId for Edit mode
    mode?: 'create' | 'edit' | 'manage-cards';
}

export const DeckModalContent: React.FC<DeckModalContentProps> = ({ onClose, onSaved, deckId, mode = deckId ? 'edit' : 'create' }) => {
    const { addDeck, addTermsToDeck, renameDeck, updateTerm, deleteTerm, decks, getTermsForDeck, progress } = useWords();
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [importText, setImportText] = useState('');
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [filterState, setFilterState] = useState<State | 'all' | null>(null);

    // States for manual card creation/editing
    const [manualTerms, setManualTerms] = useState<(Term | Omit<Term, 'id' | 'deck_id'>)[]>([]);
    const [deletedTermIds, setDeletedTermIds] = useState<number[]>([]);
    const [currentTerm, setCurrentTerm] = useState({ term: '', definition: '', function: '', ipa: '' });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingCard, setIsAddingCard] = useState(mode !== 'manage-cards');
    const termInputRef = React.useRef<HTMLInputElement>(null);

    // Load existing data if in Edit mode
    useEffect(() => {
        if (deckId) {
            const deck = decks.find(d => d.id === deckId);
            if (deck) {
                setName(deck.name);
                const existingTerms = getTermsForDeck(deckId);
                setManualTerms(existingTerms);
            }
        }
    }, [deckId, decks, getTermsForDeck]);

    // Compute statistics and enrich terms with progress data
    const enrichedManualTerms = useMemo(() => {
        return manualTerms.map((term, index) => {
            if ('id' in term) {
                const termId = term.id as number;
                const termProgress = progress.find(p => p.term_id === termId);
                return {
                    term,
                    progress: termProgress,
                    state: termProgress ? termProgress.state : State.New,
                    due: termProgress ? new Date(termProgress.due) : null,
                    originalIndex: index
                };
            } else {
                return {
                    term,
                    progress: null,
                    state: State.New,
                    due: null,
                    originalIndex: index
                };
            }
        });
    }, [manualTerms, progress]);

    const stateLabels = useMemo(() => ({
        [State.New]: t("New"),
        [State.Learning]: t("Learning"),
        [State.Review]: t("Review"),
        [State.Relearning]: t("Relearning")
    }), [t]);

    const stats = useMemo(() => {
        return enrichedManualTerms.reduce((acc, item) => {
            const label = stateLabels[item.state] || item.state.toString();
            if (!acc[label]) acc[label] = 0;
            acc[label]++;
            return acc;
        }, {} as Record<string, number>);
    }, [enrichedManualTerms, stateLabels]);

    const filteredTerms = useMemo(() => {
        if (filterState === null || filterState === 'all') return enrichedManualTerms;
        return enrichedManualTerms.filter(item => item.state === filterState);
    }, [enrichedManualTerms, filterState]);

    const formatDueDate = (due: Date | null): string => {
        if (!due) return '';
        const now = new Date();
        const diffMs = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs <= 0) return t("DUE: Today");
        if (diffDays === 1) return t("DUE: Tomorrow");
        if (diffDays <= 7) return t("DUE: {0} days", diffDays);
        return t("DUE: {0}", due.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }));
    };

    const validate = (val: string) => {
        if (!val.trim()) return t("Deck name cannot be empty.");
        if (!/^[a-zA-Z0-9 ]*$/.test(val)) return t("Deck name contains invalid characters.");

        // Allow the current name if editing
        const existingDeck = decks.find(d => d.name.toLowerCase() === val.trim().toLowerCase());
        if (existingDeck && (!deckId || existingDeck.id !== deckId)) {
            return t("A deck with this name already exists.");
        }
        return null;
    };

    const handleAddManualTerm = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!currentTerm.term.trim() || !currentTerm.definition.trim()) return;

        if (editingIndex !== null) {
            const updated = [...manualTerms];
            updated[editingIndex] = { ...manualTerms[editingIndex], ...currentTerm };
            setManualTerms(updated);
            setEditingIndex(null);
        } else {
            setManualTerms([...manualTerms, { ...currentTerm }]);
        }
        setCurrentTerm({ term: '', definition: '', function: '', ipa: '' });
        setTimeout(() => termInputRef.current?.focus(), 50);
    };

    const handleStartAddingCard = () => {
        setIsAddingCard(true);
        setTimeout(() => termInputRef.current?.focus(), 50);
    };

    const handleEditManualTerm = (index: number) => {
        const term = manualTerms[index];
        setCurrentTerm({
            term: term.term,
            definition: term.definition,
            function: term.function || '',
            ipa: term.ipa || ''
        });
        setEditingIndex(index);
        setIsAddingCard(true);
        setTimeout(() => termInputRef.current?.focus(), 50);
    };

    const handleDeleteManualTerm = (index: number) => {
        const termToRemove = manualTerms[index];
        if ('id' in termToRemove) {
            setDeletedTermIds(prev => [...prev, termToRemove.id]);
        }
        setManualTerms(manualTerms.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setCurrentTerm({ term: '', definition: '', function: '', ipa: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate(name);
        if (err) {
            setError(err);
            return;
        }

        setIsSaving(true);
        try {
            let finalDeckId = deckId;

            // 1. Handle Deck Record (Create or Rename)
            if (!deckId) {
                finalDeckId = await addDeck(name.trim());
            } else {
                const originalDeck = decks.find(d => d.id === deckId);
                if (originalDeck && originalDeck.name !== name.trim()) {
                    await renameDeck(deckId, name.trim());
                }
            }

            if (!finalDeckId) throw new Error("Could not determine deck ID");

            // 2. Handle Term Deletions
            if (deletedTermIds.length > 0) {
                await Promise.all(deletedTermIds.map(id => deleteTerm(id)));
            }

            // 3. Handle Term Updates & Additions
            const newTermsBatch: Omit<Term, 'id' | 'deck_id'>[] = [];

            // First, include the current input if it wasn't added yet
            const currentList = [...manualTerms];
            if (currentTerm.term.trim() && currentTerm.definition.trim() && editingIndex === null) {
                currentList.push({ ...currentTerm });
            }

            for (const term of currentList) {
                if ('id' in term) {
                    // This is an existing term, update it
                    await updateTerm(term.id, {
                        term: term.term.trim(),
                        definition: term.definition.trim(),
                        ipa: term.ipa?.trim() || '',
                        function: term.function?.trim() || ''
                    });
                } else {
                    // This is a new term
                    newTermsBatch.push({
                        term: term.term.trim(),
                        definition: term.definition.trim(),
                        ipa: term.ipa?.trim() || '',
                        function: term.function?.trim() || ''
                    });
                }
            }

            // 4. Handle Bulk Import
            if (isBulkMode && importText.trim()) {
                const lines = importText.split('\n').filter(line => line.trim() !== '');
                const parsedTerms = lines.map(line => {
                    const parts = line.split('\t').map(p => p.trim());
                    if (parts.length === 2) return { term: parts[0], definition: parts[1], function: '', ipa: '' };
                    else if (parts.length === 4) return { term: parts[0], function: formatFunction(parts[1]), ipa: formatIPA(parts[2]), definition: parts[3] };
                    return null;
                }).filter((term): term is Omit<Term, 'id' | 'deck_id'> => term !== null);

                newTermsBatch.push(...parsedTerms);
            }

            if (newTermsBatch.length > 0) {
                await addTermsToDeck(finalDeckId, newTermsBatch);
            }

            if (onSaved) onSaved(finalDeckId);
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
            setError(t("An error occurred while saving."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-1 space-y-8">
            {/* 1. Deck Name Section */}
            {mode !== 'manage-cards' && (
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[#AFBD96] uppercase tracking-wider">{t("Deck Name")}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(null); }}
                        placeholder={t("e.g., TOEIC Vocabulary")}
                        maxLength={36}
                        autoFocus
                        className={`w-full bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-[#EDE9DE] dark:border-[#3A5A40]'} focus:outline-none focus:ring-2 focus:ring-[#56A652]`}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
            )}

            {/* 2. Bulk Import Section */}
            {mode !== 'manage-cards' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => setIsBulkMode(!isBulkMode)}
                            className="text-xs font-semibold text-[#56A652] hover:underline"
                        >
                            {isBulkMode ? t("Return to Individual Mode") : t("Open Bulk Import")}
                        </button>
                    </div>

                    {isBulkMode && (
                        <div className="space-y-3 animate-fade-in-fast">
                            <div className="text-xs bg-[#e8e5da] dark:bg-[#446843]/30 p-3 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40]/50">
                                <p className="font-semibold text-[#1A2B22] dark:text-white mb-1">{t("Format: [Term] (Tab) [Definition]")}</p>
                                <p className="text-[#AFBD96]">{t("One card per line. You can paste from Excel or Quizlet.")}</p>
                            </div>
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                rows={6}
                                className="w-full bg-[#e8e5da] dark:bg-[#446843] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-lg p-3 focus:ring-2 focus:ring-[#56A652] focus:outline-none text-sm"
                                placeholder={"Word 1\tMeaning 1\nWord 2\tMeaning 2"}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 3. Manual Card Creation Section */}
            {!isBulkMode && (
                <div className="space-y-6 animate-fade-in-fast flex flex-col">
                    {/* Preview List */}
                    {manualTerms.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-bold text-[#AFBD96] uppercase tracking-wider">{t("Deck Cards")} ({filteredTerms.length})</label>
                            </div>

                            {/* Statistics by State */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <button
                                    onClick={() => setFilterState(filterState === null ? 'all' : null)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                        filterState === null
                                            ? 'bg-[#56A652] text-white shadow-sm'
                                            : 'bg-[#e8e5da] dark:bg-[#446843] text-[#121e18] dark:text-white hover:bg-[#56A652] hover:text-white'
                                    }`}
                                >
                                    {t("All")} ({manualTerms.length})
                                </button>
                                {[State.New, State.Learning, State.Review, State.Relearning].map(stateValue => {
                                    const label = stateLabels[stateValue];
                                    const count = stats[label] || 0;
                                    if (count === 0) return null;
                                    return (
                                        <button
                                            key={stateValue}
                                            onClick={() => setFilterState(filterState === stateValue ? null : stateValue)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                                filterState === stateValue
                                                    ? 'bg-[#56A652] text-white shadow-sm'
                                                    : 'bg-[#e8e5da] dark:bg-[#446843] text-[#121e18] dark:text-white hover:bg-[#56A652] hover:text-white'
                                            }`}
                                        >
                                            {label} ({count})
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                {filteredTerms.map((item) => {
                                    const term = item.term;
                                    const termProgress = item.progress;
                                    const key = term.id ? `term-${term.id}` : `new-${item.originalIndex}`;
                                    return (
                                        <div key={key} className="flex items-center justify-between bg-white dark:bg-[#344E41] p-3 rounded-xl border border-[#EDE9DE] dark:border-[#3A5A40] shadow-sm animate-fade-in-fast">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-[#1A2B22] dark:text-white text-sm truncate">{term.term}</span>
                                                    {term.function && <span className="text-[10px] text-[#AFBD96] italic">{term.function}</span>}
                                                </div>
                                                <p className="text-xs text-[#AFBD96] truncate">{term.definition}</p>
                                                {item.due && (
                                                    <p className="text-xs text-[#56A652] font-semibold mt-1">
                                                        {formatDueDate(item.due)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button type="button" onClick={() => handleEditManualTerm(item.originalIndex)} className="w-8 h-8 flex items-center justify-center rounded-full text-[#AFBD96] hover:text-[#56A652] hover:bg-[#56A652]/10 transition-all"><i className="fas fa-pencil-alt text-xs"></i></button>
                                                <button type="button" onClick={() => handleDeleteManualTerm(item.originalIndex)} className="w-8 h-8 flex items-center justify-center rounded-full text-[#AFBD96] hover:text-[#EE4266] hover:bg-[#EE4266]/10 transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Inputs */}
                    {isAddingCard && (
                        <div className="bg-[#e8e5da] dark:bg-[#446843]/30 p-6 rounded-2xl border border-[#EDE9DE] dark:border-[#3A5A40]/50 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#AFBD96] uppercase ml-1">{t("Front (Term)")}</label>
                                    <input
                                        type="text"
                                        placeholder={t("Enter term...")}
                                        value={currentTerm.term}
                                        onChange={(e) => setCurrentTerm({ ...currentTerm, term: e.target.value })}
                                        ref={termInputRef}
                                        className="w-full bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-4 py-2.5 rounded-xl border border-[#EDE9DE] dark:border-[#3A5A40] focus:ring-2 focus:ring-[#56A652] focus:outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#AFBD96] uppercase ml-1">{t("Back (Definition)")}</label>
                                    <input
                                        type="text"
                                        placeholder={t("Enter definition...")}
                                        value={currentTerm.definition}
                                        onChange={(e) => setCurrentTerm({ ...currentTerm, definition: e.target.value })}
                                        className="w-full bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-4 py-2.5 rounded-xl border border-[#EDE9DE] dark:border-[#3A5A40] focus:ring-2 focus:ring-[#56A652] focus:outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#AFBD96] uppercase ml-1">{t("Function")}</label>
                                    <input
                                        type="text"
                                        placeholder={t("e.g. noun, verb...")}
                                        value={currentTerm.function}
                                        onChange={(e) => setCurrentTerm({ ...currentTerm, function: e.target.value })}
                                        className="w-full bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-4 py-2.5 rounded-xl border border-[#EDE9DE] dark:border-[#3A5A40] focus:ring-2 focus:ring-[#56A652] focus:outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#AFBD96] uppercase ml-1">{t("IPA")}</label>
                                    <input
                                        type="text"
                                        placeholder={t("Pronunciation...")}
                                        value={currentTerm.ipa}
                                        onChange={(e) => setCurrentTerm({ ...currentTerm, ipa: e.target.value })}
                                        className="w-full bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-4 py-2.5 rounded-xl border border-[#EDE9DE] dark:border-[#3A5A40] focus:ring-2 focus:ring-[#56A652] focus:outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center pt-2 gap-3">
                                {mode === 'manage-cards' && (
                                    <button
                                        type="button"
                                        onClick={() => { setIsAddingCard(false); setEditingIndex(null); setCurrentTerm({term: '', definition: '', function: '', ipa: ''}); }}
                                        className="bg-transparent text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                                    >
                                        {t("Cancel")}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleAddManualTerm}
                                    className="bg-[#56A652] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 shadow-md transition-all flex items-center gap-2"
                                >
                                    <i className={`fas ${editingIndex !== null ? 'fa-check' : 'fa-plus'}`}></i>
                                    {editingIndex !== null ? t("Update Card") : t("Save Card")}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add Card Button */}
                    {!isAddingCard && (
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={handleStartAddingCard}
                                className="bg-[#56A652]/10 text-[#56A652] border border-[#56A652]/30 px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-[#56A652]/20 shadow-sm transition-all flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i>
                                {t("Add New Card")}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className={`flex ${deckId ? 'justify-between' : 'justify-end'} gap-3 pt-6 border-t border-[#EDE9DE] dark:border-[#3A5A40]`}>
                {deckId && (
                    <button
                        type="button"
                        className="px-6 py-2.5 rounded-lg text-[#EE4266] dark:text-[#EE4266] bg-[#EE4266]/10 border border-[#EE4266]/30 hover:bg-[#EE4266]/20 transition-all font-bold flex items-center gap-2"
                    >
                        <i className="fas fa-trash-alt text-xs"></i>
                        {t("Delete Deck")}
                    </button>
                )}
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg text-[#1A2B22] dark:text-white bg-[#e8e5da] dark:bg-[#446843] hover:brightness-95 transition-all font-semibold">{t("Cancel")}</button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-2.5 rounded-lg text-white bg-[#56A652] hover:brightness-110 shadow-lg transition-all font-bold flex items-center gap-2"
                    >
                        {isSaving && <i className="fas fa-spinner fa-spin"></i>}
                        {deckId ? t("Save Changes") : t("Create Deck")}
                        {!isSaving && (manualTerms.length + (currentTerm.term.trim() ? 1 : 0)) > 0 && mode !== 'manage-cards' ? `(${manualTerms.length + (currentTerm.term.trim() ? 1 : 0)} ${t("cards")})` : ''}
                    </button>
                </div>
            </div>
        </form>
    );
};
