const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
    db: {
        getDecks: () => ipcRenderer.invoke('db:getDecks'),
        addDeck: (name) => ipcRenderer.invoke('db:addDeck', name),
        renameDeck: (id, name) => ipcRenderer.invoke('db:renameDeck', id, name),
        updateDeckLastStudied: (id, lastStudied) => ipcRenderer.invoke('db:updateDeckLastStudied', id, lastStudied),
        deleteDeck: (id) => ipcRenderer.invoke('db:deleteDeck', id),

        getTerms: () => ipcRenderer.invoke('db:getTerms'),
        addTerm: (deckId, term, definition, ipa, functionValue) => ipcRenderer.invoke('db:addTerm', deckId, term, definition, ipa, functionValue),
        updateTerm: (termId, termData) => ipcRenderer.invoke('db:updateTerm', termId, termData),
        deleteTerm: (termId) => ipcRenderer.invoke('db:deleteTerm', termId),

        getAllProgress: () => ipcRenderer.invoke('db:getAllProgress'),
        updateProgress: (termId, card) =>
            ipcRenderer.invoke('db:updateProgress', termId, card),

        getFlashcardSettings: (deckId) => ipcRenderer.invoke('db:getFlashcardSettings', deckId),
        saveFlashcardSettings: (deckId, settings) => ipcRenderer.invoke('db:saveFlashcardSettings', deckId, settings),
        deleteFlashcardSettings: (deckId) => ipcRenderer.invoke('db:deleteFlashcardSettings', deckId),
    }
});
