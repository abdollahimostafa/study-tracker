-- CreateTable
CREATE TABLE "StudyLog" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "user" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyLog_pkey" PRIMARY KEY ("id")
);
