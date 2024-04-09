CREATE TABLE instances (
    id uuid NOT NULL PRIMARY KEY,
    url character varying NOT NULL,
    name character varying NOT NULL,
    guild_id bigint NOT NULL,
    admin_role bigint NOT NULL
);

CREATE INDEX instances_url_index ON instances (url);

-- Don't know the ID of the existing instance yet. Blank value can be filled
-- in later. Completely clearing sessions first to save work doing that.

TRUNCATE auth_sessions;
ALTER TABLE auth_sessions ADD COLUMN instance uuid NOT NULL;

TRUNCATE sessions;
ALTER TABLE sessions ADD COLUMN instance uuid NOT NULL;

ALTER TABLE forms ADD COLUMN instance uuid;
UPDATE forms SET instance = '00000000-0000-0000-0000-000000000000';
ALTER TABLE forms ALTER COLUMN instance SET NOT NULL;

ALTER TABLE responses ADD COLUMN instance uuid;
UPDATE responses SET instance = '00000000-0000-0000-0000-000000000000';
ALTER TABLE responses ALTER COLUMN instance SET NOT NULL;

CREATE INDEX forms_instance_index ON forms (instance);
