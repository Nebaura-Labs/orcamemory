import {
	EnvelopeSimple,
	Eye,
	EyeSlash,
	GithubLogo,
	Lock,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
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
import { saveOtpContext } from "@/lib/otp-context";
import { cn } from "@/lib/utils";

type LoginFormProps = ComponentProps<"form">;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ className, ...props }: LoginFormProps) {
	const navigate = useNavigate();
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
		const currentIdentifierRaw = (
			identifierRef.current?.value ?? identifier
		).trim();
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
			await sendOtp(currentIdentifier);
			toast.success("Verification code sent to email.");
			saveOtpContext({
				flow: "sign-in",
				method: "email",
				email: currentIdentifier,
			});
			await navigate({ to: "/otp" });
		} catch (error) {
			const rawMessage = error instanceof Error ? error.message : "";
			const message = rawMessage.toLowerCase().includes("not found")
				? "No account found. Create one to continue."
				: "Unable to send a code. Please try again.";
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
					<div className="flex items-center gap-2 font-semibold text-foreground text-sm tracking-[0.3em]">
						<Logo className="h-6 w-auto" />
						ORCA MEMORY
					</div>
					<h1 className="mt-3 font-bold text-2xl">Welcome back</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Use your email to continue.
					</p>
				</div>

				<>
					<form.Field
						name="identifier"
						validators={{
							onChange: ({ value }) =>
								emailRegex.test(value.trim())
									? undefined
									: "Enter a valid email address.",
						}}
					>
						{(field) => (
							<Field>
								<FieldLabel htmlFor="identifier">Email</FieldLabel>
								<div className="relative">
									<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
										<EnvelopeSimple className="h-4 w-4" />
									</span>
									<Input
										className="pl-10"
										id="identifier"
										onChange={(event) => {
											setStatusMessage(null);
											field.handleChange(event.target.value);
										}}
										placeholder="you@company.com"
										ref={identifierRef}
										type="email"
										value={field.state.value}
									/>
								</div>
							</Field>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">
										Password (optional)
									</FieldLabel>
									<a
										className="ml-auto text-sm underline-offset-4 hover:underline"
										href="#"
									>
										Forgot your password?
									</a>
								</div>
								<div className="relative">
									<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
										<Lock className="h-4 w-4" />
									</span>
									<Input
										className="pr-10 pl-10"
										id="password"
										onChange={(event) => field.handleChange(event.target.value)}
										type={showPassword ? "text" : "password"}
										value={field.state.value}
									/>
									<button
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
										className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
										onClick={() => setShowPassword((current) => !current)}
										type="button"
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
						<Button disabled={isSubmitting} type="submit">
							{isSubmitting ? "Verifying account..." : "Continue"}
						</Button>
					</Field>
					<FieldSeparator>Or continue with</FieldSeparator>
					<Field>
						<Button disabled type="button" variant="outline">
							<GithubLogo className="mr-2 h-4 w-4" weight="fill" />
							GitHub (coming soon)
						</Button>
					</Field>
					<FieldDescription className="text-center">
						Don&apos;t have an account?{" "}
						<a className="underline underline-offset-4" href="/sign-up">
							Sign up
						</a>
					</FieldDescription>
				</>
			</FieldGroup>
		</form>
	);
}
