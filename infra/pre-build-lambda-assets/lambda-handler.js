// lambda-handler.js
import { createServer, proxy } from 'aws-serverless-express';
import polka from 'polka';
import { createSvelteHandler } from './handler';

const app = polka().use(createSvelteHandler);
const server = createServer(app.handler);

export const handler = (event, context) => {
  proxy(server, event, context);
};
