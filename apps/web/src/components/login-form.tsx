import type { ComponentProps } from "react";

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  GithubLogo,
  Key,
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

type LoginFormProps = ComponentProps<"form">;

type AuthMethod = "email" | "phone";
type AuthStep = "enter" | "verify";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{7,14}$/;

const normalizePhone = (value: string) => {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  return cleaned ? `+${cleaned}` : "";
};

const detectMethod = (value: string): AuthMethod | null => {
  const trimmed = value.trim();
  if (emailRegex.test(trimmed)) {
    return "email";
  }
  const normalizedPhone = normalizePhone(trimmed);
  if (phoneRegex.test(normalizedPhone)) {
    return "phone";
  }
  return null;
};

export function LoginForm({ className, ...props }: LoginFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("enter");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
      otp: "",
    },
  });
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identifier = form.state.values.identifier;
  const password = form.state.values.password;
  const otp = form.state.values.otp;

  const detectedMethod = useMemo(() => detectMethod(identifier), [identifier]);
  const normalizedPhone = useMemo(() => normalizePhone(identifier), [identifier]);
  const passwordHint = password.trim()
    ? "We’ll still send a verification code."
    : "Password is optional — we’ll send a code to sign you in.";

  const sendOtp = async (method: AuthMethod) => {
    if (method === "email") {
      await authClient.emailOtp.sendVerificationOtp({
        email: identifier.trim(),
        type: "sign-in",
      });
      return;
    }

    await authClient.phoneNumber.sendOtp({ phoneNumber: normalizedPhone });
  };

  const verifyOtp = async (method: AuthMethod) => {
    if (method === "email") {
      await authClient.signIn.emailOtp({
        email: identifier.trim(),
        otp: otp.trim(),
      });
      return;
    }

    await authClient.phoneNumber.verify({
      phoneNumber: normalizedPhone,
      code: otp.trim(),
      updatePhoneNumber: true,
    });
  };

  const handleContinue = async () => {
    const method = detectedMethod;
    if (!method) {
      setStatusMessage("Enter a valid email or phone number.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await sendOtp(method);
      setAuthMethod(method);
      setStep("verify");
    } catch {
      setStatusMessage("Unable to send a code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!authMethod) {
      setStatusMessage("Choose a valid sign-in method first.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await verifyOtp(authMethod);
      await navigate({ to: "/" });
    } catch {
      setStatusMessage("Invalid or expired code. Try again.");
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
        if (step === "enter") {
          void handleContinue();
        } else {
          void handleVerify();
        }
      }}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.3em] text-primary">
            <Logo className="h-6 w-auto" />
            ORCA MEMORY
          </div>
          <h1 className="mt-3 text-2xl font-bold">
            {step === "enter" ? "Welcome back" : "Enter your code"}
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            {step === "enter"
              ? "Choose a sign-in method to continue."
              : authMethod === "phone"
                ? "We sent a code to your phone number."
                : "We sent a code to your email."}
          </p>
        </div>

        {step === "enter" ? (
          <>
            <form.Field
              name="identifier"
              validators={{
                onChange: ({ value }) =>
                  detectMethod(value) ? undefined : "Enter a valid email or phone number.",
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="identifier">Email or phone</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <EnvelopeSimple className="h-4 w-4" />
                    </span>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="you@company.com or +1 555 010 1234"
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
                {isSubmitting ? "Sending code..." : "Continue"}
              </Button>
            </Field>
            <FieldSeparator>Or continue with</FieldSeparator>
            <Field>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setStatusMessage(null);
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
        ) : (
          <>
            <form.Field name="otp">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="otp">Verification code</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Key className="h-4 w-4" />
                    </span>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
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
            {statusMessage ? (
              <FieldDescription className="text-center text-destructive">
                {statusMessage}
              </FieldDescription>
            ) : null}
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify code"}
              </Button>
            </Field>
            <FieldDescription className="text-center">
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => {
                  form.setFieldValue("otp", "");
                  setStatusMessage(null);
                  setStep("enter");
                }}
              >
                Use a different email or phone
              </button>
            </FieldDescription>
          </>
        )}
      </FieldGroup>
    </form>
  );
}
