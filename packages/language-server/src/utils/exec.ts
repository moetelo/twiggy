import { spawn, SpawnOptionsWithoutStdio } from 'node:child_process';

export type CommandResult = { stdout: string, stderr: string, code: number | null };

export const exec = async (command: string, args: string[], options: SpawnOptionsWithoutStdio = {}): Promise<CommandResult> => {
    return new Promise<CommandResult>(resolve => {
        const child = spawn(command, args, options);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => stdout += data);
        child.stderr.on('data', (data) => stderr += data);

        child.on('close', (code) => resolve({ stdout, stderr, code }));
    });
};

export const isProcessError = (error: any): error is Error & CommandResult => {
    return error instanceof Error && 'stderr' in error && 'stdout' in error;
};
