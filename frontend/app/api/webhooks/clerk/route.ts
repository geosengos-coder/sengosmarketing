import { Webhook } from "svix";
import { withSystem } from "@operatoros/database";
import { env } from "@/env";

/**
 * Clerk -> DB user sync. Because our DB is authoritative for organizations/roles
 * (ADR-0009) but Clerk owns authentication, we mirror the Clerk *user* into our
 * `User` table so memberships can foreign-key to a local identity.
 *
 * Verifies the svix signature; runs under systemContext() because user upserts
 * are a privileged, cross-tenant platform operation.
 */
type ClerkEmail = { id: string; email_address: string };
type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
};
type ClerkEvent = { type: string; data: ClerkUserData };

function primaryEmail(data: ClerkUserData): string | undefined {
  const list = data.email_addresses ?? [];
  const primary = list.find((e) => e.id === data.primary_email_address_id) ?? list[0];
  return primary?.email_address;
}

export async function POST(req: Request): Promise<Response> {
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: ClerkEvent;
  try {
    const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);
    event = wh.verify(payload, headers) as ClerkEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const data = event.data;

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const email = primaryEmail(data);
      if (!email) return new Response("No email on user", { status: 202 });
      await withSystem((db) =>
        db.user.upsert({
          where: { clerkUserId: data.id },
          create: {
            clerkUserId: data.id,
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
          },
          update: {
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            imageUrl: data.image_url ?? null,
          },
        }),
      );
      break;
    }
    case "user.deleted": {
      await withSystem((db) => db.user.deleteMany({ where: { clerkUserId: data.id } }));
      break;
    }
    default:
      // Ignore unrelated events.
      break;
  }

  return new Response("ok", { status: 200 });
}
