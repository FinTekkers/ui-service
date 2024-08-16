import { createApiKey } from "$lib/database/createAPIkey.server";

export async function POST({ request }) {
    const { userId, usageLimit } = await request.json();

    try {
        const apiKey = await createApiKey(userId, usageLimit);
        return new Response(JSON.stringify({ apiKey }), { status: 200 });
    } catch (error) {
        console.error('Error generating API key:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
