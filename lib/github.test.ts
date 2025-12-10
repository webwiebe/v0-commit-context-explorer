import { describe, it, expect } from "vitest"
import { extractTickets, parseMachConfigVersionChanges } from "./github"

describe("extractTickets", () => {
  it("extracts PX ticket references from text", () => {
    const text = "Fix issue PX-456 and PX-789"
    const tickets = extractTickets(text)
    expect(tickets).toEqual(["PX-456", "PX-789"])
  })

  it("returns empty array when no tickets found", () => {
    const text = "No tickets in this message"
    const tickets = extractTickets(text)
    expect(tickets).toEqual([])
  })

  it("deduplicates ticket references", () => {
    const text = "PX-456 mentioned twice: PX-456"
    const tickets = extractTickets(text)
    expect(tickets).toEqual(["PX-456"])
  })

  it("handles case-insensitive matching and normalizes to uppercase", () => {
    const text = "px-456 and Px-789"
    const tickets = extractTickets(text)
    expect(tickets).toEqual(["PX-456", "PX-789"])
  })

  it("filters out placeholder tickets PX-0 and PX-123", () => {
    const text = "PX-0 PX-123 PX-456 PX-789"
    const tickets = extractTickets(text)
    expect(tickets).toEqual(["PX-456", "PX-789"])
  })
})

describe("parseMachConfigVersionChanges", () => {
  it("parses version changes from mach-config diff", () => {
    const patch = `@@ -1,5 +1,5 @@
 components:
   - name: checkout-service
-    version: '@fx-component/checkout-service-abc1234'
+    version: '@fx-component/checkout-service-def5678'`

    const changes = parseMachConfigVersionChanges(patch, "mach-config/prd-prem-versions.yaml")

    expect(changes).toHaveLength(1)
    expect(changes[0]).toEqual({
      componentName: "checkout-service",
      componentPath: "components/checkout-service",
      fromVersion: "abc1234",
      toVersion: "def5678",
      environment: "prd-prem",
    })
  })

  it("extracts environment from filename", () => {
    const patch = `@@ -1,5 +1,5 @@
-    version: '@fx-component/cart-service-1111111'
+    version: '@fx-component/cart-service-2222222'`

    const changes = parseMachConfigVersionChanges(patch, "mach-config/acc-test-versions.yaml")

    expect(changes[0]?.environment).toBe("acc-test")
  })

  it("returns empty array when no version changes found", () => {
    const patch = `@@ -1,3 +1,3 @@
 # Just a comment change
-# Old comment
+# New comment`

    const changes = parseMachConfigVersionChanges(patch, "mach-config/prd-versions.yaml")

    expect(changes).toEqual([])
  })
})
