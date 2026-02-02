"use client"

import { useEffect, useState } from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import Logo from "@/components/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

type Organization = {
  id: string
  name: string
  slug: string
  logo?: string | null
}

export function TeamSwitcher() {
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [workspaces, setWorkspaces] = useState<Organization[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<Organization | null>(null)

  const { data: session } = authClient.useSession()

  useEffect(() => {
    const fetchOrgs = async () => {
      const result = await authClient.organization.list()
      if (result.data) {
        setWorkspaces(result.data)
      }
    }
    fetchOrgs()
  }, [])

  useEffect(() => {
    const fetchActive = async () => {
      const result = await authClient.organization.getFullOrganization()
      if (result.data) {
        setActiveWorkspace(result.data)
      } else if (workspaces.length > 0) {
        setActiveWorkspace(workspaces[0])
      }
    }
    if (session) {
      fetchActive()
    }
  }, [session, workspaces])

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await authClient.organization.setActive({ organizationId: workspaceId })
    const selected = workspaces.find((w) => w.id === workspaceId)
    if (selected) {
      setActiveWorkspace(selected)
    }
  }

  if (!activeWorkspace) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className={`opacity-50 ${isCollapsed ? "!justify-center" : ""}`}>
            <div className="flex aspect-square items-center justify-center rounded-lg">
              <Logo className={isCollapsed ? "size-5" : "size-8"} />
            </div>
            {!isCollapsed && (
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">No workspace</span>
                <span className="truncate text-xs">Create one to get started</span>
              </div>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${isCollapsed ? "!justify-center" : ""}`}
            >
              <div className="flex aspect-square items-center justify-center rounded-lg">
                <Logo className={isCollapsed ? "size-5" : "size-8"} />
              </div>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{activeWorkspace.name}</span>
                    <span className="truncate text-xs">Free</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((workspace, index) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSwitchWorkspace(workspace.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md">
                  <Logo className="size-6" />
                </div>
                {workspace.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" disabled>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add workspace</div>
              <span className="ml-auto text-muted-foreground text-xs">Soon</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
