/**
 * Configuration for OptimizationClient
 */
export interface OptimizationClientConfig {
  /** API server URL (e.g., "https://api.opt-tools.com") */
  serverUrl: string;

  /** API key for authentication */
  apiKey: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Number of retry attempts (default: 3) */
  retries?: number;

  /** Enable debug logging (default: false) */
  debug?: boolean;
}
