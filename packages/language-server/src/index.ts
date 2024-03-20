import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { Server } from './server';

const connection = createConnection(ProposedFeatures.all);

console.log = connection.console.log.bind(connection.console);
console.info = connection.console.info.bind(connection.console);
console.error = connection.console.error.bind(connection.console);

new Server(connection);

connection.listen();
