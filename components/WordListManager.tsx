
import React, { useState, useCallback, useEffect } from 'react';
import { useWords } from '../hooks/useWords';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { Term } from '../types';
import { useParams } from 'react-router-dom';

import { PencilIcon, XMarkIcon } from './icons/Icons';

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

const DeckEditor: React.FC<{ deckId: number, isEditMode: boolean, exitEditMode: () => void, startInAddMode?: boolean }> = ({ deckId, isEditMode, exitEditMode, startInAddMode }) => {
    const { getTermsForDeck, addTermsToDeck, updateTerm, deleteTerm } = useWords();
    const { t } = useLanguage();
    const [newTerms, setNewTerms] = useState([{ term: '', definition: '', function: '', ipa: '' }]);
    const deckTerms = getTermsForDeck(deckId);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');

    const [editingTermId, setEditingTermId] = useState<number | null>(null);
    const [editedTerm, setEditedTerm] = useState({ term: '', definition: '', function: '', ipa: '' });
    const [isAddingNewCards, setIsAddingNewCards] = useState(false);

    // Show/hide the "Add New" form when edit mode is toggled
    useEffect(() => {
        if (isEditMode) {
            setNewTerms([{ term: '', definition: '', function: '', ipa: '' }]);
            // If it's a new deck, show the form automatically. Otherwise, hide it.
            setIsAddingNewCards(!!startInAddMode);
        } else {
            // When not in edit mode, always hide the form.
            setIsAddingNewCards(false);
        }
    }, [isEditMode, startInAddMode]);

    const handleSaveNewTerms = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        const termsToAdd = newTerms
            .filter(t => t.term.trim() && t.definition.trim())
            .map(t => ({
                ...t,
                ipa: formatIPA(t.ipa),
                function: formatFunction(t.function)
            }));

        if (termsToAdd.length > 0) {
            addTermsToDeck(deckId, termsToAdd);
        }
        exitEditMode();
    }, [newTerms, deckId, addTermsToDeck, exitEditMode]);


    const handleNewTermChange = (index: number, field: 'term' | 'definition' | 'function' | 'ipa', value: string) => {
        const updated = [...newTerms];
        updated[index] = { ...updated[index], [field]: value };
        setNewTerms(updated);
    };

    const handleEditedTermChange = (field: 'term' | 'definition' | 'function' | 'ipa', value: string) => {
        setEditedTerm(prev => ({ ...prev, [field]: value }));
    };

    const addRow = () => {
        setNewTerms([...newTerms, { term: '', definition: '', function: '', ipa: '' }]);
    };

    const removeRow = (index: number) => {
        if (newTerms.length > 1) {
            setNewTerms(newTerms.filter((_, i) => i !== index));
        }
    };

    const handleImport = () => {
        const lines = importText.split('\n').filter(line => line.trim() !== '');
        const parsedTerms = lines.map(line => {
            const parts = line.split('\t').map(p => p.trim());
            if (parts.length === 2) {
                return { term: parts[0], definition: parts[1], function: '', ipa: '' };
            } else if (parts.length === 4) {
                return { term: parts[0], function: formatFunction(parts[1]), ipa: formatIPA(parts[2]), definition: parts[3] };
            }
            return null;
        }).filter((term): term is { term: string; definition: string; function: string; ipa: string; } => term !== null);

        if (parsedTerms.length > 0) {
            const existingNonEmpty = newTerms.filter(nt => nt.term.trim() !== '' || nt.definition.trim() !== '');
            setNewTerms([...existingNonEmpty, ...parsedTerms]);
        }

        setIsImportModalOpen(false);
        setImportText('');
    };

    const handleEditClick = (term: Term) => {
        setEditingTermId(term.id);
        setEditedTerm({ term: term.term, definition: term.definition, function: term.function, ipa: term.ipa });
    };

    const handleCancelEdit = () => {
        setEditingTermId(null);
    };

    const handleSaveEdit = (termId: number) => {
        const formattedTerm = {
            ...editedTerm,
            ipa: formatIPA(editedTerm.ipa),
            function: formatFunction(editedTerm.function),
        };
        updateTerm(termId, formattedTerm);
        setEditingTermId(null);
    };

    return (
        <div className="px-2 py-3 bg-slate-50 dark:bg-[#344E41]/50">
            {!startInAddMode && (
                <>
                    <div className="flex justify-between items-center mb-3 px-4">
                        {!startInAddMode && (
                            <h4 className="text-lg font-semibold text-[#1A2B22] dark:text-white/90">{t("Cards in this Deck")}</h4>
                        )}                {isEditMode && !isAddingNewCards && (
                            <button
                                type="button"
                                onClick={() => setIsAddingNewCards(true)}
                                className="bg-[#446843] hover:bg-[#467645] text-white font-bold py-1 px-3 rounded-md transition-colors flex items-center gap-2 text-sm"
                                aria-label="Add new cards"
                            >
                                <i className="fas fa-plus"></i> {t("Add New")}
                            </button>
                        )}
                    </div>

                    {deckTerms.length === 0 && !isEditMode && (
                        <p className="text-[#AFBD96] italic text-sm my-4 px-4">{t("This deck is empty. Click 'Edit' to add your first card.")}</p>
                    )}

                    {deckTerms.length > 0 && (
                        <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto pr-2 pl-4">
                            {deckTerms.map((term, index) => (
                                editingTermId === term.id ? (
                                    // EDITING VIEW for a single card
                                    <li key={term.id} className="bg-[#e8e5da] dark:bg-[#446843]/50 p-3 rounded-md animate-fade-in-fast">
                                        <div className="w-full flex items-start gap-2">
                                            <span className="pt-2 w-8 text-right font-mono text-[#AFBD96] shrink-0">{index + 1}.</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                                <input type="text" placeholder={t("Term *")} value={editedTerm.term} onChange={e => handleEditedTermChange('term', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
                                                <input type="text" placeholder={t("Definition *")} value={editedTerm.definition} onChange={e => handleEditedTermChange('definition', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
                                                <input type="text" placeholder={t("Function")} value={editedTerm.function} onChange={e => handleEditedTermChange('function', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
                                                <input type="text" placeholder={t("IPA")} value={editedTerm.ipa} onChange={e => handleEditedTermChange('ipa', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
                                            </div>
                                            <div className="flex flex-col gap-2 pt-1">
                                                <button onClick={() => handleSaveEdit(term.id)} className="text-[#56A652] hover:brightness-125 transition-transform transform hover:scale-110"><i className="fas fa-save"></i></button>
                                                <button onClick={handleCancelEdit} className="text-[#AFBD96] hover:text-[#1A2B22] dark:hover:text-white transition-colors"><i className="fas fa-times"></i></button>
                                            </div>
                                        </div>
                                    </li>
                                ) : (
                                    // DISPLAY VIEW for a single card
                                    <li key={term.id} className="flex items-start justify-between gap-3 bg-[#e8e5da] dark:bg-[#446843]/50 p-3 rounded-md">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <span className="w-6 shrink-0 text-right font-mono text-sm text-[#AFBD96] pt-1">{index + 1}.</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-x-3 flex-wrap">
                                                    <span className="font-bold text-base text-[#1A2B22] dark:text-white">{term.term}</span>
                                                    {term.function && <span className="text-sm italic text-[#AFBD96]">{term.function}</span>}
                                                    {term.ipa && <span className="font-mono text-sm text-[#AFBD96]">{term.ipa}</span>}
                                                </div>
                                                <p className="text-sm text-[#1A2B22]/80 dark:text-white/80 mt-1 break-words">{term.definition}</p>
                                            </div>
                                        </div>
                                        {isEditMode && (
                                            <div className="flex items-center gap-3 pl-2">
                                                <button onClick={() => handleEditClick(term)} className="text-[#AFBD96] hover:text-[#56A652] transition-colors"><i className="fas fa-pencil-alt"></i></button>
                                                <button onClick={() => deleteTerm(term.id)} className="text-[#AFBD96] hover:text-[#EE4266] transition-colors"><i className="fas fa-trash-alt"></i></button>
                                            </div>
                                        )}
                                    </li>
                                )
                            ))}
                        </ul>
                    )}
                </>
            )}

            {isEditMode && isAddingNewCards && (
                <form onSubmit={handleSaveNewTerms} className="animate-fade-in-fast">
                    <div className="w-3/4 mx-auto h-px bg-[#EDE9DE] dark:bg-[#3A5A40] mb-4"></div> {/* Moved divider inside form, adjusted margin */}
                    <div className="flex items-center justify-between mb-3 pt-4 px-4">                        <h4 className="text-lg font-semibold text-[#1A2B22] dark:text-white/90">{t("Add New Cards")}</h4>
                        <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-sm font-semibold text-[#56A652] hover:underline">
                            <i className="fas fa-file-import mr-2"></i>{t("Bulk Import")}
                        </button>
                    </div>
                    <div className="space-y-4 mb-4 px-4">
                        {newTerms.map((nt, index) => (
                            <div key={index} className="flex items-start gap-2 animate-fade-in-fast">
                                <span className="pt-2 w-8 text-right font-mono text-[#AFBD96] shrink-0">{index + 1}.</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                    <input
                                        type="text"
                                        placeholder={t("Term *")}
                                        value={nt.term}
                                        onChange={(e) => handleNewTermChange(index, 'term', e.target.value)}
                                        className="bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]"
                                    />
                                    <input
                                        type="text"
                                        placeholder={t("Definition *")}
                                        value={nt.definition}
                                        onChange={(e) => handleNewTermChange(index, 'definition', e.target.value)}
                                        className="bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]"
                                    />
                                    <input
                                        type="text"
                                        placeholder={t("Function (e.g., n, adj, adv, v)")}
                                        value={nt.function}
                                        onChange={(e) => handleNewTermChange(index, 'function', e.target.value)}
                                        onBlur={(e) => {
                                            const formatted = formatFunction(e.target.value);
                                            if (formatted !== nt.function) {
                                                handleNewTermChange(index, 'function', formatted);
                                            }
                                        }}
                                        className="bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]"
                                    />
                                    <input
                                        type="text"
                                        placeholder={t("IPA (Optional)")}
                                        value={nt.ipa}
                                        onChange={(e) => handleNewTermChange(index, 'ipa', e.target.value)}
                                        onBlur={(e) => {
                                            const formatted = formatIPA(e.target.value);
                                            if (formatted !== nt.ipa) {
                                                handleNewTermChange(index, 'ipa', formatted);
                                            }
                                        }}
                                        className="bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]"
                                    />
                                </div>
                                <button type="button" onClick={() => removeRow(index)} disabled={newTerms.length <= 1} className="text-[#EE4266] hover:brightness-90 disabled:text-[#AFBD96] disabled:cursor-not-allowed p-2 rounded-full bg-[#e8e5da] dark:bg-[#446843]/50 hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors">
                                    <i className="fas fa-minus-circle"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 px-4 justify-center">
                        <button type="button" onClick={addRow} className="bg-[#446843] hover:bg-[#467645] text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                            <i className="fas fa-plus"></i> {t("Add Row")}
                        </button>
                        <button type="submit" className="bg-[#56A652] hover:brightness-90 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                            <i className="fas fa-save"></i> {t("Save Cards")}
                        </button>
                    </div>
                </form>
            )}

            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast p-4">
                    <div className="bg-white dark:bg-[#344E41] rounded-lg shadow-xl p-6 w-full max-w-2xl border border-[#EDE9DE] dark:border-[#3A5A40]">
                        <h2 className="text-2xl font-bold mb-4">{t("Bulk Import Cards")}</h2>
                        <p className="text-[#AFBD96] mb-2">{t("Paste your card data below. Each new line represents a separate card.")}</p>
                        <div className="text-sm bg-[#e8e5da] dark:bg-[#446843]/50 p-3 rounded-md mb-4 border border-[#EDE9DE] dark:border-[#3A5A40]/50">
                            <p className="font-semibold text-[#1A2B22] dark:text-white">{t("Supported Formats (use Tab to separate fields):")}</p>
                            <code className="block mt-2 text-[#1A2B22]/80 dark:text-white/80">[Term] (Tab) [Definition]</code>
                            <code className="block mt-1 text-[#1A2B22]/80 dark:text-white/80">[Term] (Tab) [Function] (Tab) [IPA] (Tab) [Definition]</code>
                        </div>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            rows={10}
                            className="w-full bg-[#F1F5F9] dark:bg-[#1A2B22] border border-[#EDE9DE] dark:border-[#3A5A40] rounded-md p-2 focus:ring-2 focus:ring-[#56A652] focus:outline-none"
                            placeholder={"Term 1\tDefinition 1\nTerm 2\tn\t/ipa/\tDefinition 2"}
                        />
                        <div className="flex justify-end gap-4 mt-4">
                            <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 rounded-md text-[#1A2B22] dark:text-white bg-[#e8e5da] dark:bg-[#446843] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors">{t("Cancel")}</button>
                            <button type="button" onClick={handleImport} className="px-4 py-2 rounded-md text-white bg-[#56A652] hover:brightness-90 transition-colors font-semibold">{t("Import Cards")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const WordListManager: React.FC = () => {
    const { decks, addDeck, renameDeck, deleteDeck, getTermsForDeck } = useWords();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [newDeckName, setNewDeckName] = useState('');
    const [deckNameError, setDeckNameError] = useState<string | null>(null);
    const { deckId: paramDeckId } = useParams<{ deckId: string }>();
    const [searchTerm, setSearchTerm] = useState('');

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const validateDeckName = (name: string): string | null => {
        if (!name.trim()) {
            return t("Deck name cannot be empty.");
        }
        // Regex for alphanumeric and spaces
        if (!/^[a-zA-Z0-9 ]*$/.test(name)) {
            return t("Deck name contains invalid characters. Only letters, numbers, and spaces are allowed.");
        }
        // Uniqueness check
        if (decks.some(deck => deck.name.toLowerCase() === name.trim().toLowerCase())) {
            return t("A deck with this name already exists.");
        }
        return null; // No error
    };

    const initialDeckId = paramDeckId ? parseInt(paramDeckId) : null;

    const [expandedDeckId, setExpandedDeckId] = useState<number | null>(initialDeckId);
    const [editModeDeckId, setEditModeDeckId] = useState<number | null>(initialDeckId);
    const [isRenamingDeckNameId, setIsRenamingDeckNameId] = useState<number | null>(null);
    const [editedDeckName, setEditedDeckName] = useState<string>(''); // New state for edited deck name
    const [renameDeckNameError, setRenameDeckNameError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newlyCreatedDeckId, setNewlyCreatedDeckId] = useState<number | null>(null);

    // If a deckId is provided in the URL, ensure it's expanded and in edit mode
    useEffect(() => {
        if (initialDeckId && !expandedDeckId) {
            setExpandedDeckId(initialDeckId);
            setEditModeDeckId(initialDeckId);
        }
    }, [initialDeckId]);

    // FIX: The `addDeck` function returns a promise. We need to `await` its result
    // before using it to set state, which requires this handler to be `async`.
    const handleAddDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newDeckName.trim();
        const error = validateDeckName(trimmedName);

        if (error) {
            setDeckNameError(error);
            return;
        }

        setDeckNameError(null); // Clear previous errors

        const newId = await addDeck(trimmedName);
        setNewDeckName('');
        // Automatically expand and enter edit mode for new decks
        setExpandedDeckId(newId);
        setEditModeDeckId(newId);
        setNewlyCreatedDeckId(newId);
    };

    const toggleDeck = (id: number) => {
        setNewlyCreatedDeckId(null);
        const isCurrentlyExpanded = expandedDeckId === id;
        if (isCurrentlyExpanded) {
            setExpandedDeckId(null);
            setEditModeDeckId(null); // Also exit edit mode when collapsing
            setIsRenamingDeckNameId(null); // Also exit name edit mode
        } else {
            setExpandedDeckId(id);
        }
    };

    const handleToggleEdit = (e: React.MouseEvent, deckId: number) => {
        e.stopPropagation();
        setNewlyCreatedDeckId(null);
        setEditModeDeckId(prevId => {
            const isEditingThisDeck = prevId === deckId;
            if (isEditingThisDeck) {
                // Was editing, now we cancel
                setIsRenamingDeckNameId(null); // Clear renaming state
                return null;
            } else {
                // Was not editing, now we start
                setExpandedDeckId(deckId); // make sure it's expanded
                return deckId;
            }
        });
    };

    const handleExitEditMode = () => {
        setEditModeDeckId(null);
        setIsRenamingDeckNameId(null);
        setRenameDeckNameError(null);
    };

    const handleSaveDeck = async (e: React.MouseEvent, deck: { id: number; name: string }) => {
        e.stopPropagation();
        if (isSaving) return;

        // If the user was renaming, validate and commit the new name
        if (isRenamingDeckNameId === deck.id) {
            const trimmedName = editedDeckName.trim();

            // Validation: deck name cannot be empty
            if (!trimmedName) {
                setRenameDeckNameError(t("Deck name cannot be empty."));
                return;
            }

            // Validation: only allowed characters
            if (!/^[a-zA-Z0-9 ]*$/.test(trimmedName)) {
                setRenameDeckNameError(t("Deck name contains invalid characters. Only letters, numbers, and spaces are allowed."));
                return;
            }

            // Validation: uniqueness (excluding the current deck)
            if (decks.some(d => d.id !== deck.id && d.name.toLowerCase() === trimmedName.toLowerCase())) {
                setRenameDeckNameError(t("A deck with this name already exists."));
                return;
            }

            setRenameDeckNameError(null);
            setIsSaving(true);

            try {
                await renameDeck(deck.id, trimmedName);
                showToast({ message: t('Deck renamed successfully!'), duration: 3000 });
            } catch (err) {
                console.error('Failed to rename deck:', err);
                showToast({ message: t('Failed to rename deck.'), duration: 3000 });
                setIsSaving(false);
                return;
            }
        }

        // Exit edit mode on successful save
        setIsSaving(false);
        setEditModeDeckId(null);
        setIsRenamingDeckNameId(null);
        setRenameDeckNameError(null);
        setNewlyCreatedDeckId(null);
    };

    const handleCancelEdit = (e: React.MouseEvent, deckId: number) => {
        e.stopPropagation();
        setNewlyCreatedDeckId(null);
        setEditModeDeckId(null);
        setIsRenamingDeckNameId(null);
        setRenameDeckNameError(null);
        setEditedDeckName('');
    };

    const filteredDecks = decks.filter(deck =>
        deck.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{t("Manage My Decks")}</h1>

            <div className="bg-white dark:bg-[#344E41] p-6 rounded-lg shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40] mb-8">
                <h2 className="text-2xl font-bold mb-4">{t("Create New Deck")}</h2>
                <form onSubmit={handleAddDeck} className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={newDeckName}
                            onChange={(e) => {
                                setNewDeckName(e.target.value);
                                setDeckNameError(null); // Clear error on change
                            }}
                            placeholder={t("e.g., TOEIC Vocabulary")}
                            maxLength={36}
                            className={`flex-grow bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-4 py-2 rounded-md border ${deckNameError ? 'border-red-500' : 'border-[#EDE9DE] dark:border-[#3A5A40]'} focus:outline-none focus:ring-2 focus:ring-[#56A652]`}
                        />                        <button
                            type="submit"
                            className="bg-[#56A652] text-white font-bold py-2 px-6 rounded-md hover:brightness-90 transition-colors disabled:bg-[#AFBD96] dark:disabled:bg-[#3A5A40] disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <i className="fas fa-plus mr-2"></i> {t("Create Deck")}
                        </button>
                    </div>
                    {deckNameError && (
                        <p className="text-red-500 text-sm pl-1">{deckNameError}</p>
                    )}
                </form>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-baseline">
                    <h2 className="text-2xl font-bold">{t("My Decks")}</h2>
                    <span className="text-[#AFBD96] text-lg ml-2">({decks.length} {t("decks")})</span>
                </div>
                <div className="relative w-full max-w-xs">
                    <input
                        type="text"
                        placeholder={t("Search decks...")}
                        className="w-full py-2 pl-8 pr-8 rounded-lg bg-white dark:bg-[#344E41] border border-[#EDE9DE] dark:border-[#3A5A40] text-[#121e18] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#56A652] text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[#AFBD96] text-sm"></i>
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AFBD96] hover:text-[#EE4266] transition-colors"
                            aria-label={t("Clear search")}
                        >
                            <i className="fas fa-times text-sm"></i>
                        </button>
                    )}
                </div>
            </div>
            {filteredDecks.length === 0 && decks.length > 0 && (
                <p className="text-[#AFBD96] text-center text-lg mt-8">{t("No decks found matching your search.")}</p>
            )}
            {decks.length === 0 && <p className="text-[#AFBD96]">{t("You don't have any decks yet.")}</p>}
            <div className="space-y-4">
                {filteredDecks.map(deck => (
                    <div key={deck.id} className="bg-white dark:bg-[#344E41] rounded-lg border border-[#EDE9DE] dark:border-[#3A5A40] transition-all duration-300 shadow-md">
                        <div className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#446843]/50" onClick={() => toggleDeck(deck.id)}>
                            <div>
                                <div className="flex items-center group">
                                    {isRenamingDeckNameId === deck.id ? (
                                        <div className="flex flex-col">
                                            <input
                                                type="text"
                                                value={editedDeckName}
                                                onChange={(e) => {
                                                    setEditedDeckName(e.target.value);
                                                    setRenameDeckNameError(null); // Clear error on change
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleSaveDeck(e as any, deck);
                                                    }
                                                }}
                                                maxLength={36}
                                                autoFocus
                                                className={`text-xl font-bold bg-transparent border-b ${renameDeckNameError ? 'border-red-500' : 'border-[#56A652] dark:border-white'} focus:outline-none focus:ring-0 text-[#1A2B22] dark:text-white transition-colors duration-200`}
                                            />
                                            {renameDeckNameError && (
                                                <p className="text-red-500 text-xs mt-1 animate-fade-in-fast">{renameDeckNameError}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <h3 className="text-xl font-bold text-[#1A2B22] dark:text-white">{deck.name}</h3>
                                    )}
                                    {editModeDeckId === deck.id && ( // Only render button if in general edit mode
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent parent accordion from toggling
                                                const willEnterRenameMode = isRenamingDeckNameId !== deck.id;
                                                setIsRenamingDeckNameId(willEnterRenameMode ? deck.id : null);
                                                if (willEnterRenameMode) {
                                                    setEditedDeckName(deck.name); // Initialize with current name when entering rename mode
                                                }
                                            }}
                                            className="ml-2 text-gray-400 group-hover:text-[#1A2B22] dark:group-hover:text-white transition-all duration-300"
                                            aria-label={isRenamingDeckNameId === deck.id ? t("Cancel renaming deck") : t("Rename deck")}
                                        >
                                            {isRenamingDeckNameId === deck.id ? ( // If actively renaming, show X
                                                <XMarkIcon className="w-5 h-5" />
                                            ) : ( // Otherwise, show Pencil (indicating available for rename)
                                                <PencilIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                                <p className="text-[#AFBD96] text-sm mb-0">{getTermsForDeck(deck.id).length} {t("cards")}</p>
                                {deck.created_at && (
                                    <p className="text-[#AFBD96] text-sm">
                                        {t("Created at")}: {new Date(deck.created_at).toLocaleDateString('en-GB')}
                                    </p>
                                )}
                                {/* Placeholder for Last Studied Date - UI Only */}
                                {true && ( // Always render for UI only
                                    <p className="text-[#AFBD96] text-sm">
                                        {t("Last studied")}: {new Date('2024-02-18T10:00:00Z').toLocaleDateString('en-GB')} {/* Example date */}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    {editModeDeckId === deck.id ? ( // Show Save and Cancel when in edit mode
                                        <>
                                            {/* Save Button */}
                                            <button
                                                onClick={(e) => handleSaveDeck(e, deck)}
                                                disabled={isSaving}
                                                className="px-3 py-1 rounded-md transition-colors text-sm font-semibold flex items-center bg-[#56A652] text-white hover:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed"
                                                aria-label={t("Save changes")}
                                            >
                                                <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} mr-2`}></i> {t("Save")}
                                            </button>

                                            {/* Cancel Button */}
                                            <button
                                                onClick={(e) => handleCancelEdit(e, deck.id)}
                                                disabled={isSaving}
                                                className="px-3 py-1 rounded-md transition-colors text-sm font-semibold flex items-center bg-[#AFBD96] text-[#1A2B22] hover:bg-[#CDC6AE] dark:bg-[#344E41] dark:text-white dark:hover:bg-[#3A5A40] disabled:opacity-60 disabled:cursor-not-allowed"
                                                aria-label={t("Cancel editing")}
                                            >
                                                <i className="fas fa-times mr-2"></i> {t("Cancel")}
                                            </button>
                                        </>
                                    ) : ( // Show only Edit button when not in edit mode
                                        <button
                                            onClick={(e) => handleToggleEdit(e, deck.id)}
                                            className="px-3 py-1 rounded-md transition-colors text-sm font-semibold flex items-center text-[#56A652] bg-[#56A652]/20 dark:bg-[#56A652]/30 hover:bg-[#56A652]/30 dark:hover:bg-[#56A652]/40"
                                            aria-label={t("Edit deck")}
                                        >
                                            <i className="fas fa-edit mr-2"></i> {t("Edit")}
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                                        className="text-[#EE4266] hover:brightness-90 bg-[#EE4266]/20 dark:bg-[#EE4266]/30 hover:bg-[#EE4266]/30 dark:hover:bg-[#EE4266]/40 px-3 py-1 rounded-md transition-colors text-sm font-semibold flex items-center"
                                    >
                                        <i className="fas fa-trash-alt mr-2"></i> {t("Delete")}
                                    </button>
                                </div>
                                <i className={`fas fa-chevron-down text-[#AFBD96] transition-transform duration-300 ${expandedDeckId === deck.id ? 'rotate-180' : ''}`}></i>
                            </div>
                        </div>
                        {expandedDeckId === deck.id && (
                            <>
                                {!(deck.id === newlyCreatedDeckId) && ( // Show divider if "Cards in Deck" section is visible
                                    <div className="w-3/4 mx-auto h-px bg-[#EDE9DE] dark:bg-[#3A5A40] my-2"></div>
                                )}
                                <DeckEditor deckId={deck.id} isEditMode={editModeDeckId === deck.id} exitEditMode={handleExitEditMode} startInAddMode={deck.id === newlyCreatedDeckId} />
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
