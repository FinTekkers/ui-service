import "../../chunks/index.js";
import * as Yup from "yup";
Yup.object({
  searchQuery: Yup.string().min(3, "please enter a word").required("please enter text")
});
const actions = {
  search: async ({ request }) => {
    try {
      const data = await request.formData();
      const searchQuery = data.get("search");
      console.log("search query", searchQuery);
    } catch (error) {
      console.log("something went wrong", error);
    }
  }
};
export {
  actions
};
