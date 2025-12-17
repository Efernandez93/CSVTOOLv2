-- Global Dock Tally Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create uploads table to track CSV uploads
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id TEXT UNIQUE NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('ocean', 'air')),
    filename TEXT NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    row_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ocean_data table for Ocean cargo
CREATE TABLE ocean_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id TEXT NOT NULL REFERENCES uploads(upload_id) ON DELETE CASCADE,
    mbl TEXT,
    hb TEXT,
    container TEXT,
    dest TEXT,
    outer_quantity TEXT,
    pcs TEXT,
    frl_date TEXT,
    tdf_date TEXT,
    vbond_date TEXT,
    status TEXT DEFAULT 'active',
    is_new BOOLEAN DEFAULT false,
    is_removed BOOLEAN DEFAULT false,
    is_updated BOOLEAN DEFAULT false,
    last_updated_upload_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create air_data table for Air cargo
CREATE TABLE air_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id TEXT NOT NULL REFERENCES uploads(upload_id) ON DELETE CASCADE,
    mawb TEXT,
    hawb TEXT,
    flight_number TEXT,
    destination TEXT,
    slac TEXT,
    qty TEXT,
    cfs_location TEXT,
    log TEXT,
    status TEXT DEFAULT 'active',
    is_new BOOLEAN DEFAULT false,
    is_removed BOOLEAN DEFAULT false,
    is_updated BOOLEAN DEFAULT false,
    last_updated_upload_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_ocean_upload_id ON ocean_data(upload_id);
CREATE INDEX idx_ocean_mbl ON ocean_data(mbl);
CREATE INDEX idx_ocean_hb ON ocean_data(hb);
CREATE INDEX idx_ocean_status ON ocean_data(status);

CREATE INDEX idx_air_upload_id ON air_data(upload_id);
CREATE INDEX idx_air_mawb ON air_data(mawb);
CREATE INDEX idx_air_hawb ON air_data(hawb);
CREATE INDEX idx_air_status ON air_data(status);

CREATE INDEX idx_uploads_mode ON uploads(mode);
CREATE INDEX idx_uploads_date ON uploads(upload_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_ocean_data_updated_at
    BEFORE UPDATE ON ocean_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_air_data_updated_at
    BEFORE UPDATE ON air_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocean_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_data ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (adjust based on your auth needs)
-- For now, we'll allow all operations for development
CREATE POLICY "Allow all operations on uploads" ON uploads
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ocean_data" ON ocean_data
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on air_data" ON air_data
    FOR ALL USING (true) WITH CHECK (true);

-- Create a view for latest ocean data
CREATE OR REPLACE VIEW latest_ocean_data AS
SELECT DISTINCT ON (hb, mbl)
    *
FROM ocean_data
WHERE status = 'active'
ORDER BY hb, mbl, created_at DESC;

-- Create a view for latest air data
CREATE OR REPLACE VIEW latest_air_data AS
SELECT DISTINCT ON (hawb, mawb)
    *
FROM air_data
WHERE status = 'active'
ORDER BY hawb, mawb, created_at DESC;
