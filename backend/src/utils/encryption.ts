import crypto from 'crypto';
import forge from 'node-forge';
import { logger } from './logger';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly TAG_LENGTH = 16; // 128 bits

  // Generate a random encryption key
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  // Generate a random IV/nonce
  static generateIV(): string {
    return crypto.randomBytes(this.IV_LENGTH).toString('hex');
  }

  // Encrypt data with AES-256-GCM
  static encrypt(data: string, key: string, iv?: string): { encrypted: string; iv: string; tag: string } {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = iv ? Buffer.from(iv, 'hex') : crypto.randomBytes(this.IV_LENGTH);

      const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
      cipher.setAAD(Buffer.from('lifeline-health-data', 'utf8'));

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: ivBuffer.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  // Decrypt data with AES-256-GCM
  static decrypt(encryptedData: string, key: string, iv: string, tag: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
      decipher.setAAD(Buffer.from('lifeline-health-data', 'utf8'));
      decipher.setAuthTag(tagBuffer);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  // Generate RSA key pair for user
  static generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    try {
      const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      
      const publicKey = forge.pki.publicKeyToPem(keyPair.publicKey);
      const privateKey = forge.pki.privateKeyToPem(keyPair.privateKey);

      return { publicKey, privateKey };
    } catch (error) {
      logger.error('RSA key generation failed:', error);
      throw new Error('RSA key generation failed');
    }
  }

  // Encrypt data with RSA public key
  static encryptWithRSA(data: string, publicKeyPem: string): string {
    try {
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const encrypted = publicKey.encrypt(data, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: forge.mgf.mgf1.create(forge.md.sha256.create())
      });
      
      return forge.util.encode64(encrypted);
    } catch (error) {
      logger.error('RSA encryption failed:', error);
      throw new Error('RSA encryption failed');
    }
  }

  // Decrypt data with RSA private key
  static decryptWithRSA(encryptedData: string, privateKeyPem: string): string {
    try {
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const encrypted = forge.util.decode64(encryptedData);
      
      const decrypted = privateKey.decrypt(encrypted, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: forge.mgf.mgf1.create(forge.md.sha256.create())
      });
      
      return decrypted;
    } catch (error) {
      logger.error('RSA decryption failed:', error);
      throw new Error('RSA decryption failed');
    }
  }

  // Hash data with SHA-256
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate secure random salt
  static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // Derive key from password using PBKDF2
  static deriveKey(password: string, salt: string, iterations: number = 100000): string {
    return crypto.pbkdf2Sync(password, salt, iterations, this.KEY_LENGTH, 'sha256').toString('hex');
  }
}

// Client-side encryption utilities for mobile app
export interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  tag: string;
  keyId: string;
}

export interface ClientEncryptionKeys {
  masterKey: string;
  dataKeys: Map<string, string>;
}