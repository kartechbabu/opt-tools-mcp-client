# @kartech/opt-tools-mcp

MCP server and TypeScript client for the Opt-Tools optimization API. Solve linear programming (LP), mixed-integer programming (MIP), and traveling salesman problems (TSP) with Claude Desktop/Code or programmatically.

## Features

- **MCP Server** - Use optimization tools directly in Claude Desktop or Claude Code
- **Type-safe** - Full TypeScript support with detailed type definitions
- **Reliable** - Automatic retry logic with exponential backoff
- **Simple** - Clean, promise-based API
- **Flexible** - Works in Node.js, browsers, and edge runtimes

## Quick Start: MCP Server for Claude

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "opt-tools": {
      "command": "npx",
      "args": ["-y", "@kartech/opt-tools-mcp"],
      "env": {
        "OPT_TOOLS_SERVER_URL": "http://164.92.92.181",
        "OPT_TOOLS_API_KEY": "demo_key"
      }
    }
  }
}
```

### Claude Code

Add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "opt-tools": {
      "command": "npx",
      "args": ["-y", "@kartech/opt-tools-mcp"],
      "env": {
        "OPT_TOOLS_SERVER_URL": "http://164.92.92.181",
        "OPT_TOOLS_API_KEY": "demo_key"
      }
    }
  }
}
```

### Available MCP Tools

Once configured, Claude will have access to:

| Tool | Description |
|------|-------------|
| `solve_lp` | Solve linear programming problems (resource allocation, production planning) |
| `solve_mip` | Solve mixed-integer problems (knapsack, facility location, scheduling) |
| `solve_tsp` | Find optimal routes visiting multiple locations |
| `analyze_problem` | Analyze natural language problem descriptions |
| `get_report` | Retrieve HTML reports with visualizations |

### Example Prompts for Claude

- "Solve this LP: maximize 3x + 2y subject to x + y <= 10 and 2x + y <= 15, where x, y >= 0"
- "Find the shortest route visiting San Francisco, Oakland, Berkeley, and Palo Alto starting from SF"
- "I have 5 items with weights [2,3,4,5,9] and values [3,4,8,8,10]. My bag holds 20kg. Which items should I take?"

---

## Programmatic Usage

### Installation

```bash
npm install @kartech/opt-tools-mcp
```

### Quick Start

```typescript
import { OptimizationClient } from '@kartech/opt-tools-mcp';

// Initialize client
const client = new OptimizationClient({
  serverUrl: 'http://164.92.92.181',
  apiKey: 'demo_key',
  timeout: 30000,  // Optional: 30 seconds
  retries: 3,      // Optional: retry failed requests
  debug: false     // Optional: enable debug logging
});

// Solve a linear programming problem
const lpSolution = await client.solveLp({
  variables: [
    { name: 'x', type: 'continuous', lower_bound: 0 },
    { name: 'y', type: 'continuous', lower_bound: 0 }
  ],
  objective: {
    type: 'maximize',
    expression: '3*x + 2*y'
  },
  constraints: [
    { expression: 'x + y <= 10', type: 'inequality' },
    { expression: '2*x + y <= 15', type: 'inequality' }
  ],
  generate_report: true
});

console.log('Status:', lpSolution.status);
console.log('Optimal value:', lpSolution.objective_value);
console.log('Solution:', lpSolution.solution);

// Get HTML report
if (lpSolution.report_id) {
  const htmlReport = await client.getReport(lpSolution.report_id);
  // Save or display the HTML report
}
```

## API Reference

### Constructor

```typescript
new OptimizationClient(config: OptimizationClientConfig)
```

**Configuration Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `serverUrl` | string | Yes | - | Base URL of the Opt-Tools API server |
| `apiKey` | string | Yes | - | Your API key for authentication |
| `timeout` | number | No | 30000 | Request timeout in milliseconds |
| `retries` | number | No | 3 | Number of retry attempts for failed requests |
| `debug` | boolean | No | false | Enable debug logging |

### Methods

#### `solveLp(problem: LpProblem): Promise<SolveResponse>`

Solve a linear programming problem (all continuous variables).

**Example:**
```typescript
const solution = await client.solveLp({
  variables: [
    { name: 'x1', type: 'continuous', lower_bound: 0, upper_bound: 100 },
    { name: 'x2', type: 'continuous', lower_bound: 0 }
  ],
  objective: {
    type: 'minimize',
    expression: '5*x1 + 3*x2'
  },
  constraints: [
    { expression: '2*x1 + x2 >= 20', type: 'inequality' },
    { expression: 'x1 + 2*x2 >= 10', type: 'inequality' }
  ],
  timeout: 60,
  generate_report: true
});
```

#### `solveMip(problem: MipProblem): Promise<SolveResponse>`

Solve a mixed-integer programming problem (mix of continuous and integer/binary variables).

**Example:**
```typescript
const solution = await client.solveMip({
  variables: [
    { name: 'x', type: 'continuous', lower_bound: 0 },
    { name: 'y', type: 'integer', lower_bound: 0, upper_bound: 10 },
    { name: 'z', type: 'binary' }  // 0 or 1
  ],
  objective: {
    type: 'maximize',
    expression: '10*x + 15*y + 20*z'
  },
  constraints: [
    { expression: 'x + 2*y + 3*z <= 100', type: 'inequality' }
  ]
});
```

#### `solveTsp(problem: TspProblem): Promise<SolveResponse>`

Solve a traveling salesman problem (find shortest route visiting all locations).

**Example:**
```typescript
const solution = await client.solveTsp({
  locations: [
    { name: 'Warehouse', lat: 37.7749, lon: -122.4194 },
    { name: 'Customer A', lat: 37.8044, lon: -122.2712 },
    { name: 'Customer B', lat: 37.6879, lon: -122.4702 },
    { name: 'Customer C', lat: 37.7580, lon: -122.4430 }
  ],
  start_location: 'Warehouse',
  end_location: 'Warehouse',  // Optional: return to start
  timeout: 120
});

// Solution contains optimized route order
console.log('Route:', solution.solution.route);
console.log('Total distance:', solution.solution.total_distance);
```

#### `analyzeProblem(description: string): Promise<AnalysisResponse>`

Analyze a natural language problem description to identify problem type and structure.

**Example:**
```typescript
const analysis = await client.analyzeProblem(
  "I need to maximize profit from selling products x and y. " +
  "Product x earns $3 profit and y earns $2. " +
  "I have 10 hours of labor and 15 units of material. " +
  "x needs 1 hour and 2 materials, y needs 1 hour and 1 material."
);

console.log('Problem type:', analysis.problem_type);
console.log('Variables:', analysis.variables_detected);
console.log('Constraints:', analysis.constraints_detected);
console.log('Recommendations:', analysis.recommendations);
```

#### `getReport(reportId: string): Promise<string>`

Retrieve an HTML report by its ID.

**Example:**
```typescript
const htmlReport = await client.getReport('report-uuid-here');

// In Node.js - save to file
import { writeFileSync } from 'fs';
writeFileSync('report.html', htmlReport);

// In browser - display in new tab
const newWindow = window.open();
newWindow.document.write(htmlReport);
```

#### `listReports(limit?: number): Promise<ReportMetadata[]>`

List recent reports for the authenticated user.

**Example:**
```typescript
const reports = await client.listReports(50);

reports.forEach(report => {
  console.log(`${report.report_id}: ${report.problem_type} (${report.status})`);
  console.log(`  Created: ${report.created_at}`);
});
```

## Type Definitions

### Variable

```typescript
interface Variable {
  name: string;
  type: 'continuous' | 'integer' | 'binary';
  lower_bound?: number;
  upper_bound?: number;
  description?: string;
}
```

### Objective

```typescript
interface Objective {
  type: 'minimize' | 'maximize';
  expression: string;
  description?: string;
}
```

### Constraint

```typescript
interface Constraint {
  expression: string;
  type: 'equality' | 'inequality';
  description?: string;
}
```

### SolveResponse

```typescript
interface SolveResponse {
  status: string;                    // "OPTIMAL", "FEASIBLE", "INFEASIBLE", etc.
  objective_value?: number;          // Optimal objective value
  solution?: Record<string, any>;    // Variable values and other solution data
  report_id?: string;                // ID for retrieving HTML report
  execution_time_ms?: number;        // Solver execution time
  solver_info?: Record<string, any>; // Additional solver information
}
```

## Error Handling

The client automatically retries failed requests (network errors, rate limits, service unavailable). For unrecoverable errors, it throws standard JavaScript errors:

```typescript
try {
  const solution = await client.solveLp(problem);
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid API key');
  } else if (error.response?.status === 400) {
    console.error('Invalid request:', error.response.data);
  } else if (error.code === 'ECONNREFUSED') {
    console.error('Cannot connect to server');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Rate Limiting

The API enforces rate limits based on your plan:

- **Free**: 5 requests/minute
- **Pro**: 60 requests/minute
- **Enterprise**: Unlimited

When rate limited (HTTP 429), the client automatically retries with exponential backoff.

## Timeouts

Default timeout is 30 seconds. For complex optimization problems, increase the timeout:

```typescript
const client = new OptimizationClient({
  serverUrl: 'http://164.92.92.181',
  apiKey: 'demo_key',
  timeout: 120000  // 2 minutes
});

// Or per-request timeout for specific problems
const solution = await client.solveMip({
  // ... problem definition
  timeout: 300  // 5 minutes for this specific problem
});
```

## Debug Logging

Enable debug mode to see detailed request/response logs:

```typescript
const client = new OptimizationClient({
  serverUrl: 'http://164.92.92.181',
  apiKey: 'demo_key',
  debug: true
});

// Logs will show:
// [OptimizationClient] Solving LP problem: {...}
// [OptimizationClient] Response received: {...}
```

## License

MIT

## Support

For issues and feature requests, please visit: https://github.com/kartbabu/opt-tools-mcp-client/issues

For API documentation and examples, visit: https://api.opt-tools.com/docs
