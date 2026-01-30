import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/logo";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
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
            <p className="text-md font-semibold uppercase tracking-[0.4em] text-muted-foreground">
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
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <label className="sr-only" htmlFor="waitlist-email">
              Email address
            </label>
            <Input
              id="waitlist-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              className="waitlist-input h-10 text-sm text-foreground placeholder:text-foreground/70"
            />
            <Button type="submit" className="h-10 px-6 text-sm">
              Join waitlist
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
