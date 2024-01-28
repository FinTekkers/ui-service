import { r as redirect } from "../../../chunks/index.js";
import * as Yup from "yup";
const signInSchema = Yup.object({
  email: Yup.string().email().required("please enter email"),
  password: Yup.string().required("please enter password")
});
const actions = {
  login: async ({ request }) => {
    let formError = null;
    let isValid = null;
    try {
      const data = await request.formData();
      const email = data.get("Email");
      const password = data.get("Password");
      isValid = await signInSchema.validate({ email, password }, { abortEarly: false });
      if (email && password) {
      }
    } catch (validationError) {
      if (isValidationError(validationError)) {
        const validationErrors = validationError.inner.map((error) => error.message);
        formError = validationErrors;
      } else {
        console.log("error", validationError);
      }
    }
    if (isValid && !formError) {
      throw redirect(303, "/portfolios");
    }
    return { formError };
  }
};
function isValidationError(error) {
  return error?.inner !== void 0;
}
export {
  actions
};
