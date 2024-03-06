CREATE TABLE session (
    id uuid NOT NULL PRIMARY KEY,
    access_token character varying NOT NULL,
    refresh_token character varying,
    expires timestamp with time zone
);
