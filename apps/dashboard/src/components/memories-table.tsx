import { useQuery, useMutation } from "convex/react"
import { Search, MoreHorizontal, Eye, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface MemoriesTableProps {
  projectId: Id<"projects">
}

interface Memory {
  _id: Id<"memories">
  content: string
  tags: string[]
  memoryType: string | null
  metadata: Record<string, unknown> | null
  agentId: Id<"agents">
  agentName: string
  createdAt: number
}

export function MemoriesTable({ projectId }: MemoriesTableProps) {
  const [search, setSearch] = useState("")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const agents = useQuery(api.dashboard.getAgentsForProject, { projectId }) as
    | { _id: Id<"agents">; name: string }[]
    | undefined

  const memoryTypes = useQuery(api.dashboard.getMemoryTypes, { projectId }) as string[] | undefined

  const memoriesResult = useQuery(api.dashboard.searchMemories, {
    projectId,
    search: search || undefined,
    agentId: agentFilter !== "all" ? (agentFilter as Id<"agents">) : undefined,
    memoryType: typeFilter !== "all" ? typeFilter : undefined,
    cursor,
    limit: 25,
  }) as { memories: Memory[]; nextCursor: string | null; total: number } | undefined

  const deleteMemory = useMutation(api.memories.deleteMemory)

  const handleDelete = async (memoryId: Id<"memories">) => {
    await deleteMemory({ memoryId })
  }

  const handlePrevPage = () => {
    setCursor(undefined)
  }

  const handleNextPage = () => {
    if (memoriesResult?.nextCursor) {
      setCursor(memoriesResult.nextCursor)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">All Memories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Search memories..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCursor(undefined)
              }}
            />
          </div>

          <Select
            value={agentFilter}
            onValueChange={(v) => {
              setAgentFilter(v ?? "all")
              setCursor(undefined)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents?.map((agent) => (
                <SelectItem key={agent._id} value={agent._id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {memoryTypes && memoryTypes.length > 0 && (
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v ?? "all")
                setCursor(undefined)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {memoryTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        {memoriesResult === undefined ? (
          <div className="bg-muted/50 h-64 animate-pulse rounded-none" />
        ) : memoriesResult.memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No memories found</p>
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
                {memoriesResult.memories.map((memory) => (
                  <TableRow key={memory._id}>
                    <TableCell className="max-w-[300px] truncate">
                      {memory.content.slice(0, 100)}
                      {memory.content.length > 100 && "..."}
                    </TableCell>
                    <TableCell>{memory.agentName}</TableCell>
                    <TableCell>
                      {memory.memoryType && (
                        <Badge variant="secondary">{memory.memoryType}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {memory.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {memory.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{memory.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/memories/${memory._id}`}>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(memory._id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {memoriesResult.memories.length} of {memoriesResult.total} memories
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!cursor}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!memoriesResult.nextCursor}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
