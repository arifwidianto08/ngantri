-- Database initialization script for ngantri food court system
-- This file is automatically executed when the PostgreSQL container starts

-- Create the database if it doesn't exist (already handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS ngantri;

-- Create a role for the application if needed
-- The default postgres user will be used for development

-- PostgreSQL 18 has native UUIDv7 support, no extensions needed

-- Set timezone to Indonesian time
SET timezone = 'Asia/Jakarta';

-- Create any additional configuration here
COMMENT ON DATABASE ngantri IS 'Food court ordering system database';

-- Log initialization
\echo 'Database initialization completed for ngantri food court system'