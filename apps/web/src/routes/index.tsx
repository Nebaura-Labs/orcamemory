import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useAction } from "convex/react";
import { Envelope, XLogo } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Logo from "@/components/logo";
import { api } from "@moltcity/backend/convex/_generated/api";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const joinWaitlist = useAction(api.waitlist.join);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Welcome to the future of AI memory");
  const [modalDescription, setModalDescription] = useState(
    "Thanks for joining the Orca Memory waitlist. We’ll be in touch when early access opens.",
  );
  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setStatusMessage(null);
      try {
        const result = await joinWaitlist({ email: value.email.trim() });
        if (result?.status === "exists") {
          setModalTitle("You're already on the list");
          setModalDescription("No action needed. We’ll email you when early access opens.");
        } else {
          setModalTitle("Welcome to the future of AI memory");
          setModalDescription(
            "Thanks for joining the Orca Memory waitlist. We’ll be in touch when early access opens.",
          );
        }
        setIsSuccessOpen(true);
        return { status: "success" as const };
      } catch {
        setStatusMessage("Something went wrong. Try again.");
        return { status: "error" as const };
      }
    },
  });

  return (
    <main className="min-h-svh bg-background">
      <section className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-6 py-16">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-light.png"
            alt="Orca Memory hero background"
            className="hero-image-light h-full w-full object-cover opacity-50"
          />
          <img
            src="/images/hero-dark.png"
            alt="Orca Memory hero background"
            className="hero-image-dark h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/60 dark:from-background/10 dark:via-background/20 dark:to-background/50" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="space-y-3">
            <Logo className="mx-auto h-10 md:h-12" />
            <p className="text-md font-semibold uppercase tracking-[0.4em] text-primary">
              Orca Memory
            </p>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Persistent memory for OpenClaw agents.
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Store memories, search semantically, and keep context across sessions.
          </p>
          <form
            className="mx-auto mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              const result = await form.handleSubmit();
              if (result?.status === "success") {
                form.reset();
              }
            }}
          >
            <label className="sr-only" htmlFor="waitlist-email">
              Email address
            </label>
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  emailRegex.test(value.trim()) ? undefined : "Enter a valid email address.",
              }}
            >
              {(field) => (
                <div className="w-full">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Envelope className="h-4 w-4" />
                    </span>
                    <Input
                      id="waitlist-email"
                      name={field.name}
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        setStatusMessage(null);
                        field.handleChange(event.target.value);
                      }}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby="waitlist-email-error"
                      className="waitlist-input h-10 pl-10 text-sm text-foreground placeholder:text-foreground/70"
                    />
                  </div>
                  {field.state.meta.errors.length > 0 ? (
                    <p id="waitlist-email-error" className="mt-2 text-xs text-destructive">
                      {field.state.meta.errors.join(" ")}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
            <Button
              type="submit"
              className="h-10 px-6 text-sm"
              disabled={form.state.isSubmitting}
            >
              {form.state.isSubmitting ? "Joining..." : "Join waitlist"}
            </Button>
          </form>
          <div className="mt-6">
            <a
              href="https://x.com/orcamemoryai"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <XLogo className="h-4 w-4" weight="bold" />
              Follow us on X
            </a>
          </div>
          {statusMessage ? (
            <p className="mt-3 text-xs text-muted-foreground">{statusMessage}</p>
          ) : null}
        </div>
      </section>
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="border-0 max-w-lg sm:max-w-lg p-0">
          <div className="flex w-full flex-col items-center gap-5 border border-dashed border-primary/60 p-8 md:p-10">
            <div className="flex justify-center">
              <Logo className="h-12" />
            </div>

            <DialogHeader className="text-center gap-2">
            <DialogTitle className="text-center text-2xl">{modalTitle}</DialogTitle>
            <DialogDescription className="text-center mx-auto sm:max-w-[90%]">
              {modalDescription}
            </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center w-full">
              <DialogClose asChild>
                <Button className="w-full">Back to site</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
