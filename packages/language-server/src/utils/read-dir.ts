import { readdir } from 'fs/promises';
import { join } from 'path';

export default async function* readDir(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const childPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* readDir(childPath);
    } else {
      yield childPath;
    }
  }
}
