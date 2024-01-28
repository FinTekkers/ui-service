// handler.js
import express from 'express';

const app = express();

// Define your Svelte application routes or middleware here
app.use(express.static('public')); // Example: serving static files from a 'public' folder

// Your Svelte app might have additional middleware or routes

export const handler = app;
