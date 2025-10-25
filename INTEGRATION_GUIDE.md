# Lifeline Mobile + Backend Integration Guide

This guide explains how to integrate the secure backend with your Lifeline mobile application.

## 🚀 Quick Setup

### 1. Install Mobile Dependencies

```bash
cd lifeline-mobile
npm install expo-secure-store crypto-js
```

### 2. Start Backend Services

```bash
cd backend
# Generate SSL certificates
cd database/ssl && ./generate-ssl.sh && cd ../..

# Start services
docker-compose up -d

# Check health
curl http://localhost:3000/health
```

### 3. Update Mobile App Root Layout

```tsx
// app/_layout.tsx
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Your existing layout */}
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
```

### 4. Add Authentication Screens

Create login/register screens that use the AuthContext:

```tsx
// Example usage in a component
import { useAuth } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  
  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      // Navigate to main app
    } else {
      // Show error
      alert(result.error);
    }
  };
}
```

## 🔐 How Security Works

### Client-Side Encryption Flow

1. **User Registration/Login**
   - Password + biometric → Master Key (PBKDF2)
   - Generate RSA key pair
   - Private key encrypted with Master Key
   - Data keys encrypted with RSA Public Key

2. **Data Storage**
   - Health data → JSON → AES-256-GCM encrypt → Backend
   - Backend stores only encrypted blobs
   - Encryption keys never leave client

3. **Data Retrieval**
   - Backend returns encrypted blobs
   - Client decrypts with user's keys
   - Zero-knowledge: Backend cannot read data

### Migration from AsyncStorage

The new system automatically replaces AsyncStorage:

```typescript
// Before (AsyncStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('exams', JSON.stringify(exams));

// After (Secure Backend)
import { saveExam } from '../utils/exam-storage';
await saveExam(exam); // Automatically encrypted and sent to backend
```

## 📱 Mobile App Changes

### Key Files Modified

1. **`src/utils/exam-storage.ts`** - Now uses encrypted backend API
2. **`src/services/api.ts`** - HTTP client with encryption
3. **`src/services/encryption.ts`** - Client-side crypto
4. **`src/contexts/AuthContext.tsx`** - Authentication state

### API Integration Example

```typescript
// Creating encrypted health data
const exam = {
  name: "Annual Checkup",
  status: "in-progress",
  completedSteps: { "1": true, "2": false }
};

// This automatically encrypts and sends to backend
await saveExam(exam);

// Retrieving and decrypting data
const allExams = await getAllExams(); // Automatically decrypted
```

### Authentication Integration

```typescript
// In your app component
const { isAuthenticated, isLoading, user } = useAuth();

if (isLoading) {
  return <LoadingScreen />;
}

if (!isAuthenticated) {
  return <LoginScreen />;
}

return <MainApp user={user} />;
```

## 🛠️ Backend API Reference

### Authentication

```typescript
// Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "deviceId": "optional-device-id"
}

// Login
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "SecurePassword123!"
}

// Response includes encrypted keys for client
{
  "token": "jwt-token",
  "user": { "id": "uuid", "publicKey": "rsa-key" },
  "encryptedPrivateKey": { "encryptedData": "...", "nonce": "...", "tag": "..." },
  "dataKeys": {
    "exam": "encrypted-key",
    "vitals": "encrypted-key"
  }
}
```

### Health Data Operations

```typescript
// All data automatically encrypted by apiService
await apiService.createHealthData(examData, 'exam');
await apiService.getHealthData('exam');
await apiService.updateHealthData(id, newData, 'exam');
await apiService.deleteHealthData(id);
```

## 🔒 Security Best Practices

### Client-Side
- ✅ Master key derived from password + biometric
- ✅ Private keys stored in Expo SecureStore
- ✅ Automatic key rotation supported
- ✅ Memory cleared on logout

### Network
- ✅ TLS 1.3 for all communications
- ✅ Certificate pinning ready
- ✅ Request signing for sensitive operations
- ✅ JWT tokens with short expiry

### Backend
- ✅ Zero-knowledge architecture
- ✅ Row-level security in database
- ✅ Audit logging for compliance
- ✅ Rate limiting and abuse protection

## 🚨 Important Notes

### Data Migration
- Existing AsyncStorage data needs manual migration
- Run migration script before first backend deployment
- Backup local data before switching

### Environment Setup
```typescript
// Mobile app environment config
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.lifeline-plus.com/api'; // Production
```

### Error Handling
```typescript
try {
  await saveExam(exam);
} catch (error) {
  // Network error - data saved locally as fallback
  console.error('Backend unavailable:', error);
  // Implement offline-first strategy
}
```

## 📊 Performance Optimizations

### Caching Strategy
- Client-side cache for 5 minutes
- Lazy loading for large datasets
- Background sync when online

### Offline Support
- Cache decrypted data temporarily
- Queue operations when offline
- Sync when connection restored

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Mobile Integration Testing
```bash
cd lifeline-mobile
npm test
# Test with backend running on localhost:3000
```

### Security Testing
- Penetration testing recommended
- Key rotation testing
- Encryption/decryption performance tests

## 📈 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Database health  
docker exec lifeline-postgres pg_isready
```

### Logs
```bash
# Backend logs
docker logs lifeline-backend

# Database logs
docker logs lifeline-postgres
```

## 🆘 Troubleshooting

### Common Issues

1. **"Encryption initialization failed"**
   - Check if user completed login flow
   - Verify password derivation

2. **"Failed to fetch exams from backend"**
   - Check backend health endpoint
   - Verify authentication token

3. **"Database connection failed"**
   - Check PostgreSQL container status
   - Verify SSL certificates

### Debug Mode
```typescript
// Enable debug logging
if (__DEV__) {
  console.log('API Request:', endpoint, payload);
  console.log('Encryption Keys:', ClientEncryptionService.getKeys());
}
```

## 🔄 Deployment

### Development
```bash
# Start backend
cd backend && docker-compose up -d

# Start mobile app
cd lifeline-mobile && npm start
```

### Production
- Use proper SSL certificates
- Change all default passwords
- Configure monitoring and alerting
- Set up backup procedures

## 📞 Support

- Backend Issues: Check `backend/README.md`
- Mobile Issues: Check existing mobile documentation
- Security Concerns: Follow responsible disclosure
- Performance Issues: Check monitoring dashboards