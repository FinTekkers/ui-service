import { redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { superValidate } from 'sveltekit-superforms/server';
import { yup } from 'sveltekit-superforms/adapters';
import { brokerRegister, brokerLogin, setApiKeyCookie } from '$lib/grpc-auth';

const DASHBOARD_ROUTE = "/data/portfolios";

const signUpSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmpassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
    firstname: Yup.string(),
    lastname: Yup.string(),
    signupcode: Yup.string().required('Sign-up code is required'),
});

export const actions = {
    register: async ({ request, cookies, url }) => {
        const form = await superValidate(request, yup(signUpSchema));

        if (!form.valid) {
            return { formError: { message: 'Please fix the errors below' }, errors: form.errors };
        }

        const name = [form.data.firstname, form.data.lastname].filter(Boolean).join(' ');

        const result = await brokerRegister({
            email: form.data.email,
            password: form.data.password,
            name,
            signupCode: form.data.signupcode,
        });

        if (!result.success) {
            return { formError: { message: result.error ?? 'Registration failed' } };
        }

        // Auto-login after successful registration
        const loginResult = await brokerLogin({
            email: form.data.email,
            password: form.data.password,
        });

        if (loginResult.success && loginResult.apiKey) {
            setApiKeyCookie(cookies, loginResult.apiKey);
            const redirectTo = url.searchParams.get('redirectTo') ?? DASHBOARD_ROUTE;
            throw redirect(303, redirectTo);
        }

        // If auto-login fails, fall back to login page with success message
        throw redirect(303, '/login?registered=true');
    }
};
