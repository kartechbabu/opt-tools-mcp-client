# opt-tools-mcp-client - Claude Code Instructions

## Project Overview
This is the **public TypeScript client** for the opt-tools optimization API. It provides a type-safe interface for Node.js, browsers, and Claude Desktop/Code integration.

## Role in Ecosystem
```
[THIS REPO] mcp-client → opt-tools-http → opt-tools-core
        ↓
  - TypeScript types
  - HTTP transport with retry
  - Easy NPM installation
```

- **Upstream**: End users, Claude Desktop, web apps
- **Downstream**: Calls opt-tools-http REST API
- **Visibility**: PUBLIC (published to NPM)

## Client API

```typescript
import { OptimizationClient } from '@opt-tools/mcp-client';

const client = new OptimizationClient({
  serverUrl: 'https://api.opt-tools.com',
  apiKey: process.env.OPT_TOOLS_API_KEY!,
});

// Solve LP
const solution = await client.solveLp({
  variables: [{ name: 'x', type: 'continuous', lower_bound: 0 }],
  objective: { sense: 'maximize', expression: '3*x' },
  constraints: [{ expression: 'x <= 10' }],
  generate_report: true,
});

// Get report
if (solution.report_id) {
  const html = await client.getReport(solution.report_id);
}
```

## Key Files
- `src/client.ts` - Main OptimizationClient class
- `src/transport/http.ts` - Axios HTTP transport with retry
- `src/types/problems.ts` - LP/MIP/TSP problem types
- `src/types/solutions.ts` - Response types
- `examples/basic-usage.ts` - Usage examples
- `examples/web-browser.html` - Browser demo

## Development Commands

```bash
# Setup
npm install

# Build TypeScript
npm run build

# Run tests (currently empty)
npm test

# Test against local API
OPT_TOOLS_SERVER_URL=http://localhost:8000 \
OPT_TOOLS_API_KEY=test_key \
npx ts-node examples/basic-usage.ts
```

## Current Status
- OptimizationClient class complete
- All problem types (LP, MIP, TSP) supported
- HTTP transport with retry logic
- TypeScript types complete
- Tests directory empty (needs tests)
- Not yet published to NPM

## Next Steps for This Repo
1. Write Jest unit tests
2. Build and publish to NPM
3. Add MCP protocol adapter for Claude Desktop
4. Create more examples

## GitHub
- URL: `git@github.com:kartbabu/opt-tools-mcp-client.git`
- Branch: main
- NPM: `@opt-tools/mcp-client` (not yet published)
