import { Dirent } from 'fs';
import fs from 'fs/promises';
import path from 'path';

const getFullPath = (dir: string, file: Dirent) => path.join(dir, file.name);

export default async function getTwigFiles(dir: string) {
    const dirFiles = await fs.readdir(dir, { withFileTypes: true });

    const twigFiles: string[] = [];
    for (const file of dirFiles) {
        if (file.isDirectory()) {
            const subdirTwigFiles = await getTwigFiles(getFullPath(dir, file));
            twigFiles.push(...subdirTwigFiles);
            continue;
        }

        if (file.name.endsWith('.twig')) {
            twigFiles.push(getFullPath(dir, file));
        }
    }

    return twigFiles;
}
