import type { Logger } from "@operatoros/core";

/**
 * The context every service call runs in. Assembled at the edge (route handler /
 * gateway) from the authenticated caller, and threaded through the service so that
 * authorization, tenant scoping, and logging are explicit — never ambient globals.
 */
export interface ServiceContext {
  organizationId: string;
  actorUserId: string;
  permissions: Set<string>;
  logger: Logger;
}
