const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase, dbOps } = require('./db.cjs');

const isDev = process.env.NODE_ENV === 'development';
let db;

function registerIpcHandlers() {
    ipcMain.handle('app:getVersion', () => app.getVersion());
    ipcMain.handle('db:getDecks', () => dbOps.getDecks());
    ipcMain.handle('db:addDeck', (_, name) => dbOps.addDeck(name));
    ipcMain.handle('db:deleteDeck', (_, id) => dbOps.deleteDeck(id));

    ipcMain.handle('db:getTerms', () => dbOps.getTerms());
    ipcMain.handle('db:addTerm', (_, deckId, term, definition, ipa, functionValue) => dbOps.addTerm(deckId, term, definition, ipa, functionValue));
    ipcMain.handle('db:updateTerm', (_, termId, termData) => dbOps.updateTerm(termId, termData));
    ipcMain.handle('db:deleteTerm', (_, termId) => dbOps.deleteTerm(termId));

    ipcMain.handle('db:getAllProgress', () => dbOps.getAllProgress());
    ipcMain.handle('db:updateProgress', (_, termId, status, lastReviewed) =>
        dbOps.updateProgress(termId, status, lastReviewed));
}

function createWindow() {
    db = initDatabase();
    registerIpcHandlers();
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: "Memorydeck",
        autoHideMenuBar: true,
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
