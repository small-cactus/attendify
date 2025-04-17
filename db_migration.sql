-- Add UUID column to members table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'member_uuid'
    ) THEN
        -- Add the UUID column
        ALTER TABLE members ADD COLUMN member_uuid UUID;
        
        -- Generate UUIDs for existing members
        UPDATE members SET member_uuid = gen_random_uuid() WHERE member_uuid IS NULL;
        
        -- Add a unique constraint to ensure all UUIDs are unique
        ALTER TABLE members ADD CONSTRAINT members_member_uuid_unique UNIQUE (member_uuid);
    END IF;
END $$;

-- Add unique constraint combining club_id and name (if desired)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'members_club_id_name_unique'
    ) THEN
        ALTER TABLE members ADD CONSTRAINT members_club_id_name_unique UNIQUE (club_id, name);
    END IF;
EXCEPTION
    -- Constraint might fail if there are duplicate names - handle gracefully
    WHEN unique_violation THEN
        RAISE NOTICE 'Could not add unique constraint - duplicate names exist in members table';
END $$;

-- Add columns to events table for advanced check-in and recurrence
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_location_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_qr_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_code_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_code TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_radius_meters INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none'; -- none, daily, weekly, monthly
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_until DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_start_time TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_end_time TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_only_during_event BOOLEAN DEFAULT TRUE; 