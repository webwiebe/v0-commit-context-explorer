import { NextResponse } from "next/server"
import { getJiraStatus, resetJiraConnection } from "@/lib/jira"

export async function GET() {
  return NextResponse.json(getJiraStatus())
}

export async function POST() {
  resetJiraConnection()
  return NextResponse.json(getJiraStatus())
}
