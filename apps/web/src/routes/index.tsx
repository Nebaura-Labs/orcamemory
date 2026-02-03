import { api } from "@moltcity/backend/convex/_generated/api";
import { Envelope, XLogo } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { useState } from "react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const joinWaitlist = useAction(api.waitlist.join);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [isSuccessOpen, setIsSuccessOpen] = useState(false);
	const [modalTitle, setModalTitle] = useState(
		"You're in! Welcome to the beta."
	);
	const [modalDescription, setModalDescription] = useState(
		"Check your inbox for your invite link to get started with Orca Memory."
	);
	const form = useForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			setStatusMessage(null);
			try {
				const result = await joinWaitlist({ email: value.email.trim() });
				if (result?.status === "rate_limited") {
					setStatusMessage(
						"We’re getting a lot of requests. Try again in a moment."
					);
					return { status: "error" as const };
				}
				if (result?.status === "exists") {
					setModalTitle("You already have access");
					setModalDescription(
						"Check your inbox for your invite link, or sign in at app.orcamemory.com."
					);
				} else {
					setModalTitle("You're in! Welcome to the beta.");
					setModalDescription(
						"Check your inbox for your invite link to get started with Orca Memory."
					);
				}
				setIsSuccessOpen(true);
				return { status: "success" as const };
			} catch {
				setStatusMessage("Something went wrong. Try again.");
				return { status: "error" as const };
			}
		},
	});

	return (
		<main className="min-h-svh bg-background">
			<section className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-6 py-16">
				<div className="absolute inset-0 z-0">
					<img
						alt="Orca Memory hero background"
						className="hero-image-light h-full w-full object-cover opacity-50"
						src="/images/hero-light.png"
					/>
					<img
						alt="Orca Memory hero background"
						className="hero-image-dark h-full w-full object-cover"
						src="/images/hero-dark.png"
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/60 dark:from-background/10 dark:via-background/20 dark:to-background/50" />
				</div>
				<div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
					<div className="space-y-3">
						<Logo className="mx-auto h-10 md:h-12" />
						<p className="font-semibold text-md text-primary uppercase tracking-[0.4em]">
							Orca Memory
						</p>
					</div>
					<h1 className="mt-5 font-semibold text-4xl text-foreground tracking-tight md:text-6xl">
						Persistent memory for OpenClaw agents.
					</h1>
					<p className="mt-4 text-base text-muted-foreground md:text-lg">
						Store memories, search semantically, and keep context across
						sessions.
					</p>
					<form
						className="mx-auto mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row"
						noValidate
						onSubmit={async (event) => {
							event.preventDefault();
							event.stopPropagation();
							const result = await form.handleSubmit();
							if (result?.status === "success") {
								form.reset();
							}
						}}
					>
						<label className="sr-only" htmlFor="waitlist-email">
							Email address
						</label>
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
								<div className="w-full">
									<div className="relative">
										<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary">
											<Envelope className="h-4 w-4" />
										</span>
										<Input
											aria-describedby="waitlist-email-error"
											aria-invalid={field.state.meta.errors.length > 0}
											autoComplete="email"
											className="waitlist-input h-10 pl-10 text-foreground text-sm placeholder:text-foreground/70"
											id="waitlist-email"
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) => {
												setStatusMessage(null);
												field.handleChange(event.target.value);
											}}
											placeholder="you@company.com"
											type="email"
											value={field.state.value}
										/>
									</div>
									{field.state.meta.errors.length > 0 ? (
										<p
											className="mt-2 text-destructive text-xs"
											id="waitlist-email-error"
										>
											{field.state.meta.errors.join(" ")}
										</p>
									) : null}
								</div>
							)}
						</form.Field>
						<Button
							className="h-10 px-6 text-sm"
							disabled={form.state.isSubmitting}
							type="submit"
						>
							{form.state.isSubmitting ? "Submitting..." : "Get early access"}
						</Button>
					</form>
					<div className="mt-6">
						<a
							className="inline-flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.3em] transition-colors hover:text-foreground"
							href="https://x.com/orcamemoryai"
							rel="noopener"
							target="_blank"
						>
							<XLogo className="h-4 w-4" weight="bold" />
							Follow us on X
						</a>
					</div>
					{statusMessage ? (
						<p className="mt-3 text-muted-foreground text-xs">
							{statusMessage}
						</p>
					) : null}
				</div>
			</section>
			<Dialog onOpenChange={setIsSuccessOpen} open={isSuccessOpen}>
				<DialogContent className="max-w-lg border-0 p-0 sm:max-w-lg">
					<div className="flex w-full flex-col items-center gap-5 border border-primary/60 border-dashed p-8 md:p-10">
						<div className="flex justify-center">
							<Logo className="h-12" />
						</div>

						<DialogHeader className="gap-2 text-center">
							<DialogTitle className="text-center text-2xl">
								{modalTitle}
							</DialogTitle>
							<DialogDescription className="mx-auto text-center sm:max-w-[90%]">
								{modalDescription}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="w-full sm:justify-center">
							<DialogClose asChild>
								<Button className="w-full">Back to site</Button>
							</DialogClose>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>
		</main>
	);
}
