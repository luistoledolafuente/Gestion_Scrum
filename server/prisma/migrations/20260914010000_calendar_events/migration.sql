CREATE TYPE "CalendarEventType" AS ENUM ('MEETING', 'DEMO', 'PLANNING', 'RETRO');
CREATE TYPE "CalendarEventStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'DONE');

CREATE TABLE "CalendarEvent" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "clientId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" "CalendarEventType" NOT NULL,
  "startDateTime" TIMESTAMP(3) NOT NULL,
  "endDateTime" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "syncWithGoogle" BOOLEAN NOT NULL DEFAULT true,
  "googleEventId" TEXT,
  "status" "CalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalendarEvent_googleEventId_key" ON "CalendarEvent"("googleEventId");
CREATE INDEX "CalendarEvent_projectId_idx" ON "CalendarEvent"("projectId");
CREATE INDEX "CalendarEvent_clientId_idx" ON "CalendarEvent"("clientId");
CREATE INDEX "CalendarEvent_startDateTime_idx" ON "CalendarEvent"("startDateTime");
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
