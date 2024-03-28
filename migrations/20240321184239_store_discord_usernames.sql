ALTER TABLE responses
    ADD COLUMN discord_name character varying;

UPDATE responses SET discord_name = '@unknown';

ALTER TABLE responses ALTER COLUMN discord_name SET NOT NULL;
