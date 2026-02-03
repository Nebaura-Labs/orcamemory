import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/account")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: AccountPage,
});

function AccountPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const { data: organizations, isPending: isOrgsPending } =
		authClient.useListOrganizations();

	const [name, setName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const user = session?.user;

	useEffect(() => {
		// Wait for organizations to finish loading
		if (isOrgsPending) return;
		// Only redirect if loaded and empty (not just undefined)
		if (organizations != null && organizations.length === 0) {
			navigate({ to: "/onboarding" });
		}
	}, [isOrgsPending, navigate, organizations]);

	useEffect(() => {
		if (user) {
			setName(user.name ?? "");
		}
	}, [user]);

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("Name is required");
			return;
		}

		setIsSaving(true);
		try {
			await authClient.updateUser({
				name: name.trim(),
			});
			toast.success("Profile updated");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update profile"
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (!user) {
		return (
			<main className="flex-1 p-6">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</div>
			</main>
		);
	}

	const initials =
		user.name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) || "?";

	const hasChanges = name !== (user.name ?? "");

	return (
		<main className="flex-1 p-6">
			<div className="space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Account</h1>
					<p className="text-muted-foreground text-sm">
						Manage your personal account settings
					</p>
				</div>

				{/* Profile */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="size-5" />
							Profile
						</CardTitle>
						<CardDescription>Your personal information</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center gap-4">
							<Avatar className="size-16">
								<AvatarImage alt={user.name} src={user.image ?? undefined} />
								<AvatarFallback className="text-lg">{initials}</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-medium">{user.name}</p>
								<p className="text-muted-foreground text-sm">{user.email}</p>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Display Name</Label>
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-muted-foreground text-xs">Email</Label>
							<div className="rounded-md bg-muted px-3 py-2 text-sm">
								{user.email}
							</div>
							<p className="text-muted-foreground text-xs">
								Email cannot be changed
							</p>
						</div>
					</CardContent>
					<CardFooter className="border-t pt-6">
						<Button disabled={!hasChanges || isSaving} onClick={handleSave}>
							{isSaving ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : (
								<Save className="mr-2 size-4" />
							)}
							Save Changes
						</Button>
					</CardFooter>
				</Card>

				{/* Account Info */}
				<Card>
					<CardHeader>
						<CardTitle>Account Information</CardTitle>
						<CardDescription>
							Technical details about your account
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="text-muted-foreground text-xs">User ID</Label>
							<div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
								{user.id}
							</div>
						</div>
						<div className="space-y-2">
							<Label className="text-muted-foreground text-xs">
								Account Created
							</Label>
							<div className="text-sm">
								{new Date(user.createdAt).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
