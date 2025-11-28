ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS starting_credits integer DEFAULT 0 NOT NULL;

ALTER TABLE campaign_currencies ALTER COLUMN credit_value TYPE numeric(10, 4) USING credit_value::numeric;
