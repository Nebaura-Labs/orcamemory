import {
	EnvelopeSimple,
	Eye,
	EyeSlash,
	GithubLogo,
	Key,
	Lock,
	Phone,
	User,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";

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

type SignUpFormProps = ComponentProps<"form">;

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

export function SignUpForm({ className, ...props }: SignUpFormProps) {
	const navigate = useNavigate();
	const [step, setStep] = useState<AuthStep>("enter");
	const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			phoneNumber: "",
			password: "",
			otp: "",
		},
	});
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const name = form.state.values.name;
	const email = form.state.values.email;
	const phoneNumber = form.state.values.phoneNumber;
	const password = form.state.values.password;
	const otp = form.state.values.otp;

	const normalizedPhone = useMemo(
		() => normalizePhone(phoneNumber),
		[phoneNumber]
	);

	const handleSendOtp = async (method: AuthMethod) => {
		const trimmedEmail = email.trim();

		if (!name.trim()) {
			setStatusMessage("Enter your full name.");
			return;
		}
		if (!emailRegex.test(trimmedEmail)) {
			setStatusMessage("Enter a valid email address.");
			return;
		}
		if (!phoneRegex.test(normalizedPhone)) {
			setStatusMessage("Enter a valid phone number.");
			return;
		}
		if (!password.trim()) {
			setStatusMessage("Enter a password to continue.");
			return;
		}

		setIsSubmitting(true);
		setStatusMessage(null);
		setAuthMethod(method);

		try {
			await authClient.signUp.email({
				email: trimmedEmail,
				password: password.trim(),
				name: name.trim(),
			});

			if (method === "email") {
				await authClient.emailOtp.sendVerificationOtp({
					email: trimmedEmail,
					type: "email-verification",
				});
			} else {
				await authClient.phoneNumber.sendOtp({ phoneNumber: normalizedPhone });
			}

			setStep("verify");
		} catch {
			setStatusMessage("Unable to start sign up. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleVerify = async () => {
		if (!authMethod) {
			setStatusMessage("Choose where to receive your code.");
			return;
		}

		setIsSubmitting(true);
		setStatusMessage(null);

		try {
			if (authMethod === "email") {
				await authClient.emailOtp.verifyEmail({
					email: email.trim(),
					otp: otp.trim(),
				});
				await authClient.signIn.email({
					email: email.trim(),
					password: password.trim(),
					callbackURL: "/",
				});
			} else {
				await authClient.phoneNumber.verify({
					phoneNumber: normalizedPhone,
					code: otp.trim(),
					updatePhoneNumber: true,
				});
			}

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
			{...props}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<div className="flex items-center gap-2 font-semibold text-primary text-sm tracking-[0.3em]">
						<Logo className="h-6 w-auto" />
						ORCA MEMORY
					</div>
					<h1 className="mt-3 font-bold text-2xl">
						{step === "enter" ? "Create your account" : "Enter your code"}
					</h1>
					<p className="text-balance text-muted-foreground text-sm">
						{step === "enter"
							? "Choose a sign-up method to get started."
							: authMethod === "phone"
								? "We sent a code to your phone number."
								: "We sent a code to your email."}
					</p>
				</div>

				{step === "enter" ? (
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
										<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
											<User className="h-4 w-4" />
										</span>
										<Input
											className="pl-10"
											id="signup-name"
											onChange={(event) => {
												setStatusMessage(null);
												field.handleChange(event.target.value);
											}}
											placeholder="Your name"
											type="text"
											value={field.state.value}
										/>
									</div>
								</Field>
							)}
						</form.Field>
						<form.Field
							name="email"
							validators={{
								onChange: ({ value }) =>
									emailRegex.test(value.trim())
										? undefined
										: "Enter a valid email address.",
							}}
						>
							{(field) => (
								<Field>
									<FieldLabel htmlFor="signup-email">Email</FieldLabel>
									<div className="relative">
										<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
											<EnvelopeSimple className="h-4 w-4" />
										</span>
										<Input
											className="pl-10"
											id="signup-email"
											onChange={(event) => {
												setStatusMessage(null);
												field.handleChange(event.target.value);
											}}
											placeholder="you@company.com"
											type="email"
											value={field.state.value}
										/>
									</div>
								</Field>
							)}
						</form.Field>
						<form.Field
							name="phoneNumber"
							validators={{
								onChange: ({ value }) => {
									const normalized = normalizePhone(value);
									return phoneRegex.test(normalized)
										? undefined
										: "Enter a valid phone number.";
								},
							}}
						>
							{(field) => (
								<Field>
									<FieldLabel htmlFor="signup-phone">Phone number</FieldLabel>
									<div className="relative">
										<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
											<Phone className="h-4 w-4" />
										</span>
										<Input
											className="pl-10"
											id="signup-phone"
											onChange={(event) => {
												setStatusMessage(null);
												field.handleChange(event.target.value);
											}}
											placeholder="+1 555 010 1234"
											type="tel"
											value={field.state.value}
										/>
									</div>
								</Field>
							)}
						</form.Field>
						<form.Field
							name="password"
							validators={{
								onChange: ({ value }) =>
									value.trim().length >= 8
										? undefined
										: "Password must be at least 8 characters.",
							}}
						>
							{(field) => (
								<Field>
									<FieldLabel htmlFor="signup-password">Password</FieldLabel>
									<div className="relative">
										<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
											<Lock className="h-4 w-4" />
										</span>
										<Input
											className="pr-10 pl-10"
											id="signup-password"
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
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
									disabled={isSubmitting}
									onClick={() => void handleSendOtp("email")}
									type="button"
								>
									{isSubmitting && authMethod === "email"
										? "Sending code..."
										: "Send code to email"}
								</Button>
								<Button
									disabled={isSubmitting}
									onClick={() => void handleSendOtp("phone")}
									type="button"
									variant="outline"
								>
									{isSubmitting && authMethod === "phone"
										? "Sending code..."
										: "Send code to phone"}
								</Button>
							</div>
						</Field>
						<FieldSeparator>Or continue with</FieldSeparator>
						<Field>
							<Button
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
								type="button"
								variant="outline"
							>
								<GithubLogo className="mr-2 h-4 w-4" weight="fill" />
								Continue with GitHub
							</Button>
						</Field>
						<FieldDescription className="text-center">
							Already have an account?{" "}
							<a className="underline underline-offset-4" href="/sign-in">
								Sign in
							</a>
						</FieldDescription>
					</>
				) : (
					<>
						<form.Field name="otp">
							{(field) => (
								<Field>
									<FieldLabel htmlFor="signup-otp">
										Verification code
									</FieldLabel>
									<div className="relative">
										<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
											<Key className="h-4 w-4" />
										</span>
										<Input
											autoComplete="one-time-code"
											className="pl-10"
											id="signup-otp"
											inputMode="numeric"
											onChange={(event) => {
												setStatusMessage(null);
												field.handleChange(event.target.value);
											}}
											placeholder="123456"
											type="text"
											value={field.state.value}
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
							<Button
								disabled={isSubmitting}
								onClick={() => void handleVerify()}
								type="button"
							>
								{isSubmitting ? "Verifying..." : "Verify code"}
							</Button>
						</Field>
						<FieldDescription className="text-center">
							<button
								className="underline underline-offset-4"
								onClick={() => {
									form.setFieldValue("otp", "");
									setStatusMessage(null);
									setStep("enter");
								}}
								type="button"
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
