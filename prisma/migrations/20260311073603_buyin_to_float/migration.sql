/*
  Warnings:

  - You are about to alter the column `buyIn` on the `Tournament` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "game" TEXT NOT NULL,
    "bracketType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "teamSize" INTEGER,
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "maxSlots" INTEGER NOT NULL,
    "seedingMode" TEXT NOT NULL DEFAULT 'random',
    "captainMode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "buyIn" REAL,
    "isMultiSession" BOOLEAN NOT NULL DEFAULT false,
    "draftStatus" TEXT,
    "draftOrder" TEXT,
    "currentPickIndex" INTEGER DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("bestOf", "bracketType", "buyIn", "captainMode", "createdAt", "createdById", "currentPickIndex", "description", "draftOrder", "draftStatus", "format", "game", "id", "isMultiSession", "maxSlots", "seedingMode", "status", "teamSize", "title", "updatedAt") SELECT "bestOf", "bracketType", "buyIn", "captainMode", "createdAt", "createdById", "currentPickIndex", "description", "draftOrder", "draftStatus", "format", "game", "id", "isMultiSession", "maxSlots", "seedingMode", "status", "teamSize", "title", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
