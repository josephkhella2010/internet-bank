

CREATE TABLE IF NOT EXISTS classifications (
  id             SERIAL PRIMARY KEY,
  recipient      TEXT NOT NULL,
  classification TEXT NOT NULL 
);


CREATE UNIQUE INDEX IF NOT EXISTS classifications_recipient_lower_idx
  ON classifications (LOWER(recipient));


CREATE TABLE IF NOT EXISTS transactions (
  id        SERIAL PRIMARY KEY,                
  date      DATE NOT NULL,                     
  recipient TEXT NOT NULL,
  amount    DOUBLE PRECISION NOT NULL 
);


CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date);


-- seed data

-- category mapping (23 rows)

INSERT INTO classifications (recipient, classification) VALUES
  ('ICA', 'Food'),
  ('Coop', 'Food'),
  ('Willys', 'Food'),
  ('Hemköp', 'Food'),
  ('McDonalds', 'Food'),
  ('MAX', 'Food'),
  ('SL', 'Transport'),
  ('SJ', 'Transport'),
  ('Uber', 'Transport'),
  ('Taxi Stockholm', 'Transport'),
  ('Circle K', 'Transport'),
  ('Netflix', 'Entertainment'),
  ('Spotify', 'Entertainment'),
  ('Disney+', 'Entertainment'),
  ('YouTube', 'Entertainment'),
  ('Steam', 'Entertainment'),
  ('SF Bio', 'Entertainment'),
  ('IKEA', 'Household'),
  ('Clas Ohlson', 'Household'),
  ('Jula', 'Household'),
  ('Rusta', 'Household'),
  ('Elgiganten', 'Household'),
  ('Apoteket', 'Household');


INSERT INTO transactions ( date, recipient, amount) VALUES
  ('2026-09-01', 'ICA', -350),
  ('2026-09-02', 'SL', -120),
  ('2026-09-03', 'Netflix', -149),
  ('2026-09-03', 'Employer', 30000),
  ('2026-09-04', 'ICA', -275),
  ('2026-09-05', 'SL', -95),
  ('2026-09-06', 'Netflix', -149),
  ('2026-09-07', 'ICA', -430),
  ('2026-09-08', 'Spotify', -119),
  ('2026-09-09', 'Unknown Shop', -250),
  ('2026-09-10', 'Employer', 30000),
  ('2026-09-11', 'SL', -150),
  ('2026-09-12', 'ICA', -520),
  ('2026-09-13', 'Netflix', -149),
  ('2026-09-14', 'Spotify', -119);
