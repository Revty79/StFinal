-- Update campaign_currencies to support decimal credit values
ALTER TABLE campaign_currencies ALTER COLUMN credit_value TYPE numeric(10, 4);
