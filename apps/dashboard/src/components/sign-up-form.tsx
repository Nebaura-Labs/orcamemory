import type { ComponentProps } from "react";

import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  GithubLogo,
  Lock,
  User,
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
import { toast } from "sonner";

type SignUpFormProps = ComponentProps<"form">;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const name = form.state.values.name;
  const email = form.state.values.email;
  const password = form.state.values.password;
  const handleSendOtp = async () => {
    setStatusMessage(null);
    const currentName = (nameRef.current?.value ?? name).trim();
    const currentEmail = (emailRef.current?.value ?? email).trim().toLowerCase();
    const currentPassword = (passwordRef.current?.value ?? password).trim();

    if (currentName.length < 2) {
      setStatusMessage("Enter your full name.");
      return;
    }
    if (!emailRegex.test(currentEmail)) {
      setStatusMessage("Enter a valid email address.");
      return;
    }
    if (!currentPassword) {
      setStatusMessage("Enter a password to continue.");
      return;
    }
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authClient.signUp.email({
        email: currentEmail,
        password: currentPassword,
        name: currentName,
      });

      await authClient.emailOtp.sendVerificationOtp({
        email: currentEmail,
        type: "email-verification",
      });

      toast.success("Verification code sent to email.");
      saveOtpContext({
        flow: "sign-up",
        method: "email",
        email: currentEmail,
        name: currentName,
        password: currentPassword,
      });
      await navigate({ to: "/otp" });
    } catch {
      const message = "Unable to start sign up. Please try again.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} noValidate {...props}>
      <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.3em] text-foreground">
              <Logo className="h-6 w-auto" />
              ORCA MEMORY
            </div>
            <h1 className="mt-3 text-2xl font-bold">
            Create your account
            </h1>
            <p className="text-muted-foreground text-sm text-balance">
            Use your email to get started.
            </p>
          </div>

        <>
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Enter your full name.",
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <User className="h-4 w-4" />
                    </span>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      ref={nameRef}
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
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  emailRegex.test(value.trim()) ? undefined : "Enter a valid email address.",
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <EnvelopeSimple className="h-4 w-4" />
                    </span>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@company.com"
                      ref={emailRef}
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
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  value.trim().length >= 8 ? undefined : "Password must be at least 8 characters.",
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      onChange={(event) => {
                        setStatusMessage(null);
                        field.handleChange(event.target.value);
                      }}
                      ref={passwordRef}
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
                </Field>
              )}
            </form.Field>
            {statusMessage ? (
              <FieldDescription className="text-center text-destructive">
                {statusMessage}
              </FieldDescription>
            ) : null}
            <Field>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSendOtp()}
                >
                  {isSubmitting ? "Sending code..." : "Send code to email"}
                </Button>
              </div>
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
              Already have an account?{" "}
              <a href="/sign-in" className="underline underline-offset-4">
                Sign in
              </a>
            </FieldDescription>
        </>
      </FieldGroup>
    </form>
  );
}
