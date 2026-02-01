import type { ComponentProps } from "react";

import { useRef, useState } from "react";
import { useConvex } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  GithubLogo,
  Lock,
} from "@phosphor-icons/react";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { saveOtpContext } from "@/lib/otp-context";
import { api } from "@moltcity/backend/convex/_generated/api";
import { toast } from "sonner";

type LoginFormProps = ComponentProps<"form">;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ className, ...props }: LoginFormProps) {
  const navigate = useNavigate();
  const convex = useConvex();
  const identifierRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identifier = form.state.values.identifier;
  const password = form.state.values.password;
  const passwordHint = password.trim()
    ? "We’ll still send a verification code."
    : "Password is optional — we’ll send a code to sign you in.";

  const sendOtp = async (email: string) => {
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
  };

  const handleContinue = async () => {
    setStatusMessage(null);
    const currentIdentifierRaw = (identifierRef.current?.value ?? identifier).trim();
    const currentIdentifier = currentIdentifierRaw.toLowerCase();
    if (!emailRegex.test(currentIdentifier)) {
      setStatusMessage("Enter a valid email address.");
      return;
    }
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const exists = await convex.query(api.users.userExists, {
        email: currentIdentifier,
      });
      if (!exists) {
        const message = "No account found. Create one to continue.";
        setStatusMessage(message);
        toast.error(message);
        return;
      }

      await sendOtp(currentIdentifier);
      toast.success("Verification code sent to email.");
      saveOtpContext({
        flow: "sign-in",
        method: "email",
        email: currentIdentifier,
      });
      await navigate({ to: "/otp" });
    } catch {
      const message = "Unable to send a code. Please try again.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleContinue();
      }}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.3em] text-foreground">
            <Logo className="h-6 w-auto" />
            ORCA MEMORY
          </div>
          <h1 className="mt-3 text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Use your email to continue.
          </p>
        </div>

        <>
            <form.Field
              name="identifier"
              validators={{
                onChange: ({ value }) =>
                  emailRegex.test(value.trim()) ? undefined : "Enter a valid email address.",
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="identifier">Email</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <EnvelopeSimple className="h-4 w-4" />
                    </span>
                    <Input
                      id="identifier"
                      type="email"
                      placeholder="you@company.com"
                      ref={identifierRef}
                      value={field.state.value}
                      onChange={(event) => {
                        setStatusMessage(null);
                        field.handleChange(event.target.value);
                      }}
                      className="pl-10"
                    />
                  </div>
                </Field>
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password (optional)</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? (
                        <EyeSlash className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldDescription className="mt-2 text-center">
                    {passwordHint}
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
            {statusMessage ? (
              <FieldDescription className="text-center text-destructive">
                {statusMessage}
              </FieldDescription>
            ) : null}
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Verifying account..." : "Continue"}
              </Button>
            </Field>
            <FieldSeparator>Or continue with</FieldSeparator>
            <Field>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setStatusMessage(null);
                  try {
                    const result = await authClient.signIn.social({
                      provider: "github",
                      callbackURL: "/",
                      disableRedirect: true,
                    });
                    const redirectUrl = result?.data?.url;
                    if (redirectUrl) {
                      window.location.href = redirectUrl;
                      return;
                    }
                    setStatusMessage("Unable to start GitHub sign-in.");
                  } catch (error) {
                    setStatusMessage(
                      `GitHub sign-in failed: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`,
                    );
                  }
                }}
              >
                <GithubLogo className="mr-2 h-4 w-4" weight="fill" />
                Continue with GitHub
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <a href="/sign-up" className="underline underline-offset-4">
                Sign up
              </a>
            </FieldDescription>
        </>
      </FieldGroup>
    </form>
  );
}
