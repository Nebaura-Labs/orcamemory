"use client"

import { formatDistanceToNow } from "date-fns"
import { Brain, MessageSquare, Lightbulb, Heart, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Memory = {
  _id: string
  content: string
  type: string
  agentName: string
  createdAt: number
}

const typeIcons: Record<string, React.ElementType> = {
  conversation: MessageSquare,
  decision: Lightbulb,
  preference: Heart,
  fact: FileText,
}

const typeColors: Record<string, string> = {
  conversation: "bg-blue-500/10 text-blue-500",
  decision: "bg-amber-500/10 text-amber-500",
  preference: "bg-pink-500/10 text-pink-500",
  fact: "bg-green-500/10 text-green-500",
}

interface RecentMemoriesProps {
  memories: Memory[]
}

export function RecentMemories({ memories }: RecentMemoriesProps) {
  if (memories.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4 dark-icon" />
            Recent Memories
          </CardTitle>
          <CardDescription>Latest memories from your agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No memories stored yet
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
            <Brain className="size-4 dark-icon" />
            Recent Memories
          </CardTitle>
          <CardDescription>Latest memories from your agents</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="border-dashed" asChild>
          <a href="/memories">View all</a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {memories.map((memory) => {
            const Icon = typeIcons[memory.type] ?? FileText
            const colorClass = typeColors[memory.type] ?? "bg-muted text-muted-foreground"

            return (
              <div
                key={memory._id}
                className="flex items-start gap-3 rounded-md border border-dashed p-3"
              >
                <div className={`rounded-md p-1.5 ${colorClass}`}>
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{memory.content}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{memory.agentName}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(memory.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 border-dashed text-xs">
                  {memory.type}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
