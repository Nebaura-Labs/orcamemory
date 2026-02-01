import { createFileRoute, redirect } from "@tanstack/react-router";

import { SignUpForm } from "@/components/sign-up-form";

export const Route = createFileRoute("/sign-up")({
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/images/hero-light.png"
            alt="Orca Memory"
            className="hero-image-light absolute inset-0 h-full w-full object-cover"
          />
          <img
            src="/images/hero-dark.png"
            alt="Orca Memory"
            className="hero-image-dark absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <SignUpForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
