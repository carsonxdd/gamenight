-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameNightAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameNightId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GameNightAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameNightAttendee_gameNightId_fkey" FOREIGN KEY ("gameNightId") REFERENCES "GameNight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameNightAttendee" ("attended", "gameNightId", "id", "status", "userId") SELECT coalesce("attended", false) AS "attended", "gameNightId", "id", "status", "userId" FROM "GameNightAttendee";
DROP TABLE "GameNightAttendee";
ALTER TABLE "new_GameNightAttendee" RENAME TO "GameNightAttendee";
CREATE UNIQUE INDEX "GameNightAttendee_gameNightId_userId_key" ON "GameNightAttendee"("gameNightId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
