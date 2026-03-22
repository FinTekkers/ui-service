import { redirect, fail } from '@sveltejs/kit';
import { getApiKeyFromCookies, clearApiKeyCookie, setApiKeyCookie, brokerLogin } from '$lib/grpc-auth';

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, cookies }) {
  const user = locals.user;
  const apiKey = getApiKeyFromCookies(cookies) ?? '';

  const profile = {
    email: user?.email ?? '',
    firstname: user?.name?.split(' ')[0] ?? '',
    lastname: user?.name?.split(' ').slice(1).join(' ') ?? '',
  };

  return { profile, apiKey, user };
}

export const actions = {
  logout: async ({ cookies }) => {
    clearApiKeyCookie(cookies);
    cookies.delete('session', { path: '/' });
    throw redirect(303, '/login');
  },

  regenerateKey: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required to regenerate your API key.' });
    }

    const result = await brokerLogin({ email, password });

    if (!result.success || !result.apiKey) {
      return fail(401, { error: result.error ?? 'Login failed. Check your credentials.' });
    }

    setApiKeyCookie(cookies, result.apiKey);
    return { success: true, newKey: result.apiKey };
  },
};
