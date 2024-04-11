import { exec } from '../utils/exec';

export const getPhpVersion = async (phpExecutable: string) => await exec(`${phpExecutable} -v`);
