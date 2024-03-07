CREATE TABLE forms (
    id uuid NOT NULL PRIMARY KEY,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    active boolean NOT NULL,
    description character varying,
    questions JSON,
    success_message character varying
);
