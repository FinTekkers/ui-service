import express from 'express';

const createSvelteHandler = () => {
  const app = express();

  // Define your Svelte application routes or middleware here
  app.use(express.static('public')); // Example: serving static files from a 'public' folder

  // Your Svelte app might have additional middleware or routes

  return app;
};

export const handler = async (event, context) => {
  const app = createSvelteHandler();

  // To handle HTTP requests in a Lambda function
  const result = await new Promise((resolve, reject) => {
    const callback = (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    };

    // Process the event (HTTP request) using the Express app
    app(event, context, callback);
  });

  return result;
};


