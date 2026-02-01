import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "convex/react"
import {
  ArrowLeft,
  Bot,
  Calendar,
  Tag,
  FileText,
  Database,
  Trash2,
  AlertTriangle,
  Clock,
  Cpu,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@moltcity/backend/convex/_generated/api"
import type { Id } from "@moltcity/backend/convex/_generated/dataModel"

export const Route = createFileRoute("/memories/$memoryId")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" })
    }
  },
  component: MemoryDetailPage,
})

function MemoryDetailPage() {
  const { memoryId } = Route.useParams()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const memory = useQuery(api.memories.getById, {
    memoryId: memoryId as Id<"memories">,
  })

  const deleteMemory = useMutation(api.memories.deleteMemory)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMemory({ memoryId: memoryId as Id<"memories"> })
      toast.success("Memory deleted successfully")
      void navigate({ to: "/memories" })
    } catch {
      toast.error("Failed to delete memory")
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (memory === undefined) {
    return (
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="bg-card ring-foreground/10 h-8 w-48 animate-pulse rounded-none ring-1" />
          <div className="bg-card ring-foreground/10 h-64 animate-pulse rounded-none ring-1" />
        </div>
      </main>
    )
  }

  if (memory === null) {
    return (
      <main className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Memory not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/memories" })}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Memories
          </Button>
        </div>
      </main>
    )
  }

  const formatUsageKind = (kind: string) => {
    switch (kind) {
      case "embedding_store":
        return "Memory Storage"
      case "embedding_search":
        return "Memory Search"
      default:
        return kind.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate({ to: "/memories" })}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Memory Details</h1>
              <p className="text-muted-foreground text-sm">
                View complete memory information
              </p>
            </div>
          </div>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 size-4" />
                Delete Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[400px]! max-w-[calc(100%-2rem)]" showCloseButton={false}>
              <DialogHeader>
                <div className="bg-destructive/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
                  <AlertTriangle className="text-destructive size-6" />
                </div>
                <DialogTitle className="text-center">Delete Memory</DialogTitle>
                <DialogDescription className="text-center">
                  Are you sure you want to delete this memory? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Content Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="size-5 dark:text-primary" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{memory.content}</p>
            </CardContent>
          </Card>

          {/* Meta Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="size-5 dark:text-primary" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Bot className="text-muted-foreground size-4" />
                <div>
                  <p className="text-muted-foreground text-xs">Agent</p>
                  <p className="text-sm">{memory.agentName}</p>
                </div>
              </div>

              {memory.memoryType && (
                <div className="flex items-center gap-3">
                  <FileText className="text-muted-foreground size-4" />
                  <div>
                    <p className="text-muted-foreground text-xs">Type</p>
                    <Badge variant="secondary">{memory.memoryType}</Badge>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground size-4" />
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="text-sm">
                    {new Date(memory.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {memory.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="text-muted-foreground mt-0.5 size-4" />
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {memory.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Info Card */}
          {memory.session && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="size-5 dark:text-primary" />
                  Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs">Session Name</p>
                  <p className="text-sm">{memory.session.name}</p>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs">Started</p>
                  <p className="text-sm">
                    {new Date(memory.session.startedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LLM Token Usage Card */}
          {memory.sessionEvent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="size-5 dark:text-primary" />
                  LLM Token Usage
                </CardTitle>
                <CardDescription>Token consumption for this memory event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {memory.sessionEvent.model && (
                  <div>
                    <p className="text-muted-foreground text-xs">Model</p>
                    <p className="text-sm">{memory.sessionEvent.model}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {memory.sessionEvent.tokensPrompt !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Input</p>
                      <p className="text-sm font-medium">{memory.sessionEvent.tokensPrompt.toLocaleString()}</p>
                    </div>
                  )}
                  {memory.sessionEvent.tokensCompletion !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Output</p>
                      <p className="text-sm font-medium">{memory.sessionEvent.tokensCompletion.toLocaleString()}</p>
                    </div>
                  )}
                  {memory.sessionEvent.tokensTotal !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Total</p>
                      <p className="text-sm font-medium">{memory.sessionEvent.tokensTotal.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Usage Card */}
          {memory.usage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="size-5 dark:text-primary" />
                  Plan Usage
                </CardTitle>
                <CardDescription>Embedding operations for this memory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs">Operation</p>
                  <p className="text-sm">{formatUsageKind(memory.usage.kind)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {memory.usage.tokens !== undefined && memory.usage.tokens > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs">Tokens Used</p>
                      <p className="text-sm font-medium">{memory.usage.tokens.toLocaleString()}</p>
                    </div>
                  )}
                  {memory.usage.searches !== undefined && memory.usage.searches > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs">Searches</p>
                      <p className="text-sm font-medium">{memory.usage.searches}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Metadata Card */}
          {memory.metadata && Object.keys(memory.metadata).length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="size-5 dark:text-primary" />
                  Raw Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted overflow-x-auto rounded-none p-4 text-xs">
                  {JSON.stringify(memory.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
