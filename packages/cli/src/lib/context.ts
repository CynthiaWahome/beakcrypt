import { api } from "@beakcrypt/convex";
import { getAuthConfig } from "./global-config";
import { getProjectConfig, saveProjectConfig, type ProjectConfig } from "./project-config";
import { query, mutation } from "./convex-client";
import { unwrapResult, CliError } from "./errors";
import * as interactive from "./interactive";
import * as output from "./output";
import { loginCommand } from "../commands/login";

export interface ResolvedContext {
	orgId: string;
	orgSlug: string;
	projectId: string;
	projectName: string;
	envName: string;
	environmentId: string;
}

interface ContextFlags {
	org?: string;
	project?: string;
	env?: string;
}

export async function ensureAuth(): Promise<void> {
	const auth = await getAuthConfig();
	if (auth) return;

	if (!interactive.isInteractive()) {
		throw new CliError("Not logged in. Run `beakcrypt login` first.");
	}

	const shouldLogin = await interactive.confirm("You're not logged in. Log in now?", true);
	if (!shouldLogin) process.exit(0);
	await loginCommand();
}

export async function resolveContext(flags: ContextFlags): Promise<ResolvedContext> {
	await ensureAuth();

	const projectConfig = await getProjectConfig();

	const orgId = flags.org ? await resolveOrgBySlug(flags.org) : projectConfig?.orgId;
	const orgSlug = flags.org ?? projectConfig?.orgSlug;
	const projectId = flags.project
		? await resolveProjectByName(orgId!, flags.project)
		: projectConfig?.projectId;
	const projectName = flags.project ?? projectConfig?.projectName;
	const envName = flags.env ?? projectConfig?.defaultEnv;

	if (!orgId || !projectId || !envName || !orgSlug || !projectName) {
		if (!interactive.isInteractive()) {
			throw new CliError(
				"No project linked in this directory.",
				"Run `beakcrypt link` to connect this directory to a project.",
			);
		}

		// Run interactive linking
		const config = await interactiveLink();
		const envId = await resolveEnvId(config.projectId, flags.env ?? config.defaultEnv);
		return {
			orgId: config.orgId,
			orgSlug: config.orgSlug,
			projectId: config.projectId,
			projectName: config.projectName,
			envName: flags.env ?? config.defaultEnv,
			environmentId: envId,
		};
	}

	const envId = await resolveEnvId(projectId, envName);
	return { orgId, orgSlug, projectId, projectName, envName, environmentId: envId };
}

async function resolveOrgBySlug(slug: string): Promise<string> {
	const result = await query(api.organizations.getBySlug, { slug });
	const org = unwrapResult(result);
	return org._id;
}

async function resolveProjectByName(orgId: string, name: string): Promise<string> {
	const result = await query(api.projects.getByName, {
		orgId: orgId as never,
		name,
	});
	const project = unwrapResult(result);
	return project._id;
}

async function resolveEnvId(projectId: string, envName: string): Promise<string> {
	const result = await query(api.environments.list, {
		projectId: projectId as never,
	});
	const envs = unwrapResult(result);
	const env = envs.find((e: { name: string }) => e.name === envName);
	if (!env) {
		throw new CliError(`Environment "${envName}" not found.`);
	}
	return env._id;
}

export async function interactiveLink(): Promise<ProjectConfig> {
	interactive.requireInteractive("link");

	// Select org
	const orgsResult = await query(api.organizations.list, {});
	const orgs = unwrapResult(orgsResult);

	if (orgs.length === 0) {
		throw new CliError("You don't belong to any organizations.");
	}

	const orgId = await interactive.select({
		message: "Select an organization:",
		choices: orgs.map((o: { _id: string; name: string; slug: string }) => ({
			title: `${o.name} (${o.slug})`,
			value: o._id,
		})),
	});
	const selectedOrg = orgs.find((o: { _id: string }) => o._id === orgId)!;

	// Link or create
	const action = await interactive.select({
		message: "What would you like to do?",
		choices: [
			{ title: "Link to an existing project", value: "link" as const },
			{ title: "Create a new project", value: "create" as const },
		],
	});

	let projectId: string;
	let projectName: string;

	if (action === "create") {
		const name = await interactive.text({
			message: "Enter project name:",
			validate: (v: string) => (v.trim().length > 0 ? true : "Project name is required"),
		});
		const createResult = await mutation(api.projects.create, {
			name: name.trim(),
			orgId: orgId as never,
		});
		const project = unwrapResult(createResult);
		projectId = project._id;
		projectName = project.name;
		output.success(`Created project "${projectName}" in ${selectedOrg.name}`);
	} else {
		const projectsResult = await query(api.projects.list, {
			orgId: orgId as never,
		});
		const projects = unwrapResult(projectsResult);

		if (projects.length === 0) {
			throw new CliError("No projects in this organization. Create one first.");
		}

		projectId = await interactive.select({
			message: "Select a project:",
			choices: projects.map((p: { _id: string; name: string }) => ({
				title: p.name,
				value: p._id,
			})),
		});
		const selectedProject = projects.find((p: { _id: string }) => p._id === projectId)!;
		projectName = selectedProject.name;
	}

	// Select env
	const envsResult = await query(api.environments.list, {
		projectId: projectId as never,
	});
	const envs = unwrapResult(envsResult);
	const sharedEnvs = envs.filter((e: { isPersonal?: boolean }) => !e.isPersonal);

	const defaultEnv = await interactive.select({
		message: "Select a default environment:",
		choices: sharedEnvs.map((e: { _id: string; name: string }) => ({
			title: e.name,
			value: e.name,
		})),
	});

	const config: ProjectConfig = {
		orgId,
		orgSlug: selectedOrg.slug,
		projectId,
		projectName,
		defaultEnv,
	};

	const configDir = await saveProjectConfig(config);
	output.success(`Linked to ${selectedOrg.slug}/${projectName} (${defaultEnv})`);
	output.info(`Created ${configDir}/project.json`);
	output.info(`Added .beakcrypt to .gitignore`);

	return config;
}
