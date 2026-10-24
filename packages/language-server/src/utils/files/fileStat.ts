import type { Stats } from 'node:fs';
import { stat } from 'node:fs/promises';

export const fileStat = async (fsPath: string): Promise<Stats | null> => {
    try {
        return await stat(fsPath);
    } catch {
        return null;
    }
};

export const isFile = async (fsPath: string): Promise<boolean> => {
    const stats = await fileStat(fsPath);
    return stats?.isFile() ?? false;
};
