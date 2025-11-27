-- Add is_setup_complete column to campaign_characters table
ALTER TABLE campaign_characters 
ADD COLUMN is_setup_complete BOOLEAN NOT NULL DEFAULT false;
