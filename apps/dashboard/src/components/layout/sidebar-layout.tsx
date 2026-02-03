import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
	Bot,
	Database,
	GaugeCircle,
	KeyRound,
	LayoutDashboard,
	Settings2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar";

// Navigation model ----------------------------------------------------------

type NavItem = {
	label: string;
	to?: string;
	icon: LucideIcon;
	badge?: string;
	disabled?: boolean;
	match?: string;
};

const PRIMARY_NAV: NavItem[] = [
	{
		label: "Overview",
		to: "/",
		match: "/",
		icon: LayoutDashboard,
	},
	{
		label: "Projects",
		to: "/projects",
		icon: Database,
		badge: "Soon",
		disabled: true,
	},
	{
		label: "Agents",
		to: "/agents",
		icon: Bot,
		badge: "Soon",
		disabled: true,
	},
	{
		label: "API Keys",
		to: "/api-keys",
		icon: KeyRound,
		badge: "Soon",
		disabled: true,
	},
];

const SECONDARY_NAV: NavItem[] = [
	{
		label: "Usage",
		to: "/usage",
		icon: GaugeCircle,
		badge: "Soon",
		disabled: true,
	},
	{
		label: "Settings",
		to: "/settings",
		icon: Settings2,
		badge: "Soon",
		disabled: true,
	},
	{
		label: "Onboarding",
		to: "/onboarding",
		icon: LayoutDashboard,
		match: "/onboarding",
	},
];

const matchesPath = (pathname: string, item: NavItem) => {
	if (!item.to) {
		return false;
	}

	const matchTarget = item.match ?? item.to;
	if (matchTarget === "/") {
		return pathname === "/";
	}

	return pathname === matchTarget || pathname.startsWith(`${matchTarget}/`);
};

// Layout --------------------------------------------------------------------

type SidebarLayoutProps = {
	children: ReactNode;
};

export function SidebarLayout({ children }: SidebarLayoutProps) {
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const handleNavigate = (item: NavItem) => {
		if (!item.to || item.disabled) {
			return;
		}
		void navigate({ to: item.to });
	};

	const activeGroups = useMemo(() => {
		return {
			primary: PRIMARY_NAV.map((item) => matchesPath(pathname, item)),
			secondary: SECONDARY_NAV.map((item) => matchesPath(pathname, item)),
		};
	}, [pathname]);

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon">
				<SidebarHeader className="border-sidebar-border/60 border-b px-2 py-4">
					<div className="flex items-center gap-2">
						<Logo className="h-6 w-auto" />
						<span className="font-semibold text-sidebar-foreground/80 text-xs uppercase tracking-[0.35em]">
							Orca Memory
						</span>
					</div>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Workspace</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{PRIMARY_NAV.map((item, index) => (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											aria-current={
												activeGroups.primary[index] ? "page" : undefined
											}
											disabled={item.disabled}
											isActive={activeGroups.primary[index]}
											onClick={() => handleNavigate(item)}
										>
											<item.icon aria-hidden="true" className="h-4 w-4" />
											<span>{item.label}</span>
										</SidebarMenuButton>
										{item.badge ? (
											<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
										) : null}
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
					<SidebarSeparator />
					<SidebarGroup>
						<SidebarGroupLabel>Operations</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{SECONDARY_NAV.map((item, index) => (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											aria-current={
												activeGroups.secondary[index] ? "page" : undefined
											}
											disabled={item.disabled}
											isActive={activeGroups.secondary[index]}
											onClick={() => handleNavigate(item)}
										>
											<item.icon aria-hidden="true" className="h-4 w-4" />
											<span>{item.label}</span>
										</SidebarMenuButton>
										{item.badge ? (
											<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
										) : null}
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter className="mt-auto border-sidebar-border/60 border-t">
					<Button
						className="w-full border border-sidebar-border/60 border-dashed"
						onClick={() => handleNavigate({ to: "/onboarding" })}
						variant="outline"
					>
						Restart onboarding
					</Button>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
			<SidebarInset>
				<header className="flex h-14 items-center gap-2 border-border/60 border-b bg-background px-4">
					<SidebarTrigger />
					<span className="text-muted-foreground text-sm">Dashboard</span>
				</header>
				<div className="flex-1 overflow-y-auto bg-background">
					<div className="mx-auto flex h-full w-full max-w-5xl flex-col px-6 py-8">
						{children}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
