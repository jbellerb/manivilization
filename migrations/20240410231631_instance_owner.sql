ALTER TABLE instances ADD COLUMN owner bigint;

UPDATE instances SET owner = 0;

ALTER TABLE instances ALTER COLUMN owner SET NOT NULL;
