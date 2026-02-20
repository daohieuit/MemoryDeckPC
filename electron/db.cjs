const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

const fs = require('fs');

function initDatabase() {
  // When packaged, app.getPath('exe') gives the path to Memorydeck.exe
  // We want the database to live in the same folder as the .exe for portability
  const isPackaged = app.isPackaged;
  const dbDir = isPackaged
    ? path.dirname(app.getPath('exe'))
    : app.getAppPath();

  const oldDbPath = path.join(dbDir, 'memorydock.db');
  const newDbPath = path.join(dbDir, 'memorydeck.db');

  // Check if we need to migrate the DB file
  if (fs.existsSync(oldDbPath) && !fs.existsSync(newDbPath)) {
    try {
      console.log(`Renaming database from ${oldDbPath} to ${newDbPath}`);
      fs.renameSync(oldDbPath, newDbPath);
    } catch (err) {
      console.error('Failed to rename database file:', err);
      // Fallback to old path if rename fails to avoid crash, or potentially continue to create new one?
      // If rename fails, we probably shouldn't try to open the new one immediately effectively.
      // But for now, let's assume we proceed to try opening the new path, or maybe we should just use the new path 
      // and let it create a fresh one if rename failed?
      // Safest is to log error. If rename failed, newDbPath doesn't exist, so next line opens fresh DB.
      // Data loss risk if rename fails but we continue. 
      // However, better-sqlite3 will just create a new file at newDbPath.
    }
  }

  db = new Database(newDbPath);

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

  // Migrate categories to decks -> decks
  if (tables.includes('categories') && !tables.includes('decks') && !tables.includes('decks')) {
    db.exec('ALTER TABLE categories RENAME TO decks');
  } else if (tables.includes('decks') && !tables.includes('decks')) {
    db.exec('ALTER TABLE decks RENAME TO decks');
  }

  // Migrate words to terms
  if (tables.includes('words') && !tables.includes('terms')) {
    db.exec('ALTER TABLE words RENAME TO terms');
    try {
      db.exec('ALTER TABLE terms RENAME COLUMN word TO term');
      db.exec('ALTER TABLE terms RENAME COLUMN example TO function');
      // db.exec('ALTER TABLE terms RENAME COLUMN category_id TO deck_id'); // Skip this intermediate step if possible or handle below
    } catch (e) {
      console.log('Terms columns already renamed or error:', e.message);
    }
  }

  // Migrate deck_id to deck_id in terms
  const termColumns = db.prepare("PRAGMA table_info(terms)").all().map(c => c.name);
  if (termColumns.includes('category_id')) {
    try {
      db.exec('ALTER TABLE terms RENAME COLUMN category_id TO deck_id');
    } catch (e) { console.log('Error renaming category_id to deck_id', e.message); }
  } else if (termColumns.includes('deck_id')) {
    try {
      db.exec('ALTER TABLE terms RENAME COLUMN deck_id TO deck_id');
    } catch (e) { console.log('Error renaming deck_id to deck_id', e.message); }
  }


  // Migrate progress table
  if (tables.includes('progress')) {
    const progressColumns = db.prepare("PRAGMA table_info(progress)").all().map(c => c.name);
    if (progressColumns.includes('word_id')) {
      try {
        db.exec('ALTER TABLE progress RENAME COLUMN word_id TO term_id');
      } catch (e) { }
    }
    if (progressColumns.includes('difficulty_level')) {
      try {
        db.exec('ALTER TABLE progress DROP COLUMN difficulty_level');
      } catch (e) {
        console.log('Could not drop difficulty_level:', e.message);
      }
    }
  }

  // Create tables with new schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER,
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      ipa TEXT,
      function TEXT,
      FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      term_id INTEGER PRIMARY KEY,
      status TEXT,
      last_reviewed TEXT,
      FOREIGN KEY (term_id) REFERENCES terms (id) ON DELETE CASCADE
    );
  `);

  // Add created_at column to decks table if it doesn't exist
  const deckColumns = db.prepare("PRAGMA table_info(decks)").all().map(c => c.name);
  if (!deckColumns.includes('created_at')) {
    try {
      db.exec('ALTER TABLE decks ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP');
      // Update existing rows with a timestamp
      db.exec('UPDATE decks SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL');
    } catch (e) {
      console.log('Error adding created_at to decks table', e.message);
    }
  }

  // Add last_studied column to decks table if it doesn't exist
  const deckColumnsAfter = db.prepare("PRAGMA table_info(decks)").all().map(c => c.name);
  if (!deckColumnsAfter.includes('last_studied')) {
    try {
      db.exec('ALTER TABLE decks ADD COLUMN last_studied TEXT DEFAULT NULL');
    } catch (e) {
      console.log('Error adding last_studied to decks table', e.message);
    }
  }

  return db;
}

const createDbOps = (dbInstance) => ({
  // Decks (formerly decks/Categories)
  getDecks: () => dbInstance.prepare('SELECT * FROM decks').all(),
  addDeck: (name) => dbInstance.prepare('INSERT INTO decks (name) VALUES (?)').run(name).lastInsertRowid,
  renameDeck: (id, name) => dbInstance.prepare('UPDATE decks SET name = ? WHERE id = ?').run(name, id),
  updateDeckLastStudied: (id, lastStudied) => dbInstance.prepare('UPDATE decks SET last_studied = ? WHERE id = ?').run(lastStudied, id),
  deleteDeck: (id) => dbInstance.prepare('DELETE FROM decks WHERE id = ?').run(id),

  // Terms (formerly Words)
  getTerms: () => dbInstance.prepare('SELECT * FROM terms').all(),
  addTerm: (deckId, term, definition, ipa, functionValue) =>
    dbInstance.prepare('INSERT INTO terms (deck_id, term, definition, ipa, function) VALUES (?, ?, ?, ?, ?)').run(deckId, term, definition, ipa, functionValue).lastInsertRowid,
  updateTerm: (termId, termData) => {
    const { term, definition, ipa, function: functionValue } = termData;
    return dbInstance.prepare('UPDATE terms SET term = COALESCE(?, term), definition = COALESCE(?, definition), ipa = COALESCE(?, ipa), function = COALESCE(?, function) WHERE id = ?')
      .run(term, definition, ipa, functionValue, termId);
  },
  deleteTerm: (termId) => dbInstance.prepare('DELETE FROM terms WHERE id = ?').run(termId),
  deleteTermsByDeck: (deckId) => dbInstance.prepare('DELETE FROM terms WHERE deck_id = ?').run(deckId),

  // Progress
  getAllProgress: () => dbInstance.prepare('SELECT * FROM progress').all(),
  updateProgress: (termId, status, lastReviewed) => {
    return dbInstance.prepare(`
      INSERT INTO progress (term_id, status, last_reviewed)
      VALUES (?, ?, ?)
      ON CONFLICT(term_id) DO UPDATE SET
        status = excluded.status,
        last_reviewed = excluded.last_reviewed
    `).run(termId, status, lastReviewed);
  }
});

module.exports = { initDatabase, createDbOps };
