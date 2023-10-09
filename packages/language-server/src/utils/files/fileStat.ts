import { Stats } from 'fs';
import { stat } from 'fs/promises';

export const fileStat = (fsPath: string): Promise<Stats | null> => stat(fsPath).catch(() => null);
