import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation } from "convex/react"
import { format, formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Calendar,
  Clock,
  Cpu,
  FileText,
  Heart,
  Lightbulb,
  MessageSquare,
  Tag,
  Trash2,
  User,
  Zap,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@moltcity/backend/convex/_generated/api"
import type { Id } from "@moltcity/backend/convex/_generated/dataModel"

export const Route = createFileRoute("/memories/$memoryId")({
  component: MemoryDetailPage,
})

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

function MemoryDetailPage() {
  const { memoryId } = Route.useParams()
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const memory = useQuery(api.memories.getById, {
    memoryId: memoryId as Id<"memories">,
  })

  const deleteMemory = useMutation(api.memories.deleteMemory)

  const handleDelete = async () => {
    if (!memory) return
    setIsDeleting(true)
    try {
      await deleteMemory({ memoryId: memory._id })
      toast.success("Memory deleted successfully")
      navigate({ to: "/memories" })
    } catch {
      toast.error("Failed to delete memory")
      setIsDeleting(false)
    }
  }

  if (memory === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (memory === null) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-center">
            <Brain className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Memory not found</p>
            <Link to="/memories">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 size-4" />
                Back to memories
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const Icon = typeIcons[memory.memoryType ?? ""] ?? FileText
  const colorClass = typeColors[memory.memoryType ?? ""] ?? "bg-muted text-muted-foreground"

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/memories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back to memories
          </Button>
        </Link>
        <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 size-4" />
          Delete memory
        </Button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="size-5 dark-icon" />
                Memory Details
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDistanceToNow(memory.createdAt, { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {format(memory.createdAt, "PPpp")}
                </span>
              </CardDescription>
            </div>
            {memory.memoryType && (
              <Badge variant="outline" className={`gap-1 border-dashed ${colorClass}`}>
                <Icon className="size-3" />
                {memory.memoryType}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Section */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <FileText className="size-4 dark-icon" />
              Content
            </h3>
            <div className="rounded-md border border-dashed p-4 bg-muted/30">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{memory.content}</p>
            </div>
          </div>

          {/* Agent Section */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <User className="size-4 dark-icon" />
              Agent
            </h3>
            <div className="rounded-md border border-dashed p-4 bg-muted/30">
              <p className="text-sm">{memory.agentName}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {memory.agentId}</p>
            </div>
          </div>

          {/* Tags Section */}
          {memory.tags && memory.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Tag className="size-4 dark-icon" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="border border-dashed">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Section */}
          {memory.metadata !== null && memory.metadata !== undefined && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="size-4 dark-icon" />
                Metadata
              </h3>
              <div className="rounded-md border border-dashed p-4 bg-muted/30 overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(memory.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Raw Data Section */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <FileText className="size-4 dark-icon" />
              Raw Data
            </h3>
            <div className="rounded-md border border-dashed p-4 bg-muted/30 overflow-auto max-h-96">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(memory, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session & Model Info Card */}
      {(memory.session || memory.sessionEvent || memory.usage) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="size-4 dark-icon" />
              Model & Token Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session Info */}
            {memory.session && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Session</h4>
                <div className="rounded-md border border-dashed p-3 bg-muted/30">
                  <dl className="text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">Name</dt>
                      <dd className="text-sm">{memory.session.name}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Session Event (Token Usage from LLM) */}
            {memory.sessionEvent && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">LLM Token Usage</h4>
                <div className="rounded-md border border-dashed p-3 bg-muted/30">
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {memory.sessionEvent.model && (
                      <div>
                        <dt className="text-muted-foreground text-xs">Model</dt>
                        <dd className="font-mono text-xs">{memory.sessionEvent.model}</dd>
                      </div>
                    )}
                    {memory.sessionEvent.tokensPrompt !== null && (
                      <div>
                        <dt className="text-muted-foreground text-xs">Input Tokens</dt>
                        <dd className="text-sm">{memory.sessionEvent.tokensPrompt?.toLocaleString()}</dd>
                      </div>
                    )}
                    {memory.sessionEvent.tokensCompletion !== null && (
                      <div>
                        <dt className="text-muted-foreground text-xs">Output Tokens</dt>
                        <dd className="text-sm">{memory.sessionEvent.tokensCompletion?.toLocaleString()}</dd>
                      </div>
                    )}
                    {memory.sessionEvent.tokensTotal !== null && (
                      <div>
                        <dt className="text-muted-foreground text-xs">Total Tokens</dt>
                        <dd className="text-sm">{memory.sessionEvent.tokensTotal?.toLocaleString()}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Embedding Usage */}
            {memory.usage && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Zap className="size-3" />
                  Plan Usage
                </h4>
                <div className="rounded-md border border-dashed p-3 bg-muted/30">
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">Operation</dt>
                      <dd className="text-sm">{memory.usage.kind === "embedding_store" ? "Memory Store" : memory.usage.kind === "embedding_search" ? "Memory Search" : memory.usage.kind}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Tokens Used</dt>
                      <dd className="text-sm">{memory.usage.tokens.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Searches</dt>
                      <dd className="text-sm">{memory.usage.searches}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Memory Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Memory ID</dt>
              <dd className="font-mono text-xs mt-1">{memory._id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Project ID</dt>
              <dd className="font-mono text-xs mt-1">{memory.projectId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Agent ID</dt>
              <dd className="font-mono text-xs mt-1">{memory.agentId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Session ID</dt>
              <dd className="font-mono text-xs mt-1">{memory.sessionId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created At</dt>
              <dd className="font-mono text-xs mt-1">{memory.createdAt}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Memory Type</dt>
              <dd className="font-mono text-xs mt-1">{memory.memoryType ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="!w-[400px] !max-w-[calc(100%-2rem)]" showCloseButton={false}>
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogHeader>
              <DialogTitle>Delete memory</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this memory? This action cannot be undone and the memory will be permanently removed.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
