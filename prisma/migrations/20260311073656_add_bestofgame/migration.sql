-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TournamentMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "bracketSide" TEXT,
    "entrant1Id" TEXT,
    "entrant2Id" TEXT,
    "winnerEntrantId" TEXT,
    "score1" INTEGER,
    "score2" INTEGER,
    "bestOfGame" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reportedById" TEXT,
    "confirmedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_entrant1Id_fkey" FOREIGN KEY ("entrant1Id") REFERENCES "TournamentEntrant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_entrant2Id_fkey" FOREIGN KEY ("entrant2Id") REFERENCES "TournamentEntrant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_winnerEntrantId_fkey" FOREIGN KEY ("winnerEntrantId") REFERENCES "TournamentEntrant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TournamentMatch" ("bracketSide", "confirmedById", "createdAt", "entrant1Id", "entrant2Id", "id", "matchNumber", "reportedById", "round", "score1", "score2", "status", "tournamentId", "updatedAt", "winnerEntrantId") SELECT "bracketSide", "confirmedById", "createdAt", "entrant1Id", "entrant2Id", "id", "matchNumber", "reportedById", "round", "score1", "score2", "status", "tournamentId", "updatedAt", "winnerEntrantId" FROM "TournamentMatch";
DROP TABLE "TournamentMatch";
ALTER TABLE "new_TournamentMatch" RENAME TO "TournamentMatch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
