import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ClientEncryptionService } from '../services/encryption';
import apiService from '../services/api';
import { clearExamCache } from '../utils/exam-storage';

export interface User {
  id: string;
  publicKey: string;
  lastLogin?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check for stored token
      const token = await SecureStore.getItemAsync('auth_token');
      const userInfo = await SecureStore.getItemAsync('user_info');

      if (token && userInfo) {
        // Set token in API service
        apiService.setToken(token);

        // Parse user info
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);

        // Try to refresh token to ensure it's still valid
        try {
          const refreshResponse = await apiService.refreshToken();
          if (refreshResponse.data?.token) {
            await SecureStore.setItemAsync('auth_token', refreshResponse.data.token);
            apiService.setToken(refreshResponse.data.token);
          }
        } catch (error) {
          console.log('Token refresh failed, user needs to login again');
          await logout();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Call login API
      const response = await apiService.login(email, password);

      if (response.error) {
        return {
          success: false,
          error: response.error.message
        };
      }

      if (!response.data) {
        return {
          success: false,
          error: 'Invalid response from server'
        };
      }

      const { token, user: userData, encryptedPrivateKey, dataKeys } = response.data;

      // Store token securely
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_info', JSON.stringify(userData));

      // Set token in API service
      apiService.setToken(token);

      // Initialize encryption service
      const masterKey = await ClientEncryptionService.deriveMasterKey(password, 'default-salt');
      
      await ClientEncryptionService.initialize({
        masterKey,
        publicKey: userData.publicKey,
        encryptedPrivateKey,
        dataKeys
      }, password);

      // Set user state
      setUser(userData);

      return { success: true };

    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Call register API
      const response = await apiService.register(email, password);

      if (response.error) {
        return {
          success: false,
          error: response.error.message
        };
      }

      if (!response.data) {
        return {
          success: false,
          error: 'Invalid response from server'
        };
      }

      const { token, user: userData, encryptedPrivateKey, dataKeys } = response.data;

      // Store token securely
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_info', JSON.stringify(userData));

      // Set token in API service
      apiService.setToken(token);

      // Initialize encryption service
      const masterKey = await ClientEncryptionService.deriveMasterKey(password, 'default-salt');
      
      await ClientEncryptionService.initialize({
        masterKey,
        publicKey: userData.publicKey,
        encryptedPrivateKey,
        dataKeys
      }, password);

      // Set user state
      setUser(userData);

      return { success: true };

    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API to invalidate token on server
      await apiService.logout();
    } catch (error) {
      console.log('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }

    // Clear local storage
    await Promise.all([
      SecureStore.deleteItemAsync('auth_token'),
      SecureStore.deleteItemAsync('user_info'),
      SecureStore.deleteItemAsync('user_master_key'),
      SecureStore.deleteItemAsync('user_private_key')
    ]);

    // Clear API service token
    apiService.clearToken();

    // Clear encryption keys
    ClientEncryptionService.clearKeys();

    // Clear cached data
    clearExamCache();

    // Reset user state
    setUser(null);
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const response = await apiService.refreshToken();
      
      if (response.data?.token) {
        await SecureStore.setItemAsync('auth_token', response.data.token);
        apiService.setToken(response.data.token);
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};