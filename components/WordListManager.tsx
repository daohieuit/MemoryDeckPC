
import React, { useState, useCallback, useEffect } from 'react';
import { useWords } from '../hooks/useWords';
import { Term } from '../types';

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

const DeckEditor: React.FC<{ deckId: number, isEditMode: boolean, exitEditMode: () => void }> = ({ deckId, isEditMode, exitEditMode }) => {
    const { getTermsForDeck, addTermsToDeck, updateTerm, deleteTerm } = useWords();
    const [newTerms, setNewTerms] = useState([{ term: '', definition: '', function: '', ipa: '' }]);
    const deckTerms = getTermsForDeck(deckId);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');

    const [editingTermId, setEditingTermId] = useState<number | null>(null);
    const [editedTerm, setEditedTerm] = useState({ term: '', definition: '', function: '', ipa: '' });

    // Reset the new card form when entering edit mode.
    useEffect(() => {
        if (isEditMode) {
            setNewTerms([{ term: '', definition: '', function: '', ipa: '' }]);
        }
    }, [isEditMode]);

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
        <div className="mt-2 p-4 bg-slate-50 dark:bg-[#344E41]/50 border-t border-[#EDE9DE] dark:border-[#3A5A40]">
            <h4 className="text-lg font-semibold text-[#1A2B22] dark:text-white/90 mb-3">Cards in this Deck</h4>

            {deckTerms.length === 0 && !isEditMode && (
                <p className="text-[#AFBD96] italic text-sm my-4">This deck is empty. Click 'Edit' to add your first card.</p>
            )}

            {deckTerms.length > 0 && (
                <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto pr-2">
                    {deckTerms.map((term, index) => (
                        editingTermId === term.id ? (
                            // EDITING VIEW for a single card
                            <li key={term.id} className="bg-[#e8e5da] dark:bg-[#446843]/50 p-3 rounded-md animate-fade-in-fast">
                                <div className="w-full flex items-start gap-2">
                                    <span className="pt-2 w-8 text-right font-mono text-[#AFBD96] shrink-0">{index + 1}.</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                        <input type="text" placeholder="Term *" value={editedTerm.term} onChange={e => handleEditedTermChange('term', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
                                        <input type="text" placeholder="Definition *" value={editedTerm.definition} onChange={e => handleEditedTermChange('definition', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
                                        <input type="text" placeholder="Function" value={editedTerm.function} onChange={e => handleEditedTermChange('function', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
                                        <input type="text" placeholder="IPA" value={editedTerm.ipa} onChange={e => handleEditedTermChange('ipa', e.target.value)} className="bg-white dark:bg-[#344E41] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#CDC6AE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]" />
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
                                        <button onClick={() => { console.log('Delete button clicked, term.id:', term.id); deleteTerm(term.id); }} className="text-[#AFBD96] hover:text-[#EE4266] transition-colors"><i className="fas fa-trash-alt"></i></button>
                                    </div>
                                )}
                            </li>
                        )
                    ))}
                </ul>
            )}

            {isEditMode && (
                <form onSubmit={handleSaveNewTerms}>
                    <div className="flex items-center justify-between mb-3 pt-4 border-t border-[#EDE9DE] dark:border-[#3A5A40]">
                        <h4 className="text-lg font-semibold text-[#1A2B22] dark:text-white/90">Add New Cards</h4>
                        <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-sm font-semibold text-[#56A652] hover:underline">
                            <i className="fas fa-file-import mr-2"></i>Bulk Import
                        </button>
                    </div>
                    <div className="space-y-4 mb-4">
                        {newTerms.map((nt, index) => (
                            <div key={index} className="flex items-start gap-2 animate-fade-in-fast">
                                <span className="pt-2 w-8 text-right font-mono text-[#AFBD96] shrink-0">{index + 1}.</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                    <input
                                        type="text"
                                        placeholder="Term *"
                                        value={nt.term}
                                        onChange={(e) => handleNewTermChange(index, 'term', e.target.value)}
                                        className="bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Definition *"
                                        value={nt.definition}
                                        onChange={(e) => handleNewTermChange(index, 'definition', e.target.value)}
                                        className="bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-3 py-2 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Function (e.g., n, adj, adv, v)"
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
                                        placeholder="IPA (Optional)"
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
                    <div className="flex gap-4">
                        <button type="button" onClick={addRow} className="bg-[#446843] hover:bg-[#467645] text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                            <i className="fas fa-plus"></i> Add Row
                        </button>
                        <button type="submit" className="bg-[#56A652] hover:brightness-90 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                            <i className="fas fa-save"></i> Save Cards
                        </button>
                    </div>
                </form>
            )}

            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast p-4">
                    <div className="bg-white dark:bg-[#344E41] rounded-lg shadow-xl p-6 w-full max-w-2xl border border-[#EDE9DE] dark:border-[#3A5A40]">
                        <h2 className="text-2xl font-bold mb-4">Bulk Import Cards</h2>
                        <p className="text-[#AFBD96] mb-2">Paste your card data below. Each new line represents a separate card.</p>
                        <div className="text-sm bg-[#e8e5da] dark:bg-[#446843]/50 p-3 rounded-md mb-4 border border-[#EDE9DE] dark:border-[#3A5A40]/50">
                            <p className="font-semibold text-[#1A2B22] dark:text-white">Supported Formats (use Tab to separate fields):</p>
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
                            <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 rounded-md text-[#1A2B22] dark:text-white bg-[#e8e5da] dark:bg-[#446843] hover:bg-[#CDC6AE] dark:hover:bg-[#467645] transition-colors">Cancel</button>
                            <button type="button" onClick={handleImport} className="px-4 py-2 rounded-md text-white bg-[#56A652] hover:brightness-90 transition-colors font-semibold">Import Cards</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const WordListManager: React.FC = () => {
    const { decks, addDeck, deleteDeck, getTermsForDeck } = useWords();
    const [newDeckName, setNewDeckName] = useState('');
    const [expandedDeckId, setExpandedDeckId] = useState<number | null>(null);
    const [editModeDeckId, setEditModeDeckId] = useState<number | null>(null);

    // FIX: The `addDeck` function returns a promise. We need to `await` its result
    // before using it to set state, which requires this handler to be `async`.
    const handleAddDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newDeckName.trim()) {
            const newId = await addDeck(newDeckName.trim());
            setNewDeckName('');
            // Automatically expand and enter edit mode for new decks
            setExpandedDeckId(newId);
            setEditModeDeckId(newId);
        }
    };

    const toggleDeck = (id: number) => {
        const isCurrentlyExpanded = expandedDeckId === id;
        if (isCurrentlyExpanded) {
            setExpandedDeckId(null);
            setEditModeDeckId(null); // Also exit edit mode when collapsing
        } else {
            setExpandedDeckId(id);
        }
    };

    const handleToggleEdit = (e: React.MouseEvent, deckId: number) => {
        e.stopPropagation();
        setEditModeDeckId(prevId => {
            const isEditingThisDeck = prevId === deckId;
            if (isEditingThisDeck) {
                // Was editing, now we cancel
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
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Manage My Decks</h1>

            <div className="bg-white dark:bg-[#344E41] p-6 rounded-lg shadow-lg border border-[#EDE9DE] dark:border-[#3A5A40] mb-8">
                <h2 className="text-2xl font-bold mb-4">Create New Deck</h2>
                <form onSubmit={handleAddDeck} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        placeholder="e.g., TOEIC Vocabulary"
                        className="flex-grow bg-[#e8e5da] dark:bg-[#446843] text-[#1A2B22] dark:text-white px-4 py-2 rounded-md border border-[#EDE9DE] dark:border-[#3A5A40] focus:outline-none focus:ring-2 focus:ring-[#56A652]"
                    />
                    <button
                        type="submit"
                        disabled={!newDeckName.trim()}
                        className="bg-[#56A652] text-white font-bold py-2 px-6 rounded-md hover:brightness-90 transition-colors disabled:bg-[#AFBD96] dark:disabled:bg-[#3A5A40] disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <i className="fas fa-plus mr-2"></i> Create Deck
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold border-b border-[#EDE9DE] dark:border-[#3A5A40] pb-2">Your Decks</h2>
                {decks.length === 0 && <p className="text-[#AFBD96]">You don't have any decks yet.</p>}
                {decks.map(deck => (
                    <div key={deck.id} className="bg-white dark:bg-[#344E41] rounded-lg border border-[#EDE9DE] dark:border-[#3A5A40] transition-all duration-300 shadow-md">
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#446843]/50" onClick={() => toggleDeck(deck.id)}>
                            <div>
                                <h3 className="text-xl font-bold text-[#1A2B22] dark:text-white">{deck.name}</h3>
                                <p className="text-[#AFBD96]">{getTermsForDeck(deck.id).length} cards</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleToggleEdit(e, deck.id)}
                                        className={`px-3 py-1 rounded-md transition-colors text-sm font-semibold flex items-center ${editModeDeckId === deck.id
                                                ? 'text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500'
                                                : 'text-[#56A652] bg-[#56A652]/20 dark:bg-[#56A652]/30 hover:bg-[#56A652]/30 dark:hover:bg-[#56A652]/40'
                                            }`}
                                    >
                                        {editModeDeckId === deck.id
                                            ? <><i className="fas fa-times mr-2"></i>Cancel</>
                                            : <><i className="fas fa-edit mr-2"></i>Edit</>
                                        }
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                                        className="text-[#EE4266] hover:brightness-90 bg-[#EE4266]/20 dark:bg-[#EE4266]/30 hover:bg-[#EE4266]/30 dark:hover:bg-[#EE4266]/40 px-3 py-1 rounded-md transition-colors text-sm font-semibold flex items-center"
                                    >
                                        <i className="fas fa-trash-alt mr-2"></i> Delete
                                    </button>
                                </div>
                                <i className={`fas fa-chevron-down text-[#AFBD96] transition-transform duration-300 ${expandedDeckId === deck.id ? 'rotate-180' : ''}`}></i>
                            </div>
                        </div>
                        {expandedDeckId === deck.id && <DeckEditor deckId={deck.id} isEditMode={editModeDeckId === deck.id} exitEditMode={handleExitEditMode} />}
                    </div>
                ))}
            </div>
        </div>
    );
};
