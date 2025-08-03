-- Initial database schema for StarsCalendars spiritual platform
-- PostgreSQL 14+ with UUID and full-text search extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table with Telegram-only authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telegram_user_id BIGINT UNIQUE,
    is_telegram_subscribed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    spiritual_preferences JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(5) DEFAULT 'en', -- 10-language support
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens for JWT authentication
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Telegram account linking tokens (UUID-based deep linking)
CREATE TABLE linking_tokens (
    token UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- Spiritual events and astronomical calculations
CREATE TABLE spiritual_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    astronomical_data JSONB,
    quantum_resonance DOUBLE PRECISION,
    occurs_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions for WebSocket connections
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    websocket_connection_id VARCHAR(255),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Performance indexes for 1000+ concurrent users
CREATE INDEX idx_users_telegram_id ON users(telegram_user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_language ON users(language); -- i18n queries
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_telegram_subscribed ON users(is_telegram_subscribed);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX idx_linking_tokens_user_id ON linking_tokens(user_id);
CREATE INDEX idx_linking_tokens_expires_at ON linking_tokens(expires_at);

CREATE INDEX idx_spiritual_events_occurs_at ON spiritual_events(occurs_at);
CREATE INDEX idx_spiritual_events_type ON spiritual_events(event_type);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Full-text search for spiritual content
CREATE INDEX idx_spiritual_events_title_fulltext ON spiritual_events USING gin(to_tsvector('english', title));
CREATE INDEX idx_spiritual_events_description_fulltext ON spiritual_events USING gin(to_tsvector('english', description));

-- Trigger for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    DELETE FROM linking_tokens WHERE expires_at < NOW();
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE 'plpgsql';

-- Performance optimization: partitioning for spiritual_events if needed in future
-- CREATE TABLE spiritual_events_2025 PARTITION OF spiritual_events
-- FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');