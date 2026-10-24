import type { Stats } from 'node:fs';
import { stat } from 'node:fs/promises';

export const fileStat = async (fsPath: string): Promise<Stats | null> => stat(fsPath).catch(() => null);

export const isFile = async (fsPath: string): Promise<boolean> => {
    const stats = await fileStat(fsPath);
    return stats !== null && stats.isFile();
};
