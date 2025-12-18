import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    if (!admin) {
        // The admin context isn't returned if the webhook fired after a shop was uninstalled.
        throw new Response();
    }

    console.log(`Received ${topic} webhook for ${shop}`);
    console.log(JSON.stringify(payload, null, 2));

    return new Response();
};
