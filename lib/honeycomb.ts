import type {
  HoneycombQueryUrl,
  HoneycombQueryType,
  HoneycombConfig,
  HoneycombFilter,
  HoneycombCalculation,
} from "./types"

// Default Honeycomb UI base URLs
const HONEYCOMB_UI_US = "https://ui.honeycomb.io"
const HONEYCOMB_UI_EU = "https://ui.eu1.honeycomb.io"

// Query templates for different observability concerns
const QUERY_TEMPLATES: Record<
  HoneycombQueryType,
  {
    label: string
    description: string
    calculations: HoneycombCalculation[]
    breakdowns?: string[]
    filters?: HoneycombFilter[]
  }
> = {
  errors: {
    label: "View Errors",
    description: "Error rate and failed requests post-deployment",
    calculations: [
      { op: "COUNT" },
      { op: "COUNT" }, // Will be filtered for errors
    ],
    breakdowns: ["error", "http.status_code", "service.name"],
    filters: [
      { column: "error", op: "=", value: true },
    ],
  },
  latency: {
    label: "View Latency",
    description: "P50/P95 latency breakdown",
    calculations: [
      { op: "HEATMAP", column: "duration_ms" },
      { op: "P50", column: "duration_ms" },
      { op: "P95", column: "duration_ms" },
      { op: "P99", column: "duration_ms" },
    ],
    breakdowns: ["name", "service.name"],
  },
  throughput: {
    label: "View Throughput",
    description: "Request volume and rate",
    calculations: [
      { op: "COUNT" },
      { op: "AVG", column: "duration_ms" },
    ],
    breakdowns: ["name", "http.method", "service.name"],
  },
  traces: {
    label: "View Traces",
    description: "Sample traces for investigation",
    calculations: [{ op: "COUNT" }],
    breakdowns: ["trace.trace_id", "name"],
  },
}

interface QuerySpec {
  time_range?: number // seconds
  start_time?: number // unix timestamp
  end_time?: number // unix timestamp
  granularity?: number
  breakdowns?: string[]
  calculations?: Array<{ op: string; column?: string }>
  filters?: Array<{ column: string; op: string; value: string | number | boolean }>
  filter_combination?: "AND" | "OR"
  orders?: Array<{ column?: string; op?: string; order: "ascending" | "descending" }>
  limit?: number
}

/**
 * Builds a Honeycomb query URL with the specified parameters
 */
export function buildHoneycombQueryUrl(
  config: HoneycombConfig,
  querySpec: QuerySpec,
  isEU = false
): string {
  const baseUrl = isEU ? HONEYCOMB_UI_EU : HONEYCOMB_UI_US
  const encodedQuery = encodeURIComponent(JSON.stringify(querySpec))

  // Build the URL path based on whether we have an environment
  let path: string
  if (config.environment) {
    path = `${config.team}/environments/${config.environment}/datasets/${config.dataset}`
  } else {
    path = `${config.team}/datasets/${config.dataset}`
  }

  return `${baseUrl}/${path}?query=${encodedQuery}`
}

/**
 * Generates Honeycomb query URLs for a deployment time window
 */
export function generateDeploymentQueries(
  config: HoneycombConfig,
  deploymentDate: string,
  options: {
    windowHours?: number
    isEU?: boolean
    serviceFilter?: string
  } = {}
): HoneycombQueryUrl[] {
  const { windowHours = 1, isEU = false, serviceFilter } = options

  // Calculate time window: deployment time to N hours after
  const deploymentTime = new Date(deploymentDate)
  const startTime = Math.floor(deploymentTime.getTime() / 1000)
  const endTime = Math.floor(startTime + windowHours * 60 * 60)

  const queries: HoneycombQueryUrl[] = []

  for (const [type, template] of Object.entries(QUERY_TEMPLATES)) {
    const queryType = type as HoneycombQueryType

    // Build the query spec
    const querySpec: QuerySpec = {
      start_time: startTime,
      end_time: endTime,
      granularity: 60, // 1 minute buckets
      calculations: template.calculations.map((calc) => ({
        op: calc.op,
        ...(calc.column && { column: calc.column }),
      })),
      breakdowns: template.breakdowns,
      filter_combination: "AND",
      filters: [],
      limit: 1000,
    }

    // Add template-specific filters
    if (template.filters) {
      querySpec.filters = template.filters.map((f) => ({
        column: f.column,
        op: f.op,
        value: f.value,
      }))
    }

    // Add service filter if specified
    if (serviceFilter) {
      querySpec.filters = querySpec.filters || []
      querySpec.filters.push({
        column: "service.name",
        op: "=",
        value: serviceFilter,
      })
    }

    // Add ordering for traces to get recent ones
    if (queryType === "traces") {
      querySpec.orders = [{ order: "descending" }]
      querySpec.limit = 100
    }

    const url = buildHoneycombQueryUrl(config, querySpec, isEU)

    queries.push({
      type: queryType,
      label: template.label,
      description: template.description,
      url,
    })
  }

  return queries
}

/**
 * Generates a direct trace link for a specific trace ID
 */
export function buildTraceUrl(
  config: HoneycombConfig,
  traceId: string,
  isEU = false
): string {
  const baseUrl = isEU ? HONEYCOMB_UI_EU : HONEYCOMB_UI_US

  let path: string
  if (config.environment) {
    path = `${config.team}/environments/${config.environment}/datasets/${config.dataset}/trace`
  } else {
    path = `${config.team}/datasets/${config.dataset}/trace`
  }

  return `${baseUrl}/${path}?trace_id=${encodeURIComponent(traceId)}`
}

/**
 * Gets the default Honeycomb configuration from environment variables
 * This should be called server-side only
 */
export function getHoneycombConfigFromEnv(): HoneycombConfig | null {
  const team = process.env.HONEYCOMB_TEAM
  const dataset = process.env.HONEYCOMB_DATASET

  if (!team || !dataset) {
    return null
  }

  return {
    team,
    dataset,
    environment: process.env.HONEYCOMB_ENVIRONMENT,
    apiEndpoint: process.env.HONEYCOMB_API_ENDPOINT,
  }
}

/**
 * Checks if Honeycomb is configured (has API key)
 */
export function isHoneycombConfigured(): boolean {
  return Boolean(process.env.HONEYCOMB_API_KEY)
}

/**
 * Determines if the Honeycomb instance is EU based on API endpoint
 */
export function isHoneycombEU(): boolean {
  const endpoint = process.env.HONEYCOMB_API_ENDPOINT
  return endpoint?.includes("eu1") ?? false
}

/**
 * Maps a component name to a potential service name in Honeycomb
 * This is a heuristic mapping that may need customization per project
 */
export function mapComponentToService(componentName: string): string {
  // Common patterns:
  // - checkout-widget -> checkout-widget
  // - fx-search -> fx-search
  // - header-component -> header-component
  return componentName.toLowerCase().replace(/_/g, "-")
}

/**
 * Generates queries scoped to a specific deployed component
 */
export function generateComponentQueries(
  config: HoneycombConfig,
  componentName: string,
  deploymentDate: string,
  options: {
    windowHours?: number
    isEU?: boolean
  } = {}
): HoneycombQueryUrl[] {
  const serviceName = mapComponentToService(componentName)

  return generateDeploymentQueries(config, deploymentDate, {
    ...options,
    serviceFilter: serviceName,
  })
}
