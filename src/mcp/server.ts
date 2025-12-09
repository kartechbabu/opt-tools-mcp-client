#!/usr/bin/env node
/**
 * MCP Server for Opt-Tools Optimization API
 *
 * Provides Claude with tools to solve optimization problems:
 * - solve_lp: Linear Programming
 * - solve_mip: Mixed-Integer Programming
 * - solve_tsp: Traveling Salesman Problem
 * - analyze_problem: Natural language problem analysis
 * - get_report: Retrieve HTML reports
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { OptimizationClient } from '../client.js';

// Get configuration from environment
const SERVER_URL = process.env.OPT_TOOLS_SERVER_URL || 'http://164.92.92.181';
const API_KEY = process.env.OPT_TOOLS_API_KEY || 'demo_key';

// Initialize the optimization client
const client = new OptimizationClient({
  serverUrl: SERVER_URL,
  apiKey: API_KEY,
  timeout: 120000, // 2 minutes for complex problems
  retries: 2,
});

// Define MCP tools
const tools: Tool[] = [
  {
    name: 'solve_lp',
    description: `Solve a Linear Programming (LP) optimization problem.
Use this for problems where you need to maximize or minimize a linear objective function
subject to linear constraints, with continuous (real-valued) decision variables.

Common use cases:
- Resource allocation
- Production planning
- Diet/blending problems
- Transportation problems

Returns the optimal solution values, objective value, and optionally an HTML report.`,
    inputSchema: {
      type: 'object',
      properties: {
        variables: {
          type: 'array',
          description: 'Decision variables for the problem',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Variable name (e.g., "x", "production_A")' },
              type: { type: 'string', enum: ['continuous'], description: 'Must be "continuous" for LP' },
              lower_bound: { type: 'number', description: 'Lower bound (default: 0)' },
              upper_bound: { type: 'number', description: 'Upper bound (default: infinity)' },
              description: { type: 'string', description: 'What this variable represents' },
            },
            required: ['name', 'type'],
          },
        },
        objective: {
          type: 'object',
          description: 'Objective function to optimize',
          properties: {
            sense: { type: 'string', enum: ['maximize', 'minimize'] },
            expression: { type: 'string', description: 'Linear expression (e.g., "3*x + 2*y")' },
          },
          required: ['sense', 'expression'],
        },
        constraints: {
          type: 'array',
          description: 'Linear constraints',
          items: {
            type: 'object',
            properties: {
              expression: { type: 'string', description: 'Constraint expression (e.g., "x + y <= 10")' },
              description: { type: 'string', description: 'What this constraint represents' },
            },
            required: ['expression'],
          },
        },
        generate_report: {
          type: 'boolean',
          description: 'Generate an HTML report with visualizations (default: true)',
        },
      },
      required: ['variables', 'objective'],
    },
  },
  {
    name: 'solve_mip',
    description: `Solve a Mixed-Integer Programming (MIP) optimization problem.
Use this for problems with integer or binary (0/1) decision variables.

Common use cases:
- Knapsack/selection problems
- Facility location
- Scheduling with discrete choices
- Yes/no decisions

Returns the optimal solution values, objective value, and optionally an HTML report.`,
    inputSchema: {
      type: 'object',
      properties: {
        variables: {
          type: 'array',
          description: 'Decision variables (can be continuous, integer, or binary)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Variable name' },
              type: { type: 'string', enum: ['continuous', 'integer', 'binary'], description: 'Variable type' },
              lower_bound: { type: 'number', description: 'Lower bound' },
              upper_bound: { type: 'number', description: 'Upper bound' },
              description: { type: 'string', description: 'What this variable represents' },
            },
            required: ['name', 'type'],
          },
        },
        objective: {
          type: 'object',
          properties: {
            sense: { type: 'string', enum: ['maximize', 'minimize'] },
            expression: { type: 'string', description: 'Linear expression' },
          },
          required: ['sense', 'expression'],
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              expression: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['expression'],
          },
        },
        generate_report: { type: 'boolean' },
      },
      required: ['variables', 'objective'],
    },
  },
  {
    name: 'solve_tsp',
    description: `Solve a Traveling Salesman Problem (TSP).
Find the shortest route visiting all locations exactly once and returning to the start.

Provide locations with latitude/longitude coordinates. The solver uses real geographic
distances (Haversine formula) to find the optimal tour.

Returns the optimal route, total distance, and an interactive map visualization.`,
    inputSchema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          description: 'List of locations to visit',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Location name' },
              latitude: { type: 'number', description: 'Latitude coordinate' },
              longitude: { type: 'number', description: 'Longitude coordinate' },
            },
            required: ['name', 'latitude', 'longitude'],
          },
        },
        start_location: {
          type: 'string',
          description: 'Name of the starting location (default: first in list)',
        },
        generate_report: {
          type: 'boolean',
          description: 'Generate an HTML report with route map (default: true)',
        },
      },
      required: ['locations'],
    },
  },
  {
    name: 'analyze_problem',
    description: `Analyze a natural language description of an optimization problem.
Identifies the problem type (LP, MIP, TSP), extracts variables and constraints,
and provides recommendations for formulation.

Use this when the user describes a problem in plain English and you need to
understand what type of optimization problem it is.`,
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Natural language description of the optimization problem',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'get_report',
    description: `Retrieve an HTML optimization report by its ID.
Reports contain interactive visualizations, solution details, and analysis.

Use this to fetch a previously generated report.`,
    inputSchema: {
      type: 'object',
      properties: {
        report_id: {
          type: 'string',
          description: 'The report ID returned from a solve operation',
        },
      },
      required: ['report_id'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'opt-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [{ type: 'text', text: 'Error: No arguments provided' }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'solve_lp': {
        const problem = {
          variables: args.variables as any[],
          objective: args.objective as any,
          constraints: (args.constraints as any[]) || [],
          generate_report: args.generate_report !== false,
        };
        const result = await client.solveLp(problem);
        return {
          content: [
            {
              type: 'text',
              text: formatSolveResponse(result, 'Linear Programming'),
            },
          ],
        };
      }

      case 'solve_mip': {
        const problem = {
          variables: args.variables as any[],
          objective: args.objective as any,
          constraints: (args.constraints as any[]) || [],
          generate_report: args.generate_report !== false,
        };
        const result = await client.solveMip(problem);
        return {
          content: [
            {
              type: 'text',
              text: formatSolveResponse(result, 'Mixed-Integer Programming'),
            },
          ],
        };
      }

      case 'solve_tsp': {
        const problem = {
          locations: args.locations as any[],
          start_location: args.start_location as string | undefined,
          generate_report: args.generate_report !== false,
        };
        const result = await client.solveTsp(problem);
        return {
          content: [
            {
              type: 'text',
              text: formatTspResponse(result),
            },
          ],
        };
      }

      case 'analyze_problem': {
        const result = await client.analyzeProblem(args.description as string);
        return {
          content: [
            {
              type: 'text',
              text: formatAnalysisResponse(result),
            },
          ],
        };
      }

      case 'get_report': {
        const reportId = args.report_id as string;
        const html = await client.getReport(reportId);
        return {
          content: [
            {
              type: 'text',
              text: `HTML Report (${html.length} characters):\n\nThe report has been retrieved. To view it, save the content to an HTML file and open in a browser.\n\nReport ID: ${reportId}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Helper functions to format responses
function formatSolveResponse(result: any, problemType: string): string {
  const lines = [
    `## ${problemType} Solution`,
    '',
    `**Status:** ${result.status}`,
    `**Objective Value:** ${result.objective_value}`,
    '',
    '### Solution Values:',
  ];

  if (result.solution) {
    for (const [name, value] of Object.entries(result.solution)) {
      lines.push(`- ${name} = ${value}`);
    }
  }

  lines.push('');
  lines.push(`**Solve Time:** ${result.execution_time_ms?.toFixed(2)}ms`);
  lines.push(`**Solver:** ${result.solver_info?.solver || 'OR-Tools'}`);

  if (result.report_id) {
    lines.push('');
    lines.push(`**Report ID:** ${result.report_id}`);
    lines.push(`View the full report at: ${SERVER_URL}/api/reports/${result.report_id}`);
  }

  return lines.join('\n');
}

function formatTspResponse(result: any): string {
  const lines = [
    '## Traveling Salesman Solution',
    '',
    `**Status:** ${result.status}`,
    `**Total Distance:** ${(result.objective_value / 1000).toFixed(2)} km`,
    '',
    '### Optimal Route:',
  ];

  if (result.solution?.route_names) {
    const route = result.solution.route_names;
    lines.push(route.join(' → '));
  }

  if (result.solution?.segments) {
    lines.push('');
    lines.push('### Route Segments:');
    for (const seg of result.solution.segments) {
      const dist = (seg.distance / 1000).toFixed(2);
      lines.push(`- ${seg.from_name} → ${seg.to_name}: ${dist} km`);
    }
  }

  lines.push('');
  lines.push(`**Solve Time:** ${(result.execution_time_ms / 1000).toFixed(1)}s`);

  if (result.report_id) {
    lines.push('');
    lines.push(`**Report ID:** ${result.report_id}`);
    lines.push(`View the route map at: ${SERVER_URL}/api/reports/${result.report_id}`);
  }

  return lines.join('\n');
}

function formatAnalysisResponse(result: any): string {
  const lines = [
    '## Problem Analysis',
    '',
    `**Problem Type:** ${result.problem_type}`,
    `**Confidence:** ${result.confidence}`,
    '',
  ];

  if (result.variables_detected?.length) {
    lines.push('### Detected Variables:');
    for (const v of result.variables_detected) {
      lines.push(`- ${v}`);
    }
    lines.push('');
  }

  if (result.constraints_detected?.length) {
    lines.push('### Detected Constraints:');
    for (const c of result.constraints_detected) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }

  if (result.recommendations?.length) {
    lines.push('### Recommendations:');
    for (const r of result.recommendations) {
      lines.push(`- ${r}`);
    }
  }

  return lines.join('\n');
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Opt-Tools MCP Server running on stdio');
  console.error(`Connected to: ${SERVER_URL}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
