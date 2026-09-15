ALTER TYPE "WorkspaceRole" ADD VALUE IF NOT EXISTS 'EDITOR';

ALTER TABLE "Client" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Project" ADD COLUMN "workspaceId" TEXT;

-- En una instalación existente, los datos anteriores pertenecen al primer workspace creado.
-- En instalaciones nuevas no hay filas que migrar y estas actualizaciones no hacen cambios.
INSERT INTO "Workspace" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT '00000000-0000-4000-8000-000000000001', 'Workspace original', 'workspace-original', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE (EXISTS (SELECT 1 FROM "Client") OR EXISTS (SELECT 1 FROM "Project"))
  AND NOT EXISTS (SELECT 1 FROM "Workspace");

UPDATE "Client"
SET "workspaceId" = (SELECT "id" FROM "Workspace" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "workspaceId" IS NULL;

UPDATE "Project" p
SET "workspaceId" = COALESCE(
  (SELECT c."workspaceId" FROM "Client" c WHERE c."id" = p."clientId"),
  (SELECT "id" FROM "Workspace" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE p."workspaceId" IS NULL;

ALTER TABLE "Client" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "workspaceId" SET NOT NULL;

DROP INDEX IF EXISTS "Client_email_key";
CREATE UNIQUE INDEX "Client_workspaceId_email_key" ON "Client"("workspaceId", "email");
CREATE INDEX "Client_workspaceId_idx" ON "Client"("workspaceId");
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");

ALTER TABLE "Client" ADD CONSTRAINT "Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
