CREATE TABLE IF NOT EXISTS classifications (
  id             SERIAL PRIMARY KEY,
  recipient      TEXT NOT NULL,
  classification TEXT NOT NULL 
);


CREATE UNIQUE INDEX IF NOT EXISTS classifications_recipient_lower_idx
  ON classifications (LOWER(recipient));


CREATE TABLE IF NOT EXISTS transactions (
  id        SERIAL PRIMARY KEY,                
  date      TIMESTAMP NOT NULL,                     
  recipient TEXT NOT NULL,
  amount    DOUBLE PRECISION NOT NULL 
);


CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date);


