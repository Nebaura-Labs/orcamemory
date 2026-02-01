import { Bot, Brain, History, Zap } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StatsCardsProps {
  totalMemories: number
  totalAgents: number
  sessionCount: number
  tokenUsage: number
  tokenLimit: number
}

export function StatsCards({
  totalMemories,
  totalAgents,
  sessionCount,
  tokenUsage,
  tokenLimit,
}: StatsCardsProps) {
  const tokenPercentage = Math.min((tokenUsage / tokenLimit) * 100, 100)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
          <Brain className="size-4 dark-icon" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMemories.toLocaleString()}</div>
          <p className="text-muted-foreground text-xs">
            Stored in your workspace
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agents</CardTitle>
          <Bot className="size-4 dark-icon" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAgents}</div>
          <p className="text-muted-foreground text-xs">
            Active agents connected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Agent Sessions</CardTitle>
          <History className="size-4 dark-icon" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sessionCount}</div>
          <p className="text-muted-foreground text-xs">
            Across all agents
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
          <Zap className="size-4 dark-icon" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {tokenUsage.toLocaleString()}
          </div>
          <Progress value={tokenPercentage} className="mt-2" />
          <p className="text-muted-foreground mt-1 text-xs">
            {tokenPercentage.toFixed(0)}% of {tokenLimit.toLocaleString()} limit
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
