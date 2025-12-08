/**
 * HTTP transport layer with retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

export class HttpTransport {
  private client: AxiosInstance;

  constructor(serverUrl: string, apiKey: string, timeout: number = 30000, retries: number = 3) {
    this.client = axios.create({
      baseURL: serverUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status === 429) || // Rate limit
          (error.response?.status === 503);    // Service unavailable
      },
    });
  }

  async post<T>(path: string, data: any): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.client.get<T>(path);
    return response.data;
  }
}
