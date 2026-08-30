-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "WorkoutDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
