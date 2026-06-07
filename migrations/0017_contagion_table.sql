-- Migration: Create Contagion table
CREATE TABLE IF NOT EXISTS Contagion (
  ConID INTEGER PRIMARY KEY,
  ConName TEXT NOT NULL,
  ConVariant TEXT NOT NULL,
  Status INTEGER NOT NULL DEFAULT 1 CHECK(Status IN (0, 1)),
  DateCreated TEXT NOT NULL DEFAULT (datetime('now')),
  DateModified TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed data
INSERT INTO Contagion (ConID, ConName, ConVariant, Status, DateCreated, DateModified) VALUES
  (1, 'EBOLA', 'Bundibugyo', 1, datetime('now'), datetime('now')),
  (2, 'COVID-19', 'SARS-CoV-2', 1, datetime('now'), datetime('now')),
  (3, 'HANTAVIRUS', 'Sin Nombre', 1, datetime('now'), datetime('now'));
