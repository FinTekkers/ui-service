import type  Yup from 'yup';



// custom redirect
export const goto = (url: string) => (window.location.href = url);

export function isValidationError(error: unknown): error is Yup.ValidationError {
    return (error as Yup.ValidationError)?.inner !== undefined;
}

