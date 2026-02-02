import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { useEffect, useState } from "react"

import { MemoriesTable } from "@/components/memories-table"
import { authClient } from "@/lib/auth-client"
import { api } from "@moltcity/backend/convex/_generated/api"
import type { Id } from "@moltcity/backend/convex/_generated/dataModel"

export const Route = createFileRoute("/memories/")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" })
    }
  },
  component: MemoriesPage,
})

function MemoriesPage() {
  const navigate = useNavigate()
  const { data: organizations, isPending } = authClient.useListOrganizations()
  const organizationId = organizations?.[0]?.id ?? ""

  const projects = useQuery(
    api.projects.listByOrganization,
    organizationId ? { organizationId } : "skip"
  ) as { _id: Id<"projects">; name: string }[] | undefined

  const [activeProjectId, setActiveProjectId] = useState<Id<"projects"> | null>(null)

  useEffect(() => {
    if (isPending) return
    if (organizations != null && organizations.length === 0) {
      void navigate({ to: "/onboarding" })
    }
  }, [isPending, navigate, organizations])

  useEffect(() => {
    if (projects?.length && !activeProjectId) {
      const stored = localStorage.getItem("activeProjectId") as Id<"projects"> | null
      const found = stored ? projects.find((p) => p._id === stored) : null
      setActiveProjectId(found?._id ?? projects[0]._id)
    }
  }, [projects, activeProjectId])

  const isLoading = isPending || projects === undefined || !activeProjectId

  return (
    <main className="flex-1 p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Memories</h1>
          <p className="text-muted-foreground text-sm">
            View and manage all memories stored by your agents
          </p>
        </div>

        {isLoading ? (
          <div className="bg-card ring-foreground/10 h-96 animate-pulse rounded-none ring-1" />
        ) : (
          <MemoriesTable projectId={activeProjectId} />
        )}
      </div>
    </main>
  )
}
