import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allowed HTTP methods
      'Access-Control-Allow-Credentials': 'true', // Allow credentials
      'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Allowed headers
    }
  }
});
