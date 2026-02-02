"use client"

import { formatDistanceToNow } from "date-fns"
import { Bot, Circle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Agent = {
  _id: string
  name: string
  connected: boolean
  memoryCount: number
  lastActive: number | null
}

interface AgentStatusProps {
  agents: Agent[]
}

export function AgentStatus({ agents }: AgentStatusProps) {
  if (agents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 dark-icon" />
            Agents
          </CardTitle>
          <CardDescription>Your connected agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No agents connected yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 dark-icon" />
            Agents
          </CardTitle>
          <CardDescription>Your connected agents</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="border-dashed" asChild>
          <a href="/agents">View all</a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {agents.map((agent) => (
            <div
              key={agent._id}
              className="flex items-center gap-3 rounded-md border border-dashed p-3"
            >
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Bot className="size-4" />
                <Circle
                  className={cn(
                    "absolute -right-0.5 -top-0.5 size-2.5 fill-current",
                    agent.connected ? "text-green-500" : "text-muted-foreground"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.memoryCount} memories
                  {agent.lastActive && (
                    <span>
                      {" • "}
                      {formatDistanceToNow(agent.lastActive, { addSuffix: true })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
