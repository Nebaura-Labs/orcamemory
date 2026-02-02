import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Ghost } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <Ghost className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Looks like you are lost</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Lets get you back on track!
          </p>
        </div>
      </div>
      <Button asChild>
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </main>
  );
}
