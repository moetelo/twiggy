import { Server } from '../server';
import { GlobalVariables } from './global-variables';

export class Hovers {
  constructor(server: Server) {
    new GlobalVariables(server);
  }
}
