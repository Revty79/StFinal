-- Migration: Add astronomical events table for calendars
-- Date: 2025-11-29

CREATE TABLE IF NOT EXISTS calendar_astronomical_events (
  id VARCHAR(36) PRIMARY KEY,
  calendar_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  day_of_year INTEGER NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  celestial_body VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_calendar_astronomical_events_calendar
    FOREIGN KEY (calendar_id)
    REFERENCES calendars(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_astronomical_events_calendar_id
  ON calendar_astronomical_events(calendar_id);
