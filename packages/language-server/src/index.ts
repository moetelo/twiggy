import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { Server } from './server';

const connection = createConnection(ProposedFeatures.all);

new Server(connection);

connection.listen();
