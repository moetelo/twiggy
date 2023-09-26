export * from './types';

import { promisify } from 'node:util';
import { parseSections } from './parse-sections';

const exec: (cmd: string) => Promise<{ stdout: string, stderr: string }> = promisify(require('node:child_process').exec);

export const getSectionsFromPhpDebugTwig = async (debugTwigCommand: string) => {
  const { stdout, stderr } = await exec(debugTwigCommand).catch((err) => err);

  if (stderr) {
    return undefined;
  }

  return parseSections(stdout);
};
