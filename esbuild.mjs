import * as esbuild from 'esbuild';
import { readdir } from 'fs/promises';
import { join } from 'path';

await esbuild.build({
  entryPoints: await walk('src'),
  bundle: false,
  outdir: 'out',
  platform: 'node',
});

async function walk(dirPath) {
  return Promise.all(
    await readdir(dirPath, { withFileTypes: true }).then((entries) =>
      entries.map((entry) => {
        const childPath = join(dirPath, entry.name);
        return entry.isDirectory() ? walk(childPath) : childPath;
      })
    )
  ).then((allFiles) => allFiles.flat(Number.POSITIVE_INFINITY));
}
