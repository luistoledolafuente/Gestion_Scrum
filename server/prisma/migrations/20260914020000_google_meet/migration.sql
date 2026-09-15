ALTER TABLE "CalendarEvent"
ADD COLUMN "createGoogleMeet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "inviteClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "googleMeetUrl" TEXT;
