"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { IntegrationConfig, ConnectionTestResult } from "@/lib/types"
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react"

interface IntegrationCardProps {
  integration: IntegrationConfig
  icon: React.ReactNode
  docsUrl?: string
  envVars: string[]
}

const statusConfig = {
  connected: {
    icon: CheckCircle2,
    label: "Connected",
    className: "text-success bg-success/10 border-success/30",
  },
  not_configured: {
    icon: AlertCircle,
    label: "Not Configured",
    className: "text-muted-foreground bg-muted border-muted-foreground/30",
  },
  error: {
    icon: XCircle,
    label: "Error",
    className: "text-error bg-error/10 border-error/30",
  },
}

export function IntegrationCard({ integration, icon, docsUrl, envVars }: IntegrationCardProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)

  const config = statusConfig[integration.status]
  const StatusIcon = config.icon

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration: integration.id }),
      })

      const result: ConnectionTestResult = await response.json()
      setTestResult(result)
    } catch {
      setTestResult({
        success: false,
        message: "Failed to test connection",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-secondary border border-border text-muted-foreground">{icon}</div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">{integration.name}</h3>
            <p className="text-sm text-muted-foreground">{integration.description}</p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border shrink-0",
            config.className,
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {config.label}
        </span>
      </div>

      {/* Configuration details */}
      <div className="mt-4 pt-4 border-t border-border">
        {integration.status === "connected" && integration.details && (
          <p className="text-sm text-muted-foreground mb-3">{integration.details}</p>
        )}

        {integration.status === "not_configured" && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Configure via environment variables:</p>
            <div className="flex flex-wrap gap-2">
              {envVars.map((envVar) => (
                <code
                  key={envVar}
                  className="px-2 py-1 text-xs font-mono bg-secondary rounded border border-border text-cyan"
                >
                  {envVar}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Test result display */}
        {testResult && (
          <div
            className={cn(
              "mb-4 p-3 rounded-md text-sm",
              testResult.success
                ? "bg-success/10 border border-success/30 text-success"
                : "bg-error/10 border border-error/30 text-error",
            )}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing || integration.status === "not_configured"}
            className="border-border hover:bg-secondary hover:border-cyan bg-transparent"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>

          {docsUrl && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Docs
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
