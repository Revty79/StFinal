-- Migration: Add starting_credits to campaigns table
-- This field tracks the initial credits players receive for equipment purchases

ALTER TABLE campaigns ADD COLUMN starting_credits INTEGER NOT NULL DEFAULT 0;
