import { w as writable } from "./index2.js";
const sideMenuStore = writable(false);
const currentMenu = writable("home");
const isSignInOrSignUp = writable(false);
export {
  currentMenu as c,
  isSignInOrSignUp as i,
  sideMenuStore as s
};
