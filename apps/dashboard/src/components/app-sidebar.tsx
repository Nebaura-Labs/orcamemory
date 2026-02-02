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
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function DiscordCard() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="mx-2 mb-2 overflow-hidden rounded-lg border border-dashed">
      <div className="relative h-24 overflow-hidden">
        <img
          src="/images/hero-light.png"
          alt="Orca Memory"
          className="hero-image-light absolute inset-0 h-full w-full object-cover"
        />
        <img
          src="/images/hero-dark.png"
          alt="Orca Memory"
          className="hero-image-dark absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="p-3">
        <p className="mb-2 text-xs text-muted-foreground">
          Join our community for support, updates, and feature requests.
        </p>
        <Button asChild className="w-full" size="sm" variant="outline">
          <a href="https://discord.gg/orcamemory" target="_blank" rel="noopener noreferrer">
            <DiscordIcon className="mr-2 size-4" />
            Join Discord
          </a>
        </Button>
      </div>
    </div>
  );
}

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
        <DiscordCard />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
