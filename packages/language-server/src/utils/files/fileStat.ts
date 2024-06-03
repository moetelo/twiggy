import { Stats } from 'fs';
import { stat } from 'fs/promises';

export const fileStat = (fsPath: string): Promise<Stats | null> => stat(fsPath).catch(() => null);

export const isFile = async (fsPath: string): Promise<boolean> => {
    const stats = await fileStat(fsPath);
    return stats !== null && stats.isFile();
};
