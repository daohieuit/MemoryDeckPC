import React, { useState } from 'react';
import { useWords } from '../hooks/useWords';

const DeckEditor: React.FC<{ deckId: number }> = ({ deckId }) => {
    const { getTermsForDeck, addTermsToDeck } = useWords();
    const [newTerms, setNewTerms] = useState([{ term: '', definition: '', function: '', ipa: '' }]);
    const deckTerms = getTermsForDeck(deckId);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');

    const formatIPA = (ipa: string): string => {
        const content = ipa.trim().replace(/^\/|\/$/g, '').trim();
        return content ? `/${content}/` : '';
    };

    const handleNewTermChange = (index: number, field: 'term' | 'definition' | 'function' | 'ipa', value: string) => {
        const updated = [...newTerms];
        updated[index] = { ...updated[index], [field]: value };
        setNewTerms(updated);
    };

    const addRow = () => {
        setNewTerms([...newTerms, { term: '', definition: '', function: '', ipa: '' }]);
    };

    const removeRow = (index: number) => {
        if (newTerms.length > 1) {
            setNewTerms(newTerms.filter((_, i) => i !== index));
        }
    };

    const handleSaveTerms = (e: React.FormEvent) => {
        e.preventDefault();
        const termsToAdd = newTerms
            .filter(t => t.term.trim() && t.definition.trim())
            .map(t => ({ ...t, ipa: formatIPA(t.ipa) }));

        if (termsToAdd.length > 0) {
            addTermsToDeck(deckId, termsToAdd);
            setNewTerms([{ term: '', definition: '', function: '', ipa: '' }]);
        }
    };

    const handleImport = () => {
        const lines = importText.split('\n').filter(line => line.trim() !== '');
        const parsedTerms = lines.map(line => {
            const parts = line.split('\t').map(p => p.trim());
            if (parts.length === 2) {
                return { term: parts[0], definition: parts[1], function: '', ipa: '' };
            } else if (parts.length === 4) {
                return { term: parts[0], function: parts[1], ipa: formatIPA(parts[2]), definition: parts[3] };
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


    return (
        <div className="mt-2 p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">Cards in this Deck</h4>
            {deckTerms.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 italic text-sm mb-4">This deck is empty. Add your first card below!</p>
            ) : (
                <ul className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                    {deckTerms.map((term, index) => (
                        <li key={term.id} className="flex items-center gap-3 bg-gray-100 dark:bg-slate-700/50 p-2.5 rounded-md">
                            <span className="w-6 shrink-0 text-right font-mono text-sm text-slate-500 dark:text-slate-400">{index + 1}.</span>
                            <span className="font-semibold text-slate-800 dark:text-white text-sm truncate">{term.term}</span>
                            <span className="ml-auto pl-4 text-slate-500 dark:text-slate-400 text-sm text-right truncate max-w-xs">{term.definition}</span>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={handleSaveTerms}>
                <div className="flex items-center justify-between mb-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Add New Cards</h4>
                    <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-sm font-semibold text-sky-500 dark:text-sky-400 hover:underline">
                        <i className="fas fa-file-import mr-2"></i>Bulk Import
                    </button>
                </div>
                <div className="space-y-4 mb-4">
                    {newTerms.map((nt, index) => (
                        <div key={index} className="flex items-start gap-2 animate-fade-in-fast">
                            <span className="pt-2 w-8 text-right font-mono text-slate-500 dark:text-slate-400 shrink-0">{index + 1}.</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                <input
                                    type="text"
                                    placeholder="Term *"
                                    value={nt.term}
                                    onChange={(e) => handleNewTermChange(index, 'term', e.target.value)}
                                    className="bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Definition *"
                                    value={nt.definition}
                                    onChange={(e) => handleNewTermChange(index, 'definition', e.target.value)}
                                    className="bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Function (e.g., n, adj, adv, v)"
                                    value={nt.function}
                                    onChange={(e) => handleNewTermChange(index, 'function', e.target.value)}
                                    className="bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                                    className="bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <button type="button" onClick={() => removeRow(index)} disabled={newTerms.length <= 1} className="text-red-500 hover:text-red-600 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed p-2 rounded-full bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                <i className="fas fa-minus-circle"></i>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={addRow} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                        <i className="fas fa-plus"></i> Add Row
                    </button>
                    <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                        <i className="fas fa-save"></i> Save Cards
                    </button>
                </div>
            </form>

            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-4">Bulk Import Cards</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-2">Paste your card data below. Each new line represents a separate card.</p>
                        <div className="text-sm bg-gray-100 dark:bg-slate-700/50 p-3 rounded-md mb-4 border border-gray-200 dark:border-slate-600/50">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">Supported Formats (use Tab to separate fields):</p>
                            <code className="block mt-2 text-slate-600 dark:text-slate-300">[Term] (Tab) [Definition]</code>
                            <code className="block mt-1 text-slate-600 dark:text-slate-300">[Term] (Tab) [Function] (Tab) [IPA] (Tab) [Definition]</code>
                        </div>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            placeholder={"Term 1\tDefinition 1\nTerm 2\tn\t/ipa/\tDefinition 2"}
                        />
                        <div className="flex justify-end gap-4 mt-4">
                            <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 rounded-md text-slate-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                            <button type="button" onClick={handleImport} className="px-4 py-2 rounded-md text-white bg-sky-500 hover:bg-sky-600 transition-colors font-semibold">Import Cards</button>
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

    const handleAddDeck = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDeckName.trim()) {
            addDeck(newDeckName.trim());
            setNewDeckName('');
        }
    };

    const toggleDeck = (id: number) => {
        setExpandedDeckId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Manage My Decks</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 mb-8">
                <h2 className="text-2xl font-bold mb-4">Create New Deck</h2>
                <form onSubmit={handleAddDeck} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        placeholder="e.g., TOEIC Vocabulary"
                        className="flex-grow bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                        type="submit"
                        disabled={!newDeckName.trim()}
                        className="bg-sky-500 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-600 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <i className="fas fa-plus mr-2"></i> Create Deck
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold border-b border-gray-200 dark:border-slate-700 pb-2">Your Decks</h2>
                {decks.length === 0 && <p className="text-slate-500 dark:text-slate-400">You don't have any decks yet.</p>}
                {decks.map(deck => (
                    <div key={deck.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-all duration-300">
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50" onClick={() => toggleDeck(deck.id)}>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{deck.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400">{getTermsForDeck(deck.id).length} cards</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                                    className="text-red-500 hover:text-red-600 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/80 px-3 py-1 rounded-md transition-colors text-sm"
                                >
                                    <i className="fas fa-trash-alt mr-2"></i> Delete
                                </button>
                                <i className={`fas fa-chevron-down text-slate-500 dark:text-slate-400 transition-transform duration-300 ${expandedDeckId === deck.id ? 'rotate-180' : ''}`}></i>
                            </div>
                        </div>
                        {expandedDeckId === deck.id && <DeckEditor deckId={deck.id} />}
                    </div>
                ))}
            </div>
        </div>
    );
};