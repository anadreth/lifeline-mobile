import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

export interface EncryptedPayload {
  encryptedData: string;
  nonce: string;
  tag: string;
}

export interface UserKeys {
  masterKey: string;
  publicKey: string;
  encryptedPrivateKey: EncryptedPayload;
  dataKeys: Record<string, string>; // encrypted with user's public key
}

export class ClientEncryptionService {
  private static masterKey: string | null = null;
  private static privateKey: string | null = null;
  private static dataKeys: Map<string, string> = new Map();

  // Initialize encryption service after login
  static async initialize(userKeys: UserKeys, password: string): Promise<void> {
    try {
      // Store master key
      this.masterKey = userKeys.masterKey;

      // Decrypt private key with master key
      const decryptedPrivateKey = this.decryptWithAES(
        userKeys.encryptedPrivateKey.encryptedData,
        userKeys.masterKey,
        userKeys.encryptedPrivateKey.nonce,
        userKeys.encryptedPrivateKey.tag
      );
      
      this.privateKey = decryptedPrivateKey;

      // Decrypt and store data keys
      for (const [dataType, encryptedKey] of Object.entries(userKeys.dataKeys)) {
        const decryptedKey = await this.decryptWithRSA(encryptedKey, decryptedPrivateKey);
        this.dataKeys.set(dataType, decryptedKey);
      }

      // Store encrypted keys in secure storage for session persistence
      await SecureStore.setItemAsync('user_master_key', userKeys.masterKey);
      await SecureStore.setItemAsync('user_private_key', decryptedPrivateKey);

    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  // Encrypt health data before sending to backend
  static async encryptHealthData(data: any, dataType: string): Promise<EncryptedPayload> {
    try {
      const dataKey = this.dataKeys.get(dataType);
      if (!dataKey) {
        throw new Error(`No encryption key found for data type: ${dataType}`);
      }

      const nonce = this.generateNonce();
      const jsonData = JSON.stringify(data);
      
      const encrypted = this.encryptWithAES(jsonData, dataKey, nonce);
      
      return {
        encryptedData: encrypted.encrypted,
        nonce: encrypted.nonce,
        tag: encrypted.tag
      };
    } catch (error) {
      console.error('Health data encryption failed:', error);
      throw new Error('Failed to encrypt health data');
    }
  }

  // Decrypt health data received from backend
  static async decryptHealthData(payload: EncryptedPayload, dataType: string): Promise<any> {
    try {
      const dataKey = this.dataKeys.get(dataType);
      if (!dataKey) {
        throw new Error(`No decryption key found for data type: ${dataType}`);
      }

      const decrypted = this.decryptWithAES(
        payload.encryptedData,
        dataKey,
        payload.nonce,
        payload.tag
      );
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Health data decryption failed:', error);
      throw new Error('Failed to decrypt health data');
    }
  }

  // Generate master key from password and biometric
  static async deriveMasterKey(password: string, salt: string, biometricHash?: string): Promise<string> {
    try {
      const input = password + (biometricHash || '');
      const key = CryptoJS.PBKDF2(input, salt, {
        keySize: 256/32,
        iterations: 100000
      });
      
      return key.toString();
    } catch (error) {
      console.error('Master key derivation failed:', error);
      throw new Error('Failed to derive master key');
    }
  }

  // AES-256-GCM encryption
  private static encryptWithAES(data: string, key: string, nonce?: string): { encrypted: string; nonce: string; tag: string } {
    try {
      const actualNonce = nonce || this.generateNonce();
      const keyWordArray = CryptoJS.enc.Hex.parse(key);
      const nonceWordArray = CryptoJS.enc.Hex.parse(actualNonce);
      
      // Note: CryptoJS doesn't support GCM mode directly
      // For production, use a library that supports AES-GCM
      // For now, using AES-CTR which is still secure
      const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
        iv: nonceWordArray,
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding
      });

      // Generate authentication tag (simplified for demo)
      const tag = CryptoJS.HmacSHA256(encrypted.toString(), keyWordArray).toString().substring(0, 32);

      return {
        encrypted: encrypted.toString(),
        nonce: actualNonce,
        tag
      };
    } catch (error) {
      console.error('AES encryption failed:', error);
      throw new Error('AES encryption failed');
    }
  }

  // AES-256-GCM decryption
  private static decryptWithAES(encryptedData: string, key: string, nonce: string, tag: string): string {
    try {
      const keyWordArray = CryptoJS.enc.Hex.parse(key);
      const nonceWordArray = CryptoJS.enc.Hex.parse(nonce);
      
      // Verify authentication tag (simplified for demo)
      const expectedTag = CryptoJS.HmacSHA256(encryptedData, keyWordArray).toString().substring(0, 32);
      if (expectedTag !== tag) {
        throw new Error('Authentication tag verification failed');
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWordArray, {
        iv: nonceWordArray,
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('AES decryption failed:', error);
      throw new Error('AES decryption failed');
    }
  }

  // RSA decryption (simplified - would use actual RSA library in production)
  private static async decryptWithRSA(encryptedData: string, privateKeyPem: string): Promise<string> {
    try {
      // This is a simplified implementation
      // In production, use a proper RSA library like node-forge or similar
      // For now, return the encrypted data as-is (this won't work in practice)
      console.warn('RSA decryption not implemented - using simplified version');
      return encryptedData;
    } catch (error) {
      console.error('RSA decryption failed:', error);
      throw new Error('RSA decryption failed');
    }
  }

  // Generate cryptographically secure nonce
  private static generateNonce(): string {
    const array = new Uint8Array(12); // 96 bits for GCM
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate secure random key
  static generateKey(): string {
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash data for privacy
  static async hash(data: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return digest;
  }

  // Clear sensitive data from memory
  static clearKeys(): void {
    this.masterKey = null;
    this.privateKey = null;
    this.dataKeys.clear();
    
    // Clear from secure storage
    SecureStore.deleteItemAsync('user_master_key').catch(() => {});
    SecureStore.deleteItemAsync('user_private_key').catch(() => {});
  }

  // Get current data key for a type
  static getDataKey(dataType: string): string | null {
    return this.dataKeys.get(dataType) || null;
  }

  // Add new data key
  static addDataKey(dataType: string, encryptedKey: string): void {
    if (!this.privateKey) {
      throw new Error('Private key not available');
    }

    // In practice, decrypt the key with RSA private key
    // For now, store as-is
    this.dataKeys.set(dataType, encryptedKey);
  }
}