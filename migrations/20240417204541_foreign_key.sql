ALTER TABLE auth_sessions ADD FOREIGN KEY (instance) REFERENCES instances;

ALTER TABLE sessions ADD FOREIGN KEY (instance) REFERENCES instances;

ALTER TABLE forms ADD FOREIGN KEY (instance) REFERENCES instances;

ALTER TABLE responses ADD FOREIGN KEY (form) REFERENCES forms;
