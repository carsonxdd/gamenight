-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameNight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurDay" INTEGER,
    "recurGroupId" TEXT,
    "createdById" TEXT NOT NULL,
    "hostId" TEXT,
    "timezone" TEXT,
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameNight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameNight_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameNight" ("attendanceConfirmed", "createdAt", "createdById", "date", "description", "endTime", "game", "hostId", "id", "isRecurring", "recurDay", "recurGroupId", "startTime", "status", "timezone", "title", "updatedAt", "visibility") SELECT "attendanceConfirmed", "createdAt", "createdById", "date", "description", "endTime", "game", "hostId", "id", "isRecurring", "recurDay", "recurGroupId", "startTime", "status", "timezone", "title", "updatedAt", "visibility" FROM "GameNight";
DROP TABLE "GameNight";
ALTER TABLE "new_GameNight" RENAME TO "GameNight";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
