import { r as redirect } from "../../../chunks/index.js";
import * as Yup from "yup";
const signInSchema = Yup.object({
  email: Yup.string().email().required("please enter email"),
  password: Yup.string().required("please enter password")
});
const actions = {
  default: async ({ request }) => {
    try {
      const data = await request.formData();
      const email = data.get("Email");
      const password = data.get("Password");
      try {
        const isValid = await signInSchema.validate({ email, password }, { abortEarly: false });
        throw redirect(303, "/portfolios");
      } catch (validationError) {
        if (validationError?.inner) {
          const validationErrors = validationError?.inner.map((error) => error.message);
          return { formError: validationErrors };
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  }
};
export {
  actions
};
