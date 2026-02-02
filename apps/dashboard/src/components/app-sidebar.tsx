"use client"

import type { ComponentProps } from "react"
import {
  Bot,
  Brain,
  History,
  LayoutDashboard,
  Settings2,
  BookOpen,
  Gauge,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Memories",
      url: "/memories",
      icon: Brain,
      items: [
        {
          title: "All Memories",
          url: "/memories",
        },
        {
          title: "Search",
          url: "/memories/search",
        },
        {
          title: "Graph",
          url: "/analytics",
        },
      ],
    },
    {
      title: "Agents",
      url: "/agents",
      icon: Bot,
      items: [
        {
          title: "All Agents",
          url: "/agents",
        },
        {
          title: "Create Agent",
          url: "/agents/new",
        },
      ],
    },
    {
      title: "Sessions",
      url: "/sessions",
      icon: History,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings",
        },
        {
          title: "Retention",
          url: "/settings/retention",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
      ],
    },
  ],
  quickLinks: [
    {
      name: "Usage",
      url: "/usage",
      icon: Gauge,
    },
    {
      name: "Documentation",
      url: "https://docs.orcamemory.com",
      icon: BookOpen,
    },
  ],
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 shrink-0 justify-center border-b border-dashed p-2 transition-[height] ease-linear group-data-[collapsible=icon]:h-12">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.quickLinks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
