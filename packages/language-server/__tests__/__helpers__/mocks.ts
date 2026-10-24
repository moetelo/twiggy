import { PassThrough } from 'node:stream';
import type { Connection } from 'vscode-languageserver';
import { createConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-languageserver/node';
import type { IPhpExecutor } from 'phpInterop/IPhpExecutor';
import type { ReflectedType } from 'phpInterop/ReflectedType';
import type { IFrameworkTwigEnvironment } from 'twigEnvironment/IFrameworkTwigEnvironment';
import { EmptyEnvironment } from 'twigEnvironment/IFrameworkTwigEnvironment';

export const MockEnvironment: IFrameworkTwigEnvironment = {
    ...EmptyEnvironment,
    templateMappings: [ { namespace: '', directory: '' }],
};

/**
 * A real `Connection` over in-memory streams, for tests that need one but do
 * not exercise it. Nothing reads the output stream; override the methods a
 * test observes instead of sending through it.
 * @returns A connection that is never listened on.
 */
export const createNullConnection = (): Connection => createConnection(
    new StreamMessageReader(new PassThrough()),
    new StreamMessageWriter(new PassThrough()),
);

export class MockPhpExecutor implements IPhpExecutor {
    static classMap: Record<string, ReflectedType> = {
        'App\\SomeClass': {
            properties: [],
            methods: [
                {
                    name: 'getPerson',
                    type: 'App\\Person',
                    parameters: [],
                },
            ],
        },
        'App\\Person': {
            properties: [
                {
                    name: 'name',
                    type: 'string',
                },
                {
                    name: 'age',
                    type: 'int',
                },
            ],
            methods: [
                {
                    name: 'getParent',
                    type: 'App\\Person',
                    parameters: [],
                },
                {
                    name: 'getOtherClass',
                    type: 'App\\OtherClass',
                    parameters: [],
                },
            ],
        },
        'App\\OtherClass': {
            properties: [
                {
                    name: 'prop',
                    type: 'int',
                }
            ],
            methods: [],
        },
    };

    async call(_command: string, _args: string[]): Promise<{ stdout: string; stderr: string; } | null> {
        throw new Error('Method not implemented.');
    }

    async callJson<TResult>(_command: string, _args: string[]): Promise<TResult | null> {
        throw new Error('Method not implemented.');
    }

    async getClassDefinition(_className: string): Promise<{ path: string | null; } | null> {
        throw new Error('Method not implemented.');
    }

    async getClassCompletion(_className: string): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    async reflectType(className: string): Promise<ReflectedType | null> {
        const name = className.startsWith('\\') ? className.slice(1) : className;

        return name in MockPhpExecutor.classMap ? MockPhpExecutor.classMap[name] : null;
    }
}
