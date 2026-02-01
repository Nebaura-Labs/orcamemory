"use client"

import { useEffect, useState } from "react"
import { Blocks, ChevronsUpDown, Plus } from "lucide-react"
import { useQuery } from "convex/react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { api } from "@moltcity/backend/convex/_generated/api"
import type { Id } from "@moltcity/backend/convex/_generated/dataModel"

type Project = {
  _id: Id<"projects">
  name: string
}

interface ProjectSwitcherProps {
  onProjectChange?: (projectId: Id<"projects"> | null) => void
}

export function ProjectSwitcher({ onProjectChange }: ProjectSwitcherProps) {
  const { data: organizations } = authClient.useListOrganizations()
  const organizationId = organizations?.[0]?.id ?? ""

  const projects = useQuery(
    api.projects.listByOrganization,
    organizationId ? { organizationId } : "skip"
  ) as Project[] | undefined

  const [activeProject, setActiveProject] = useState<Project | null>(null)

  useEffect(() => {
    if (projects?.length && !activeProject) {
      setActiveProject(projects[0])
      onProjectChange?.(projects[0]._id)
    }
  }, [projects, activeProject, onProjectChange])

  const handleSwitchProject = (project: Project) => {
    setActiveProject(project)
    onProjectChange?.(project._id)
  }

  if (!projects?.length) {
    return (
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Blocks className="size-4" />
        <span className="hidden sm:inline">No projects</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-dashed">
          <Blocks className="size-4" />
          <span className="max-w-40 truncate">
            {activeProject?.name ?? "Select project"}
          </span>
          <ChevronsUpDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Projects
        </DropdownMenuLabel>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project._id}
            onClick={() => handleSwitchProject(project)}
            className="gap-2"
          >
            <Blocks className="size-4" />
            <span className="truncate">{project.name}</span>
            {activeProject?._id === project._id && (
              <span className="text-primary ml-auto text-xs">Active</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <Plus className="size-4" />
          <span>Create project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
