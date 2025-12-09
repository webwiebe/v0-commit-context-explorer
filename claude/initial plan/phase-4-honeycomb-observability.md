# Phase 4: Honeycomb Observability

**Goal**: Add latency metrics, SLO status, and trace links from Honeycomb

**Prerequisite**: Phase 3 complete

## v0 Prompt (Additive)

Extend the dashboard with **deep observability** from Honeycomb - latency metrics, SLO health, and trace debugging.

### Integration: Honeycomb MCP

Primary datasets:
- `apollo-gateway` (fx-production)
- `ecommerce-bff` (fx-production)

Connect to Honeycomb to show:
- Latency percentiles (P50, P95, P99) before/after deployment
- SLO status and budget remaining
- Trace links for slow requests or errors
- Throughput changes

### Honeycomb MCP Tools

```typescript
// From Honeycomb MCP documentation:
// - run_query - Analytics queries with filters, aggregations
// - list_slos / get_slo - SLO status and metrics
// - list_datasets / get_columns - Dataset discovery
// - analyze_columns - Statistical analysis
// - get_trace_link - Generate trace URLs
// - list_triggers / get_trigger - Alert configs
```

### Extended Data Model

```typescript
interface PerformanceHealth {
  datasets: DatasetMetrics[]
  slos: SLOStatus[]
  overallStatus: 'healthy' | 'degraded' | 'critical'
}

interface DatasetMetrics {
  name: string                    // "apollo-gateway" | "ecommerce-bff"
  environment: string             // "fx-production"
  before: LatencyMetrics          // 1hr before deploy
  after: LatencyMetrics           // 1hr after deploy
  delta: LatencyDelta
}

interface LatencyMetrics {
  p50: number                     // milliseconds
  p95: number
  p99: number
  errorRate: number               // percentage
  throughput: number              // requests/minute
}

interface LatencyDelta {
  p50Change: number               // percentage
  p95Change: number
  p99Change: number
  errorRateChange: number
  status: 'improved' | 'stable' | 'degraded'
}

interface SLOStatus {
  id: string
  name: string
  dataset: string
  target: number                  // e.g., 99.9
  current: number                 // e.g., 99.7
  budgetRemaining: number         // percentage of error budget left
  budgetConsumed24h: number       // how much burned in last 24h
  status: 'met' | 'at_risk' | 'breached'
  url: string                     // Link to Honeycomb SLO page
}
```

### UI Additions

**On DeploymentCard (timeline)**:
- Latency indicator (up/down/stable arrow) next to health dot
- SLO breach warning icon if applicable

**On Deployment Detail - new "Performance" section**:
- Dataset tabs (apollo-gateway / ecommerce-bff)
- Per-dataset metrics:
  - Latency comparison chart (before/after bars for P50/P95/P99)
  - Delta percentages with color coding
  - Throughput comparison
  - Error rate comparison
- "View traces" button → generates Honeycomb trace link

**On Deployment Detail - new "SLO Status" section**:
- SLO cards showing:
  - SLO name
  - Current vs target (visual gauge)
  - Budget remaining (progress bar)
  - Status badge
  - Link to Honeycomb

**Dashboard additions**:
- SLO overview widget showing all SLOs at a glance
- "SLO at risk" alerts

### New Components

1. `LatencyComparisonChart` - Before/after bar chart for percentiles
2. `DeltaIndicator` - Arrow + percentage showing change direction
3. `SLOCard` - Gauge showing current vs target
4. `BudgetBar` - Error budget remaining visualization
5. `DatasetTabs` - Tab navigation between datasets
6. `TraceButton` - Link to Honeycomb traces

### MCP Stub Addition

Create `/lib/mcp/honeycomb.ts`:

```typescript
// Honeycomb MCP client stub
// Actual MCP tools:
// - run_query
// - list_slos / get_slo
// - list_datasets / get_columns
// - get_trace_link
// - list_triggers

export interface HoneycombMCPClient {
  runQuery(dataset: string, query: HoneycombQuery): Promise<QueryResult>
  listSLOs(dataset: string): Promise<SLOSummary[]>
  getSLO(dataset: string, sloId: string): Promise<SLOStatus>
  getTraceLink(dataset: string, traceId: string): Promise<string>
  listDatasets(environment: string): Promise<Dataset[]>
}

interface HoneycombQuery {
  calculations: Calculation[]
  filters?: Filter[]
  breakdowns?: string[]
  time_range: number  // seconds
  granularity?: number
}
```

### API Routes (new)

```
GET /api/deployments/[id]/performance  - Latency metrics
GET /api/slos                          - All SLOs
GET /api/slos/[id]                     - Single SLO detail
GET /api/traces                        - Generate trace link
```

### Health Status Logic (combined)

```typescript
function calculateOverallHealth(
  sentry: SentryHealth,
  honeycomb: PerformanceHealth
): 'healthy' | 'degraded' | 'critical' {
  // Critical if:
  // - Any SLO breached
  // - Error rate up > 50%
  // - P95 latency up > 100%
  // - 3+ new Sentry issues

  // Degraded if:
  // - Any SLO at_risk
  // - Error rate up 10-50%
  // - P95 latency up 20-100%
  // - 1-2 new Sentry issues

  // Healthy otherwise
}
```

### Success Criteria

- [ ] Can see latency impact of every deployment
- [ ] Can see SLO status at a glance
- [ ] Can jump to Honeycomb traces for debugging
- [ ] Combined health score from Sentry + Honeycomb
- [ ] Dashboard surfaces performance regressions
