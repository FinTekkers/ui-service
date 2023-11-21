import { w as writable } from "./index.js";
const portfolioStore = writable([]);
const currentMenu = writable("home");
export {
  currentMenu as c,
  portfolioStore as p
};
