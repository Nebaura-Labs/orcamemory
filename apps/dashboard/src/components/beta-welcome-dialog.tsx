import { ExternalLink } from "lucide-react";
import { useState } from "react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const DISCORD_INVITE_URL = "https://discord.gg/DptEDf3n";

export function BetaWelcomeDialog() {
	const [open, setOpen] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem("beta-welcome-seen") !== "true";
	});

	const handleClose = () => {
		localStorage.setItem("beta-welcome-seen", "true");
		setOpen(false);
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogContent className="border border-primary border-dashed sm:max-w-md">
				<DialogHeader className="space-y-2 pt-4">
					<div className="flex items-center justify-center gap-2">
						<Logo className="h-12 w-auto" />
					</div>
					<DialogTitle className="text-center text-xl">
						Welcome to the Beta!
					</DialogTitle>
					<DialogDescription className="text-center">
						Thanks for joining the waitlist. You&apos;re one of the first to try
						Orca Memory.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="rounded-md border border-input border-dashed bg-muted/40 p-4">
						<h4 className="mb-2 font-medium text-foreground">
							Join our Discord
						</h4>
						<p className="mb-3 text-muted-foreground text-sm">
							Head to{" "}
							<code className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground text-xs">
								#request-user-role
							</code>{" "}
							to get the Beta role and access to:
						</p>
						<ul className="mb-3 space-y-1 text-muted-foreground text-sm">
							<li className="flex items-center gap-2">
								<span className="h-1.5 w-1.5 rounded-full bg-primary" />
								Beta feedback channel
							</li>
							<li className="flex items-center gap-2">
								<span className="h-1.5 w-1.5 rounded-full bg-primary" />
								Bug reports &amp; feature requests
							</li>
							<li className="flex items-center gap-2">
								<span className="h-1.5 w-1.5 rounded-full bg-primary" />
								Early access to new features
							</li>
						</ul>
						<Button asChild className="w-full" size="sm">
							<a
								href={DISCORD_INVITE_URL}
								rel="noopener noreferrer"
								target="_blank"
							>
								Join Discord
								<ExternalLink className="ml-2 h-4 w-4" />
							</a>
						</Button>
					</div>

					<p className="text-center text-muted-foreground text-xs">
						We&apos;d love your feedback to make Orca Memory even better.
					</p>
				</div>

				<Button className="w-full" onClick={handleClose} variant="outline">
					Got it, let&apos;s go!
				</Button>
			</DialogContent>
		</Dialog>
	);
}
