import type { ComponentProps } from "react";

import { useState } from "react";

import Logo from "@/components/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type OTPFormProps = ComponentProps<"div"> & {
  deliveryMethod?: "email";
  statusMessage?: string | null;
  isVerifying?: boolean;
  isResending?: boolean;
  onVerify?: (code: string) => void | Promise<void>;
  onResendEmail?: () => void | Promise<void>;
};

const deliveryCopy = "We sent a 6-digit code to your email address";

export function OTPForm({
  className,
  deliveryMethod = "email",
  statusMessage,
  isVerifying,
  isResending,
  onVerify,
  onResendEmail,
  ...props
}: OTPFormProps) {
  const [otp, setOtp] = useState("");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.3em] text-foreground">
              <Logo className="h-6 w-auto" />
              ORCA MEMORY
            </div>
            <h1 className="text-xl font-bold">Enter verification code</h1>
            <FieldDescription>{deliveryCopy}</FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              Verification code
            </FieldLabel>
            <InputOTP
              maxLength={6}
              id="otp"
              required
              containerClassName="gap-4 justify-center"
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:border-dashed *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:border-dashed *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </Field>
          {statusMessage ? (
            <FieldDescription className="text-center text-destructive">
              {statusMessage}
            </FieldDescription>
          ) : null}
          <Field>
            <Button
              type="button"
              disabled={isVerifying || otp.trim().length < 6}
              onClick={() => void onVerify?.(otp)}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </Field>
        </FieldGroup>
      </div>
      <FieldDescription className="text-center">
        Didn&apos;t receive the code?
      </FieldDescription>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={isResending || !onResendEmail}
          onClick={() => void onResendEmail?.()}
        >
          {isResending ? "Resending email..." : "Resend to email"}
        </Button>
      </div>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
