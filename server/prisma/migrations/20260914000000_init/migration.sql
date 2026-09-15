CREATE TYPE "ProjectStatus" AS ENUM ('active', 'paused', 'done');
CREATE TYPE "SprintStatus" AS ENUM ('planned', 'in_progress', 'completed');
CREATE TYPE "BacklogItemType" AS ENUM ('story', 'task', 'bug');
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "BacklogItemStatus" AS ENUM ('backlog', 'in_sprint', 'done');
CREATE TYPE "SprintItemState" AS ENUM ('todo', 'in_progress', 'review', 'done');

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "companyName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ProjectStatus" NOT NULL DEFAULT 'active',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "clientId" TEXT NOT NULL,
  "publicPortalToken" TEXT NOT NULL,
  "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "blockers" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sprint" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "SprintStatus" NOT NULL DEFAULT 'planned',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BacklogItem" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" "BacklogItemType" NOT NULL,
  "priority" "Priority" NOT NULL DEFAULT 'medium',
  "storyPoints" INTEGER NOT NULL DEFAULT 0,
  "status" "BacklogItemStatus" NOT NULL DEFAULT 'backlog',
  "isKey" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BacklogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SprintItem" (
  "id" TEXT NOT NULL,
  "sprintId" TEXT NOT NULL,
  "backlogItemId" TEXT NOT NULL,
  "state" "SprintItemState" NOT NULL DEFAULT 'todo',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SprintItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Retrospective" (
  "id" TEXT NOT NULL,
  "sprintId" TEXT NOT NULL,
  "whatWentWell" TEXT NOT NULL,
  "whatDidNotGoWell" TEXT NOT NULL,
  "actions" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Retrospective_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");
CREATE UNIQUE INDEX "Project_publicPortalToken_key" ON "Project"("publicPortalToken");
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX "Sprint_projectId_idx" ON "Sprint"("projectId");
CREATE INDEX "BacklogItem_projectId_idx" ON "BacklogItem"("projectId");
CREATE INDEX "SprintItem_sprintId_idx" ON "SprintItem"("sprintId");
CREATE INDEX "SprintItem_backlogItemId_idx" ON "SprintItem"("backlogItemId");
CREATE UNIQUE INDEX "SprintItem_sprintId_backlogItemId_key" ON "SprintItem"("sprintId", "backlogItemId");
CREATE UNIQUE INDEX "Retrospective_sprintId_key" ON "Retrospective"("sprintId");

ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SprintItem" ADD CONSTRAINT "SprintItem_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SprintItem" ADD CONSTRAINT "SprintItem_backlogItemId_fkey" FOREIGN KEY ("backlogItemId") REFERENCES "BacklogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Retrospective" ADD CONSTRAINT "Retrospective_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
