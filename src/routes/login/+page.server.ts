import { redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { superValidate } from 'sveltekit-superforms/server';
import { yup } from 'sveltekit-superforms/adapters';
import { brokerLogin, setApiKeyCookie } from '$lib/grpc-auth';

const DASHBOARD_ROUTE = "/data/portfolios";

const signInSchema = Yup.object({
    email: Yup.string().email().required('Email is required'),
    password: Yup.string().required('Password is required'),
});

export const actions = {
    login: async ({ request, cookies, url }) => {
        const form = await superValidate(request, yup(signInSchema));

        if (!form.valid) {
            return { formError: { message: 'Please fix the errors below' }, errors: form.errors };
        }

        const result = await brokerLogin({
            email: form.data.email,
            password: form.data.password,
        });

        if (!result.success) {
            return { formError: { message: result.error ?? 'Login failed' } };
        }

        // Store API key in secure httpOnly cookie
        if (result.apiKey) {
            setApiKeyCookie(cookies, result.apiKey);
        }

        // Redirect to the page they were trying to access, or dashboard
        const redirectTo = url.searchParams.get('redirectTo') ?? DASHBOARD_ROUTE;
        throw redirect(303, redirectTo);
    }
};
