CREATE TABLE auth_session (
    id uuid NOT NULL PRIMARY KEY,
    state uuid NOT NULL,
    verifier character varying NOT NULL,
    redirect character varying NOT NULL,
    expires timestamp with time zone NOT NULL
);
