/**
 * Basic usage examples for @opt-tools/mcp-client
 */

import { OptimizationClient } from '@opt-tools/mcp-client';

// Initialize the client
const client = new OptimizationClient({
  serverUrl: process.env.OPT_TOOLS_SERVER_URL || 'https://api.opt-tools.com',
  apiKey: process.env.OPT_TOOLS_API_KEY || 'your-api-key-here',
  timeout: 30000,
  retries: 3,
  debug: true,
});

/**
 * Example 1: Linear Programming (Production Planning)
 *
 * A factory produces two products: chairs and tables
 * - Chair: $3 profit, 1 hour labor, 2 units material
 * - Table: $2 profit, 1 hour labor, 1 unit material
 * - Available: 10 hours labor, 15 units material
 *
 * Goal: Maximize profit
 */
async function example1_ProductionPlanning() {
  console.log('\n=== Example 1: Production Planning (LP) ===\n');

  const solution = await client.solveLp({
    variables: [
      {
        name: 'chairs',
        type: 'continuous',
        lower_bound: 0,
        description: 'Number of chairs to produce'
      },
      {
        name: 'tables',
        type: 'continuous',
        lower_bound: 0,
        description: 'Number of tables to produce'
      }
    ],
    objective: {
      type: 'maximize',
      expression: '3*chairs + 2*tables',
      description: 'Total profit in dollars'
    },
    constraints: [
      {
        expression: 'chairs + tables <= 10',
        type: 'inequality',
        description: 'Labor hours constraint'
      },
      {
        expression: '2*chairs + tables <= 15',
        type: 'inequality',
        description: 'Material units constraint'
      }
    ],
    generate_report: true,
  });

  console.log('Status:', solution.status);
  console.log('Maximum profit: $', solution.objective_value);
  console.log('Optimal production:');
  console.log('  Chairs:', solution.solution?.chairs);
  console.log('  Tables:', solution.solution?.tables);
  console.log('Report ID:', solution.report_id);
  console.log('Execution time:', solution.execution_time_ms, 'ms');
}

/**
 * Example 2: Mixed-Integer Programming (Facility Location)
 *
 * Decide which warehouses to open and how to allocate customers
 * - Binary variables: whether to open warehouse A or B
 * - Integer variables: number of shipments to each customer
 * - Continuous variables: total cost
 */
async function example2_FacilityLocation() {
  console.log('\n=== Example 2: Facility Location (MIP) ===\n');

  const solution = await client.solveMip({
    variables: [
      { name: 'open_warehouse_A', type: 'binary', description: 'Open warehouse A (yes/no)' },
      { name: 'open_warehouse_B', type: 'binary', description: 'Open warehouse B (yes/no)' },
      { name: 'ship_A_to_customer1', type: 'integer', lower_bound: 0, upper_bound: 100 },
      { name: 'ship_A_to_customer2', type: 'integer', lower_bound: 0, upper_bound: 100 },
      { name: 'ship_B_to_customer1', type: 'integer', lower_bound: 0, upper_bound: 100 },
      { name: 'ship_B_to_customer2', type: 'integer', lower_bound: 0, upper_bound: 100 },
    ],
    objective: {
      type: 'minimize',
      expression: '1000*open_warehouse_A + 1500*open_warehouse_B + ' +
                  '5*ship_A_to_customer1 + 7*ship_A_to_customer2 + ' +
                  '6*ship_B_to_customer1 + 4*ship_B_to_customer2',
      description: 'Total cost (fixed costs + shipping costs)'
    },
    constraints: [
      // Customer 1 needs 50 units
      { expression: 'ship_A_to_customer1 + ship_B_to_customer1 == 50', type: 'equality' },
      // Customer 2 needs 60 units
      { expression: 'ship_A_to_customer2 + ship_B_to_customer2 == 60', type: 'equality' },
      // Can only ship from warehouse A if it's open
      { expression: 'ship_A_to_customer1 + ship_A_to_customer2 <= 1000*open_warehouse_A', type: 'inequality' },
      // Can only ship from warehouse B if it's open
      { expression: 'ship_B_to_customer1 + ship_B_to_customer2 <= 1000*open_warehouse_B', type: 'inequality' },
      // At least one warehouse must be open
      { expression: 'open_warehouse_A + open_warehouse_B >= 1', type: 'inequality' },
    ],
    timeout: 60,
    generate_report: true,
  });

  console.log('Status:', solution.status);
  console.log('Minimum cost: $', solution.objective_value);
  console.log('Optimal solution:');
  console.log('  Open warehouse A:', solution.solution?.open_warehouse_A ? 'Yes' : 'No');
  console.log('  Open warehouse B:', solution.solution?.open_warehouse_B ? 'Yes' : 'No');
  console.log('Report ID:', solution.report_id);
}

/**
 * Example 3: Traveling Salesman Problem (Delivery Route)
 *
 * Find the shortest route to visit all delivery locations
 */
async function example3_DeliveryRoute() {
  console.log('\n=== Example 3: Delivery Route (TSP) ===\n');

  const solution = await client.solveTsp({
    locations: [
      { name: 'Warehouse', lat: 37.7749, lon: -122.4194 },
      { name: 'Customer A', lat: 37.8044, lon: -122.2712 },
      { name: 'Customer B', lat: 37.6879, lon: -122.4702 },
      { name: 'Customer C', lat: 37.7580, lon: -122.4430 },
      { name: 'Customer D', lat: 37.7899, lon: -122.3961 },
    ],
    start_location: 'Warehouse',
    end_location: 'Warehouse',
    timeout: 120,
    generate_report: true,
  });

  console.log('Status:', solution.status);
  console.log('Total distance:', solution.solution?.total_distance, 'km');
  console.log('Optimized route:', solution.solution?.route?.join(' -> '));
  console.log('Report ID:', solution.report_id);
}

/**
 * Example 4: Problem Analysis
 *
 * Analyze a natural language problem description
 */
async function example4_ProblemAnalysis() {
  console.log('\n=== Example 4: Problem Analysis ===\n');

  const description = `
    I run a bakery and need to decide how many loaves of bread and cakes to bake each day.
    Each loaf of bread earns me $2 profit and each cake earns $5 profit.
    I have 100 kg of flour available per day.
    Each loaf needs 0.5 kg flour and each cake needs 1 kg flour.
    I also have 8 hours of baking time, where loaves take 0.2 hours and cakes take 0.5 hours.
    What's the optimal production to maximize my daily profit?
  `;

  const analysis = await client.analyzeProblem(description);

  console.log('Problem type:', analysis.problem_type);
  console.log('Confidence:', analysis.confidence);
  console.log('\nVariables detected:');
  analysis.variables_detected.forEach(v => console.log('  -', v));
  console.log('\nConstraints detected:');
  analysis.constraints_detected.forEach(c => console.log('  -', c));
  console.log('\nRecommendations:');
  analysis.recommendations.forEach(r => console.log('  -', r));
}

/**
 * Example 5: Report Management
 *
 * List and retrieve HTML reports
 */
async function example5_ReportManagement() {
  console.log('\n=== Example 5: Report Management ===\n');

  // List recent reports
  const reports = await client.listReports(10);

  console.log(`Found ${reports.length} recent reports:\n`);
  reports.forEach(report => {
    console.log(`Report: ${report.report_id}`);
    console.log(`  Type: ${report.problem_type}`);
    console.log(`  Status: ${report.status}`);
    console.log(`  Created: ${report.created_at}`);
    console.log('');
  });

  // Retrieve a specific report (if any exist)
  if (reports.length > 0) {
    const htmlReport = await client.getReport(reports[0].report_id);
    console.log(`Retrieved report ${reports[0].report_id}`);
    console.log(`HTML length: ${htmlReport.length} characters`);

    // In a real application, you might save this to a file:
    // import { writeFileSync } from 'fs';
    // writeFileSync('report.html', htmlReport);
  }
}

/**
 * Example 6: Error Handling
 */
async function example6_ErrorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  try {
    // This will fail due to invalid constraint
    await client.solveLp({
      variables: [
        { name: 'x', type: 'continuous', lower_bound: 0 }
      ],
      objective: {
        type: 'maximize',
        expression: 'x'
      },
      constraints: [
        { expression: 'invalid constraint syntax!!!', type: 'inequality' }
      ]
    });
  } catch (error: any) {
    console.log('Caught expected error:');
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Error:', error.response.data);
    } else {
      console.log('  Error:', error.message);
    }
  }

  console.log('\nError handling complete - client properly handles validation errors');
}

// Run all examples
async function runAllExamples() {
  try {
    await example1_ProductionPlanning();
    await example2_FacilityLocation();
    await example3_DeliveryRoute();
    await example4_ProblemAnalysis();
    await example5_ReportManagement();
    await example6_ErrorHandling();

    console.log('\n=== All examples completed successfully! ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
