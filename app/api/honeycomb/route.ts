import { type NextRequest, NextResponse } from "next/server"
import {
  generateDeploymentQueries,
  generateComponentQueries,
  getHoneycombConfigFromEnv,
  isHoneycombConfigured,
  isHoneycombEU,
} from "@/lib/honeycomb"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const deploymentDate = searchParams.get("deploymentDate")
  const componentName = searchParams.get("componentName")
  const windowHours = searchParams.get("windowHours")

  if (!deploymentDate) {
    return NextResponse.json(
      { error: "Missing required parameter: deploymentDate" },
      { status: 400 }
    )
  }

  // Check if Honeycomb is configured
  if (!isHoneycombConfigured()) {
    return NextResponse.json(
      {
        error: "Honeycomb is not configured",
        configured: false,
        queries: [],
      },
      { status: 200 }
    )
  }

  const config = getHoneycombConfigFromEnv()

  if (!config) {
    return NextResponse.json(
      {
        error: "Honeycomb team and dataset must be configured via HONEYCOMB_TEAM and HONEYCOMB_DATASET",
        configured: false,
        queries: [],
      },
      { status: 200 }
    )
  }

  const isEU = isHoneycombEU()
  const hours = windowHours ? parseInt(windowHours, 10) : 1

  let queries
  if (componentName) {
    queries = generateComponentQueries(config, componentName, deploymentDate, {
      windowHours: hours,
      isEU,
    })
  } else {
    queries = generateDeploymentQueries(config, deploymentDate, {
      windowHours: hours,
      isEU,
    })
  }

  return NextResponse.json({
    configured: true,
    queries,
    config: {
      team: config.team,
      dataset: config.dataset,
      environment: config.environment,
      isEU,
    },
  })
}
