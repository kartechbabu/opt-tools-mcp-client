/**
 * Problem type definitions
 */

export interface Variable {
  name: string;
  type: 'continuous' | 'integer' | 'binary';
  lower_bound?: number;
  upper_bound?: number;
  description?: string;
}

export interface Constraint {
  expression: string;
  description?: string;
}

export interface Objective {
  sense: 'maximize' | 'minimize';
  expression: string;
}

export interface LpProblem {
  variables: Variable[];
  objective: Objective;
  constraints?: Constraint[];
  timeout?: number;
  generate_report?: boolean;
}

export interface MipProblem {
  variables: Variable[];
  objective: Objective;
  constraints?: Constraint[];
  timeout?: number;
  generate_report?: boolean;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface TspProblem {
  locations: Location[];
  start_location?: string;
  timeout?: number;
  generate_report?: boolean;
}
