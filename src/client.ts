/**
 * Main Optimization Client
 */

import { HttpTransport } from './transport/http.js';
import {
  OptimizationClientConfig,
  LpProblem,
  MipProblem,
  TspProblem,
  SolveResponse,
  AnalysisResponse,
  ReportMetadata,
} from './types/index.js';

export class OptimizationClient {
  private transport: HttpTransport;
  private config: OptimizationClientConfig;

  constructor(config: OptimizationClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      debug: false,
      ...config,
    };

    this.transport = new HttpTransport(
      this.config.serverUrl,
      this.config.apiKey,
      this.config.timeout,
      this.config.retries
    );
  }

  /**
   * Solve linear programming problem
   */
  async solveLp(problem: LpProblem): Promise<SolveResponse> {
    if (this.config.debug) {
      console.log('[OptimizationClient] Solving LP problem:', problem);
    }

    return await this.transport.post<SolveResponse>('/api/solve/lp', problem);
  }

  /**
   * Solve mixed-integer programming problem
   */
  async solveMip(problem: MipProblem): Promise<SolveResponse> {
    if (this.config.debug) {
      console.log('[OptimizationClient] Solving MIP problem:', problem);
    }

    return await this.transport.post<SolveResponse>('/api/solve/mip', problem);
  }

  /**
   * Solve traveling salesman problem
   */
  async solveTsp(problem: TspProblem): Promise<SolveResponse> {
    if (this.config.debug) {
      console.log('[OptimizationClient] Solving TSP problem:', problem);
    }

    return await this.transport.post<SolveResponse>('/api/solve/tsp', problem);
  }

  /**
   * Analyze problem from natural language description
   */
  async analyzeProblem(description: string): Promise<AnalysisResponse> {
    if (this.config.debug) {
      console.log('[OptimizationClient] Analyzing problem');
    }

    return await this.transport.post<AnalysisResponse>('/api/analyze', {
      description,
    });
  }

  /**
   * Get HTML report by ID
   */
  async getReport(reportId: string): Promise<string> {
    if (this.config.debug) {
      console.log('[OptimizationClient] Getting report:', reportId);
    }

    return await this.transport.get<string>(`/api/reports/${reportId}`);
  }

  /**
   * List reports for authenticated user
   */
  async listReports(limit: number = 50): Promise<ReportMetadata[]> {
    if (this.config.debug) {
      console.log('[OptimizationClient] Listing reports');
    }

    const response = await this.transport.get<{ reports: ReportMetadata[]; total: number }>(
      `/api/reports?limit=${limit}`
    );

    return response.reports;
  }
}
