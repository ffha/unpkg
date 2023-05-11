import { createServer } from './createServer.js';
console.trace = console.log
const server = createServer();

server.fire();
