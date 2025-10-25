import { ClientEncryptionService, EncryptedPayload } from './encryption';

const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://api.lifeline-plus.com/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    publicKey: string;
    lastLogin?: string;
  };
  encryptedPrivateKey: EncryptedPayload;
  dataKeys: Record<string, string>;
}

export interface HealthDataItem {
  id: string;
  dataType: string;
  encryptedPayload: string;
  tag: string;
  nonce: string;
  encryptedDataKey: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private token: string | null = null;
  private baseURL: string = API_BASE_URL;

  // Set authentication token
  setToken(token: string): void {
    this.token = token;
  }

  // Clear authentication token
  clearToken(): void {
    this.token = null;
  }

  // Make authenticated API request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add authentication header if token is available
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || 'An error occurred',
            details: data.error?.details
          }
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed'
        }
      };
    }
  }

  // Authentication endpoints
  async register(email: string, password: string, deviceId?: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceId })
    });
  }

  async login(email: string, password: string, deviceId?: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceId })
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request<{ token: string }>('/auth/refresh', {
      method: 'POST'
    });
  }

  // Health data endpoints
  async createHealthData(data: any, dataType: string): Promise<ApiResponse<{ id: string; createdAt: string }>> {
    try {
      // Encrypt data before sending
      const encryptedPayload = await ClientEncryptionService.encryptHealthData(data, dataType);
      
      return this.request<{ id: string; createdAt: string }>('/health-data', {
        method: 'POST',
        body: JSON.stringify({
          dataType,
          encryptedPayload: encryptedPayload.encryptedData,
          nonce: encryptedPayload.nonce,
          tag: encryptedPayload.tag
        })
      });
    } catch (error) {
      console.error('Failed to encrypt and send health data:', error);
      return {
        error: {
          code: 'ENCRYPTION_ERROR',
          message: 'Failed to encrypt health data'
        }
      };
    }
  }

  async getHealthData(dataType?: string, limit?: number, offset?: number): Promise<ApiResponse<{ data: HealthDataItem[]; pagination: any }>> {
    const params = new URLSearchParams();
    if (dataType) params.append('dataType', dataType);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const queryString = params.toString();
    const endpoint = `/health-data${queryString ? `?${queryString}` : ''}`;

    return this.request<{ data: HealthDataItem[]; pagination: any }>(endpoint);
  }

  async getHealthDataById(id: string): Promise<ApiResponse<HealthDataItem>> {
    return this.request<HealthDataItem>(`/health-data/${id}`);
  }

  async updateHealthData(id: string, data: any, dataType: string): Promise<ApiResponse<{ id: string; updatedAt: string }>> {
    try {
      // Encrypt data before sending
      const encryptedPayload = await ClientEncryptionService.encryptHealthData(data, dataType);
      
      return this.request<{ id: string; updatedAt: string }>(`/health-data/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          encryptedPayload: encryptedPayload.encryptedData,
          nonce: encryptedPayload.nonce,
          tag: encryptedPayload.tag
        })
      });
    } catch (error) {
      console.error('Failed to encrypt and update health data:', error);
      return {
        error: {
          code: 'ENCRYPTION_ERROR',
          message: 'Failed to encrypt health data'
        }
      };
    }
  }

  async deleteHealthData(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.request<{ id: string }>(`/health-data/${id}`, {
      method: 'DELETE'
    });
  }

  // Chat endpoints
  async createChat(messages: any[], examId?: string): Promise<ApiResponse<{ id: string; createdAt: string }>> {
    try {
      const encryptedPayload = await ClientEncryptionService.encryptHealthData(messages, 'chat');
      
      return this.request<{ id: string; createdAt: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({
          examId,
          encryptedMessages: encryptedPayload.encryptedData,
          nonce: encryptedPayload.nonce,
          tag: encryptedPayload.tag,
          messageCount: messages.length
        })
      });
    } catch (error) {
      console.error('Failed to encrypt and send chat data:', error);
      return {
        error: {
          code: 'ENCRYPTION_ERROR',
          message: 'Failed to encrypt chat data'
        }
      };
    }
  }

  async getChats(examId?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (examId) params.append('examId', examId);

    const queryString = params.toString();
    const endpoint = `/chat${queryString ? `?${queryString}` : ''}`;

    return this.request<any[]>(endpoint);
  }

  async updateChat(id: string, messages: any[]): Promise<ApiResponse<{ id: string; updatedAt: string }>> {
    try {
      const encryptedPayload = await ClientEncryptionService.encryptHealthData(messages, 'chat');
      
      return this.request<{ id: string; updatedAt: string }>(`/chat/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          encryptedMessages: encryptedPayload.encryptedData,
          nonce: encryptedPayload.nonce,
          tag: encryptedPayload.tag,
          messageCount: messages.length
        })
      });
    } catch (error) {
      console.error('Failed to encrypt and update chat data:', error);
      return {
        error: {
          code: 'ENCRYPTION_ERROR',
          message: 'Failed to encrypt chat data'
        }
      };
    }
  }

  // User endpoints
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.request('/user/profile');
  }

  async getUserKeys(): Promise<ApiResponse<Record<string, any>>> {
    return this.request('/user/keys');
  }

  async exportUserData(): Promise<ApiResponse<any>> {
    return this.request('/user/export');
  }

  async deleteAccount(): Promise<ApiResponse<any>> {
    return this.request('/user/account', {
      method: 'DELETE'
    });
  }

  // Helper method to decrypt received health data
  async decryptHealthData(item: HealthDataItem): Promise<any> {
    try {
      const encryptedPayload: EncryptedPayload = {
        encryptedData: item.encryptedPayload,
        nonce: item.nonce,
        tag: item.tag
      };

      return await ClientEncryptionService.decryptHealthData(encryptedPayload, item.dataType);
    } catch (error) {
      console.error('Failed to decrypt health data:', error);
      throw new Error('Failed to decrypt health data');
    }
  }
}

export const apiService = new ApiService();
export default apiService;