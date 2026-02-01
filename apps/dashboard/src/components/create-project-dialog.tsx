import type { FormEvent } from "react";

import { useState } from "react";
import { useMutation } from "convex/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { authClient } from "@/lib/auth-client";
import { api } from "@moltcity/backend/convex/_generated/api";
import { toast } from "sonner";

type CreateProjectDialogProps = {
  onCreated?: () => void;
};

export function CreateProjectDialog({ onCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const createProject = useMutation(api.projects.create);
  const { data: organizations } = authClient.useListOrganizations();
  const organizationId = organizations?.[0]?.id ?? "";
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [retention, setRetention] = useState("Keep Forever");
  const [memoryTypes, setMemoryTypes] = useState<string[]>([
    "conversations",
    "decisions",
    "preferences",
    "facts",
  ]);
  const [sessionLoggingEnabled, setSessionLoggingEnabled] = useState(true);
  const [memoryCurrentEnabled, setMemoryCurrentEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Create project</Button>
      </DialogTrigger>
      <DialogContent className="border border-dashed border-primary p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create project
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            Projects keep your agents, data sources, and memory settings organized.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setStatusMessage(null);

            if (!organizationId) {
              setStatusMessage("Create a workspace first.");
              return;
            }

            const trimmedName = projectName.trim();
            if (!trimmedName) {
              setStatusMessage("Enter a project name.");
              return;
            }

            setIsSubmitting(true);
            try {
              await createProject({
                organizationId,
                name: trimmedName,
                description: projectDescription.trim() || null,
                memoryRetention: retention,
                memoryTypes,
                sessionLoggingEnabled,
                memoryCurrentEnabled,
              });
              toast.success("Project created.");
              onCreated?.();
              setOpen(false);
              setProjectName("");
              setProjectDescription("");
            } catch {
              const message = "Unable to create project. Try again.";
              setStatusMessage(message);
              toast.error(message);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="space-y-4 px-6 pb-4">
            <div>
              <Label htmlFor="project-name" className="text-sm font-medium">
                Project name<span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                id="project-name"
                name="project-name"
                placeholder="Memory Ops"
                className="mt-2"
                required
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="project-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="project-description"
                name="project-description"
                placeholder="What is this project for?"
                className="mt-2 min-h-[96px] border-dashed"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="retention-policy" className="text-sm font-medium">
                Memory retention
              </Label>
              <Select value={retention} onValueChange={setRetention}>
                <SelectTrigger id="retention-policy" className="mt-2 w-full border-dashed">
                  <SelectValue placeholder="Select a policy" />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  sideOffset={8}
                  align="start"
                  alignItemWithTrigger={false}
                  className="bg-card !border !border-dashed !border-input !ring-0 !shadow-none"
                >
                  <SelectItem value="Keep Forever">Keep Forever</SelectItem>
                  <SelectItem value="One Year">One Year</SelectItem>
                  <SelectItem value="Six Months">Six Months</SelectItem>
                  <SelectItem value="90 Days">90 Days</SelectItem>
                  <SelectItem value="30 Days">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Memory types</Label>
              <ToggleGroup
                className="mt-2 flex w-full flex-nowrap gap-2"
                multiple
                variant="outline"
                value={memoryTypes}
                onValueChange={(value) => setMemoryTypes(value)}
              >
                <ToggleGroupItem
                  value="conversations"
                  className="border-dashed data-[state=off]:bg-transparent flex-1 justify-center"
                >
                  Conversations
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="decisions"
                  className="border-dashed data-[state=off]:bg-transparent flex-1 justify-center"
                >
                  Decisions
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="preferences"
                  className="border-dashed data-[state=off]:bg-transparent flex-1 justify-center"
                >
                  Preferences
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="facts"
                  className="border-dashed data-[state=off]:bg-transparent flex-1 justify-center"
                >
                  Facts
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="rounded-md border border-dashed border-primary/40 bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="session-logging" className="text-sm font-medium">
                    Session logging & token tracking
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Capture action history and token usage per session.
                  </p>
                </div>
                <Switch
                  id="session-logging"
                  checked={sessionLoggingEnabled}
                  onCheckedChange={setSessionLoggingEnabled}
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="shared-memory" className="text-sm font-medium">
                    Memory current
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    All agents flow through the same shared memory current.
                  </p>
                </div>
                <Switch
                  id="shared-memory"
                  checked={memoryCurrentEnabled}
                  onCheckedChange={setMemoryCurrentEnabled}
                />
              </div>
            </div>
            {statusMessage ? (
              <p className="text-xs text-destructive">{statusMessage}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
