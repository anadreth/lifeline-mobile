# Lifeline Plus Backend

Secure healthcare backend with end-to-end encryption and zero-knowledge architecture.

## Features

- 🔐 **End-to-End Encryption**: All health data encrypted client-side
- 🚫 **Zero-Knowledge**: Backend never sees plaintext medical data
- 🔒 **JWT Authentication**: Secure token-based authentication
- 🛡️ **Rate Limiting**: Protection against abuse
- 📊 **Audit Logging**: GDPR-compliant audit trails
- 🐳 **Docker Ready**: Easy deployment with Docker Compose
- 📝 **TypeScript**: Full type safety
- 🗃️ **PostgreSQL + Prisma**: Type-safe database access with robust encryption
- ⚡ **Redis Cache**: High-performance caching layer

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- OpenSSL (for SSL certificates)

### 1. Setup SSL Certificates

```bash
cd backend/database/ssl
./generate-ssl.sh
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Start Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Push Prisma schema to database
npm run prisma:push

# Start development server
npm run dev
```

### 5. Production Deployment

```bash
# Build and start all services (includes automatic Prisma migration)
docker-compose up -d --build
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://lifeline_user:lifeline_secure_password_2024@localhost:5432/lifeline_db?sslmode=require
REDIS_URL=redis://:lifeline_redis_password_2024@localhost:6379
JWT_SECRET=lifeline_jwt_super_secret_key_2024_change_in_production
ENCRYPTION_KEY=lifeline_encryption_master_key_2024_32_chars
LOG_LEVEL=info
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Health Data
- `GET /api/health-data` - Get all health data (encrypted)
- `POST /api/health-data` - Create health data
- `GET /api/health-data/:id` - Get specific health data
- `PUT /api/health-data/:id` - Update health data
- `DELETE /api/health-data/:id` - Delete health data

### Chat
- `GET /api/chat` - Get chat conversations
- `POST /api/chat` - Create chat conversation
- `PUT /api/chat/:id` - Update chat conversation

### User
- `GET /api/user/profile` - Get user profile
- `GET /api/user/keys` - Get user encryption keys
- `GET /api/user/export` - Export user data (GDPR)
- `DELETE /api/user/account` - Delete account (GDPR)

## Security Features

### Encryption
- **Client-side encryption**: AES-256-GCM for data
- **RSA key pairs**: For secure key sharing
- **Key derivation**: PBKDF2 with 100,000 iterations
- **SSL/TLS**: All communications encrypted in transit

### Database Security
- **Row-level security**: Users can only access their data
- **Encrypted storage**: Sensitive data stored as encrypted blobs
- **Audit logging**: All operations logged for compliance
- **Secure connections**: SSL-enabled PostgreSQL

### API Security
- **JWT tokens**: Short-lived with automatic refresh
- **Rate limiting**: 100 requests per 15 minutes per IP
- **Request signing**: Critical operations require signatures
- **Input validation**: All inputs validated with Joi
- **CORS protection**: Configured for mobile app origins

## Database Schema

### Prisma ORM
This project uses Prisma for type-safe database access. The schema is defined in `prisma/schema.prisma`.

### Core Models
- `User` - User accounts (minimal metadata)
- `EncryptedHealthData` - All health data (encrypted)
- `EncryptedDataKey` - Encryption keys (RSA encrypted)
- `ChatConversation` - Chat history (encrypted)
- `DataSharingPermission` - Secure data sharing
- `AuditLog` - Compliance audit trail
- `UserSession` - Session management

### Prisma Commands
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:push

# Create a migration
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio
```

## Compliance

### GDPR
- ✅ Right to be forgotten
- ✅ Data portability
- ✅ Purpose limitation
- ✅ Data minimization
- ✅ Audit trails

### Security Standards
- ✅ ISO 27001 ready
- ✅ Zero-knowledge architecture
- ✅ End-to-end encryption
- ✅ Secure key management

## Development

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Build
```bash
npm run build
```

### Database Migration
```bash
# Create and apply migration
npm run prisma:migrate

# Or push schema changes directly (development)
npm run prisma:push
```

## Production Considerations

1. **Change all default passwords**
2. **Use proper SSL certificates**
3. **Configure proper CORS origins**
4. **Set up monitoring and alerting**
5. **Regular security audits**
6. **Backup encryption keys securely**
7. **Use hardware security modules (HSM)**

## Monitoring

Health check endpoint: `GET /health`

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Support

For security issues, contact: security@lifeline-plus.com