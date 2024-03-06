ALTER TABLE session
    ADD COLUMN access_expires timestamp with time zone;

ALTER TABLE session ALTER COLUMN expires SET NOT NULL;
