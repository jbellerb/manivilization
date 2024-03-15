CREATE TABLE responses (
    id uuid NOT NULL PRIMARY KEY,
    form uuid NOT NULL,
    discord_id character varying NOT NULL,
    response JSON,
    date timestamp with time zone
);
