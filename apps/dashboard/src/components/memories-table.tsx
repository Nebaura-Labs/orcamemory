"use client"

import { useState, useCallback } from "react"
import { formatDistanceToNow } from "date-fns"
import { useQuery, useMutation } from "convex/react"
import {
  Brain,
  Search,
  Filter,
  Trash2,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Lightbulb,
  Heart,
  FileText,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@moltcity/backend/convex/_generated/api"
import type { Id } from "@moltcity/backend/convex/_generated/dataModel"

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

type Memory = {
  _id: Id<"memories">
  content: string
  tags: string[]
  memoryType: string | null
  metadata: unknown
  agentId: Id<"agents">
  agentName: string
  createdAt: number
}

interface MemoriesTableProps {
  projectId: Id<"projects">
}

export function MemoriesTable({ projectId }: MemoriesTableProps) {
  const [search, setSearch] = useState("")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

  const agents = useQuery(api.memories.getAgentsForProject, { projectId })
  const memoryTypes = useQuery(api.memories.getMemoryTypes, { projectId })

  const memoriesResult = useQuery(api.memories.list, {
    projectId,
    limit: 25,
    cursor,
    agentId: agentFilter !== "all" ? (agentFilter as Id<"agents">) : undefined,
    memoryType: typeFilter !== "all" ? typeFilter : undefined,
    search: search || undefined,
  })

  const deleteMemory = useMutation(api.memories.deleteMemory)

  const handleDelete = useCallback(
    async (memoryId: Id<"memories">) => {
      if (confirm("Are you sure you want to delete this memory?")) {
        await deleteMemory({ memoryId })
      }
    },
    [deleteMemory]
  )

  const handleNextPage = () => {
    if (memoriesResult?.nextCursor) {
      setCursor(memoriesResult.nextCursor)
    }
  }

  const handlePrevPage = () => {
    setCursor(undefined)
  }

  const clearFilters = () => {
    setSearch("")
    setAgentFilter("all")
    setTypeFilter("all")
    setCursor(undefined)
  }

  const hasFilters = search || agentFilter !== "all" || typeFilter !== "all"

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="size-4 dark-icon" />
                All Memories
              </CardTitle>
              <CardDescription>
                {memoriesResult?.total ?? 0} memories in this project
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCursor(undefined)
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={agentFilter}
              onValueChange={(value) => {
                setAgentFilter(value ?? "all")
                setCursor(undefined)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents?.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value ?? "all")
                setCursor(undefined)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {memoryTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 size-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Table */}
          {memoriesResult === undefined ? (
            <div className="flex h-64 items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : memoriesResult.memories.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Brain className="size-10 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {hasFilters ? "No memories match your filters" : "No memories stored yet"}
              </p>
              {hasFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Content</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memoriesResult.memories.map((memory) => {
                    const Icon = typeIcons[memory.memoryType ?? ""] ?? FileText
                    const colorClass =
                      typeColors[memory.memoryType ?? ""] ?? "bg-muted text-muted-foreground"

                    return (
                      <TableRow key={memory._id}>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate">{memory.content}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{memory.agentName}</span>
                        </TableCell>
                        <TableCell>
                          {memory.memoryType && (
                            <Badge variant="outline" className={`gap-1 border-dashed ${colorClass}`}>
                              <Icon className="size-3" />
                              {memory.memoryType}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {memory.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {memory.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{memory.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(memory.createdAt, { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedMemory(memory)}>
                                <Eye className="mr-2 size-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(memory._id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {memoriesResult.memories.length} of {memoriesResult.total} memories
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={!cursor}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!memoriesResult.nextCursor}
                  >
                    Next
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Memory Detail Dialog */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="size-4 dark-icon" />
              Memory Details
            </DialogTitle>
            <DialogDescription>
              Created {selectedMemory && formatDistanceToNow(selectedMemory.createdAt, { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          {selectedMemory && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Content</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md border border-dashed p-3">
                  {selectedMemory.content}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Agent</h4>
                  <p className="text-sm text-muted-foreground">{selectedMemory.agentName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Type</h4>
                  <p className="text-sm text-muted-foreground">{selectedMemory.memoryType ?? "—"}</p>
                </div>
              </div>
              {selectedMemory.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedMemory.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedMemory.metadata !== null && selectedMemory.metadata !== undefined && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Metadata</h4>
                  <pre className="text-xs text-muted-foreground overflow-auto rounded-md border border-dashed p-3 max-h-40">
                    {JSON.stringify(selectedMemory.metadata as Record<string, unknown>, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
