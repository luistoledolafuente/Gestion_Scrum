ALTER TABLE "Project" ADD COLUMN "deliverablesV2" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Project" AS project
SET "deliverablesV2" = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', md5(project."id" || ':' || item.ordinality::text),
        'title', item.title,
        'completed', false,
        'completedAt', NULL
      )
      ORDER BY item.ordinality
    )
    FROM unnest(project."deliverables") WITH ORDINALITY AS item(title, ordinality)
  ),
  '[]'::jsonb
);

ALTER TABLE "Project" DROP COLUMN "deliverables";
ALTER TABLE "Project" RENAME COLUMN "deliverablesV2" TO "deliverables";
