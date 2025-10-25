-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (minimal metadata only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of email
    salt VARCHAR(32) NOT NULL, -- For password hashing
    password_hash VARCHAR(128) NOT NULL, -- Bcrypt hash
    public_key TEXT, -- RSA public key for data sharing
    encrypted_private_key TEXT, -- Private key encrypted with user's master key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    account_status VARCHAR(20) DEFAULT 'active',
    
    CONSTRAINT email_hash_format CHECK (email_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT account_status_check CHECK (account_status IN ('active', 'suspended', 'deleted'))
);

-- Encrypted health data blobs
CREATE TABLE encrypted_health_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- 'exam', 'vitals', 'records', 'anamnesis'
    encrypted_payload BYTEA NOT NULL, -- Client-encrypted JSON data
    metadata_encrypted BYTEA, -- Searchable encrypted metadata
    data_key_id UUID NOT NULL, -- Reference to encrypted data key
    nonce VARCHAR(24) NOT NULL, -- Encryption nonce
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT data_type_check CHECK (data_type IN ('exam', 'vitals', 'records', 'anamnesis', 'chat'))
);

-- Encrypted data keys (keys encrypted with user's public key)
CREATE TABLE encrypted_data_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    encrypted_key BYTEA NOT NULL, -- Data encryption key encrypted with user's public key
    key_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, data_type, key_version)
);

-- Data sharing permissions
CREATE TABLE data_sharing_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_id UUID REFERENCES encrypted_health_data(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'read', -- 'read', 'write', 'admin'
    encrypted_data_key BYTEA NOT NULL, -- Data key encrypted with recipient's public key
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT permission_level_check CHECK (permission_level IN ('read', 'write', 'admin')),
    UNIQUE(data_id, shared_with_user_id)
);

-- Chat conversations (encrypted)
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID, -- References encrypted_health_data.id where data_type = 'exam'
    encrypted_messages BYTEA NOT NULL, -- Encrypted conversation history
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs (for compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', 'LOGIN', 'LOGOUT'
    resource_type VARCHAR(50), -- 'exam', 'vitals', 'records', 'user'
    resource_id_hash VARCHAR(64), -- SHA-256 hash of resource ID (for privacy)
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT action_check CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', 'LOGIN', 'LOGOUT', 'REGISTER'))
);

-- Session management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(128) NOT NULL,
    refresh_token_hash VARCHAR(128),
    device_id VARCHAR(128),
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(session_token_hash)
);

-- Enable Row Level Security
ALTER TABLE encrypted_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_data_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_health_data_user_id ON encrypted_health_data(user_id);
CREATE INDEX idx_health_data_type ON encrypted_health_data(data_type);
CREATE INDEX idx_health_data_created_at ON encrypted_health_data(created_at);

CREATE INDEX idx_data_keys_user_id ON encrypted_data_keys(user_id);
CREATE INDEX idx_data_keys_type ON encrypted_data_keys(data_type);

CREATE INDEX idx_sharing_owner ON data_sharing_permissions(data_owner_id);
CREATE INDEX idx_sharing_recipient ON data_sharing_permissions(shared_with_user_id);
CREATE INDEX idx_sharing_data ON data_sharing_permissions(data_id);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(session_token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_data_updated_at BEFORE UPDATE ON encrypted_health_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();