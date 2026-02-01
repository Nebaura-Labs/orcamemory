import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OTPForm } from "@/components/otp-form";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { clearOtpContext, loadOtpContext, type OtpContext } from "@/lib/otp-context";

export const Route = createFileRoute("/otp")({
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: OtpPage,
});

function OtpPage() {
  const navigate = useNavigate();
  const [context, setContext] = useState<OtpContext | null>(() => loadOtpContext());
  const [hasLoaded, setHasLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    if (!context) {
      void navigate({ to: "/sign-in" });
    }
  }, [context, hasLoaded, navigate]);

  const deliveryMethod = "email";
  const email = context?.email ?? "";
  const password = context?.password ?? "";


  const resendOtp = async () => {
    if (!context) {
      return;
    }
    setIsResending(true);
    setStatusMessage(null);

    try {
      if (context.flow === "sign-in") {
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
        });
      } else {
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        });
      }
      toast.success("Verification code sent to email.");
    } catch {
      const message = "Unable to resend code. Try again.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const verifyOtp = async (code: string) => {
    if (!context) {
      setStatusMessage("Start again to receive a code.");
      return;
    }
    if (!code.trim()) {
      setStatusMessage("Enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    try {
      if (context.flow === "sign-in") {
        await authClient.signIn.emailOtp({ email, otp: code.trim() });
      } else {
        await authClient.emailOtp.verifyEmail({ email, otp: code.trim() });
      }

      if (context.flow === "sign-up") {
        try {
          await authClient.signIn.email({
            email,
            password,
            callbackURL: "/onboarding",
          });
        } catch {
          const message = "We verified your code, but could not sign you in.";
          setStatusMessage(message);
          toast.error(message);
          return;
        }
      }

      clearOtpContext();
      toast.success("Verification successful.");
      await navigate({ to: context.flow === "sign-up" ? "/onboarding" : "/" });
    } catch {
      const message = "Invalid or expired code. Try again.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

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
              {!context ? (
                <FieldGroup>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.3em] text-foreground">
                    <Logo className="h-6 w-auto" />
                    ORCA MEMORY
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Verification required</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Start from sign in or sign up to receive a new code.
                    </p>
                  </div>
                  <Field>
                    <Button type="button" className="w-full" onClick={() => void navigate({ to: "/sign-in" })}>
                      Go to sign in
                    </Button>
                  </Field>
                  <FieldDescription className="text-center">
                    Need an account?{" "}
                    <a href="/sign-up" className="underline underline-offset-4">
                      Create one
                    </a>
                  </FieldDescription>
                </FieldGroup>
              ) : (
                <OTPForm
                  deliveryMethod={deliveryMethod}
                  statusMessage={statusMessage}
                  isVerifying={isVerifying}
                  isResending={isResending}
                  onVerify={verifyOtp}
                  onResendEmail={email ? () => void resendOtp() : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
