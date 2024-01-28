import { createServer, proxy } from 'aws-serverless-express';
import polka from 'polka';
import express from 'express';

import { handler as svelteHandler } from './handler';

const app = express().use(svelteHandler);
const server = createServer(app.handler);

export const handler = (event, context) => {
	proxy(server, event, context);
};