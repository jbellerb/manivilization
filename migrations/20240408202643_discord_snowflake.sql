CREATE FUNCTION bigint_from_snowflake(s character varying) RETURNS bigint AS '
    SELECT CASE
        WHEN s::numeric < 9223372036854775808 THEN s::bigint
        ELSE (s::numeric - 18446744073709551616)::bigint
    END
' LANGUAGE SQL;

ALTER TABLE forms
    ALTER COLUMN submitter_role TYPE bigint
    USING bigint_from_snowflake(submitter_role);

ALTER TABLE responses
    ALTER COLUMN discord_id TYPE bigint
    USING bigint_from_snowflake(discord_id);

DROP FUNCTION bigint_from_snowflake;
