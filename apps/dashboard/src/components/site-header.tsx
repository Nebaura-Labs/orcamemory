import { PanelLeftIcon } from "lucide-react"
import { useLocation } from "@tanstack/react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

const routeLabels: Record<string, string> = {
  "": "Home",
  memories: "Memories",
  search: "Search",
  graph: "Graph",
  agents: "Agents",
  new: "Create Agent",
  sessions: "Sessions",
  usage: "Token Usage",
  settings: "Settings",
  retention: "Retention",
  team: "Team",
  billing: "Billing",
  "api-keys": "API Keys",
  analytics: "Analytics",
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const location = useLocation()

  const pathSegments = location.pathname.split("/").filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join("/")}`
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    return { path, label }
  })

  const isHome = pathSegments.length === 0

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dashed transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-1 size-8"
          onClick={toggleSidebar}
        >
          <PanelLeftIcon className="size-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {isHome ? (
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return (
                    <span key={crumb.path} className="contents">
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem className={isLast ? "" : "hidden md:block"}>
                        {isLast ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </span>
                  )
                })}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
