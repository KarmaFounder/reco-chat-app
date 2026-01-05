import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { uninstallStoreFromConvex } from "../convex.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Mark the store as uninstalled in Convex
  try {
    await uninstallStoreFromConvex(shop);
    console.log(`[Convex] Marked ${shop} as uninstalled`);
  } catch (error) {
    console.error(`[Convex] Failed to uninstall ${shop}:`, error);
  }

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  return new Response();
};
