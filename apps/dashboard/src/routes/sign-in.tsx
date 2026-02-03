import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/sign-in")({
	beforeLoad: ({ context }) => {
		if (context.isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	component: SignInPage,
});

function SignInPage() {
	return (
		<main className="min-h-svh bg-background">
			<div className="grid min-h-svh lg:grid-cols-2">
				<div className="relative hidden bg-muted lg:block">
					<img
						alt="Orca Memory"
						className="hero-image-light absolute inset-0 h-full w-full object-cover"
						src="/images/hero-light.png"
					/>
					<img
						alt="Orca Memory"
						className="hero-image-dark absolute inset-0 h-full w-full object-cover"
						src="/images/hero-dark.png"
					/>
				</div>
				<div className="flex flex-col gap-4 p-6 md:p-10">
					<div className="flex flex-1 items-center justify-center">
						<div className="w-full max-w-xs">
							<LoginForm />
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
