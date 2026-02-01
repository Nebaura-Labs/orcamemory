import type { FormEvent } from "react";

import { useMemo, useState } from "react";
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
import { authClient } from "@/lib/auth-client";
import { api } from "@moltcity/backend/convex/_generated/api";
import { toast } from "sonner";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);

type CreateWorkspaceDialogProps = {
  onCreated?: () => void;
};

export function CreateWorkspaceDialog({ onCreated }: CreateWorkspaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const ensurePlan = useMutation(api.plans.ensurePlanForOrganization);

  const slugValue = useMemo(() => slugify(name), [name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setStatusMessage("Enter a workspace name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const organization = await authClient.organization.create({
        name: trimmedName,
        slug: slugValue || trimmedName.toLowerCase(),
      });
      if (organization?.id) {
        await ensurePlan({ organizationId: organization.id });
      }
      toast.success("Workspace created.");
      onCreated?.();
      setOpen(false);
      setName("");
    } catch {
      const message = "Unable to create workspace. Try again.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Create workspace</Button>
      </DialogTrigger>
      <DialogContent className="border border-dashed border-primary p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create workspace
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            Workspaces keep your OpenClaw agents, projects, and memory policies organized.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-4">
            <Label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace name<span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              id="workspace-name"
              name="workspace-name"
              placeholder="My workspace"
              className="mt-2"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {statusMessage ? (
              <p className="mt-3 text-xs text-destructive">{statusMessage}</p>
            ) : null}
            <Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create workspace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
