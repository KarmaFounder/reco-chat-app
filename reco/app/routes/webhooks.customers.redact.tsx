import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    // Payload contains customer ID to redact
    console.log(`Received ${topic} webhook for ${shop}`);
    console.log(JSON.stringify(payload, null, 2));

    return new Response();
};
