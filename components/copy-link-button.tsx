"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link, Check } from "lucide-react"

interface CopyLinkButtonProps {
  className?: string
}

export function CopyLinkButton({ className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={`gap-2 border-border hover:bg-secondary hover:border-cyan bg-transparent ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Link className="h-4 w-4" />
          Copy Link
        </>
      )}
    </Button>
  )
}
