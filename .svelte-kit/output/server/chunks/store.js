import { w as writable } from "./index2.js";
const sideMenuStore = writable(false);
const obrPromptBoolean = writable(true);
const selectedDashboardMenu = writable("home");
const isSignInOrSignUp = writable(false);
const isPasswordVisible = writable(false);
export {
  isPasswordVisible as a,
  selectedDashboardMenu as b,
  isSignInOrSignUp as i,
  obrPromptBoolean as o,
  sideMenuStore as s
};
