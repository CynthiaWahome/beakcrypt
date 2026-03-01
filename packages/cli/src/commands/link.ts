import { ensureAuth, interactiveLink } from "../lib/context";
import { ensureOrgKey } from "../lib/key-manager";

export async function linkCommand(): Promise<void> {
  await ensureAuth();
  const config = await interactiveLink();
  await ensureOrgKey(config.orgId);
}
