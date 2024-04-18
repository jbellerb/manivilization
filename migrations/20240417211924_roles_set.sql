ALTER TABLE responses ADD COLUMN roles_set boolean;

UPDATE responses SET roles_set = True;

ALTER TABLE responses ALTER COLUMN roles_set SET NOT NULL;

CREATE INDEX responses_discord_id_index ON responses (discord_id);
