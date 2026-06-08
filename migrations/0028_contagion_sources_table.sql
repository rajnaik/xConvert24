-- Migration: Create ContagionSources table
-- Stores preferred news/data sources per disease for Tavily-targeted searches
CREATE TABLE IF NOT EXISTS ContagionSources (
  SourceID INTEGER PRIMARY KEY AUTOINCREMENT,
  ConID INTEGER NOT NULL,
  SourceName TEXT NOT NULL,
  SourceDomain TEXT NOT NULL,
  SourceURL TEXT NOT NULL DEFAULT '',
  SourceType TEXT NOT NULL DEFAULT 'news' CHECK(SourceType IN ('official', 'expert', 'news', 'tracker')),
  Priority INTEGER NOT NULL DEFAULT 5,
  Status INTEGER NOT NULL DEFAULT 1 CHECK(Status IN (0, 1)),
  DateCreated TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ConID) REFERENCES Contagion(ConID)
);

-- Seed: Ebola sources (ConID = 1)
INSERT INTO ContagionSources (ConID, SourceName, SourceDomain, SourceURL, SourceType, Priority) VALUES
  (1, 'WHO - World Health Organization', 'who.int', 'https://www.who.int/emergencies/diseases/ebola', 'official', 1),
  (1, 'CDC - Centers for Disease Control', 'cdc.gov', 'https://www.cdc.gov/ebola/', 'official', 2),
  (1, 'Africa CDC', 'africacdc.org', 'https://africacdc.org', 'official', 3),
  (1, 'CIDRAP - University of Minnesota', 'cidrap.umn.edu', 'https://www.cidrap.umn.edu/ebola', 'expert', 4),
  (1, 'ReliefWeb (UN OCHA)', 'reliefweb.int', 'https://reliefweb.int', 'expert', 5),
  (1, 'ProMED (ISID)', 'promedmail.org', 'https://promedmail.org', 'expert', 6),
  (1, 'BNO News', 'bnonews.com', 'https://bnonews.com', 'news', 7),
  (1, 'EbolaMap.org', 'ebolamap.org', 'https://ebolamap.org', 'tracker', 8),
  (1, 'NBC News', 'nbcnews.com', 'https://www.nbcnews.com', 'news', 9),
  (1, 'UN News', 'news.un.org', 'https://news.un.org', 'news', 10);

-- Seed: COVID-19 sources (ConID = 2)
INSERT INTO ContagionSources (ConID, SourceName, SourceDomain, SourceURL, SourceType, Priority) VALUES
  (2, 'WHO - World Health Organization', 'who.int', 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019', 'official', 1),
  (2, 'CDC - Centers for Disease Control', 'cdc.gov', 'https://www.cdc.gov/covid/', 'official', 2),
  (2, 'Johns Hopkins CSSE', 'coronavirus.jhu.edu', 'https://coronavirus.jhu.edu', 'tracker', 3),
  (2, 'CIDRAP - University of Minnesota', 'cidrap.umn.edu', 'https://www.cidrap.umn.edu/covid-19', 'expert', 4),
  (2, 'NIH - National Institutes of Health', 'nih.gov', 'https://www.nih.gov', 'official', 5);

-- Seed: Hantavirus sources (ConID = 3)
INSERT INTO ContagionSources (ConID, SourceName, SourceDomain, SourceURL, SourceType, Priority) VALUES
  (3, 'WHO - World Health Organization', 'who.int', 'https://www.who.int/health-topics/hantavirus', 'official', 1),
  (3, 'CDC - Centers for Disease Control', 'cdc.gov', 'https://www.cdc.gov/hantavirus/', 'official', 2),
  (3, 'CIDRAP - University of Minnesota', 'cidrap.umn.edu', 'https://www.cidrap.umn.edu', 'expert', 3),
  (3, 'ProMED (ISID)', 'promedmail.org', 'https://promedmail.org', 'expert', 4),
  (3, 'BNO News', 'bnonews.com', 'https://bnonews.com', 'news', 5);
