/**
 * Solution type definitions
 */

export interface SolveResponse {
  status: string;
  objective_value?: number;
  solution?: Record<string, any>;
  report_id?: string;
  execution_time_ms?: number;
  solver_info?: Record<string, any>;
}

export interface AnalysisResponse {
  problem_type: string;
  confidence: string;
  variables_detected: string[];
  constraints_detected: string[];
  recommendations: string[];
  extracted_data?: Record<string, any>;
}

export interface ReportMetadata {
  report_id: string;
  created_at: string;
  problem_type: string;
  status: string;
}
