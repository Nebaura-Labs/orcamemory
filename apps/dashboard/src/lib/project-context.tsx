"use client";

import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { authClient } from "@/lib/auth-client";

type Project = {
	_id: Id<"projects">;
	name: string;
	description?: string | null;
};

type ProjectContextType = {
	projects: Project[];
	activeProject: Project | null;
	setActiveProject: (project: Project) => void;
	isLoading: boolean;
	organizationId: string;
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
	const { data: organizations, isPending: orgPending } =
		authClient.useListOrganizations();
	const organizationId = organizations?.[0]?.id ?? "";

	const projects = useQuery(
		api.projects.listByOrganization,
		organizationId ? { organizationId } : "skip"
	) as Project[] | undefined;

	const [activeProject, setActiveProject] = useState<Project | null>(null);

	useEffect(() => {
		if (projects?.length && !activeProject) {
			const stored = localStorage.getItem("activeProjectId");
			const found = stored ? projects.find((p) => p._id === stored) : null;
			setActiveProject(found ?? projects[0]);
		}
	}, [projects, activeProject]);

	const handleSetActiveProject = (project: Project) => {
		setActiveProject(project);
		localStorage.setItem("activeProjectId", project._id);
	};

	const isLoading = orgPending || projects === undefined;

	return (
		<ProjectContext.Provider
			value={{
				projects: projects ?? [],
				activeProject,
				setActiveProject: handleSetActiveProject,
				isLoading,
				organizationId,
			}}
		>
			{children}
		</ProjectContext.Provider>
	);
}

export function useProject() {
	const context = useContext(ProjectContext);
	if (!context) {
		throw new Error("useProject must be used within ProjectProvider");
	}
	return context;
}
