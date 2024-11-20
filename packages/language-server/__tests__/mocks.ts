import { IPhpExecutor } from '../src/phpInterop/IPhpExecutor';
import { ReflectedType } from '../src/phpInterop/ReflectedType';
import { EmptyEnvironment, IFrameworkTwigEnvironment } from '../src/twigEnvironment/IFrameworkTwigEnvironment';

export const MockEnvironment: IFrameworkTwigEnvironment = {
    ...EmptyEnvironment,
    templateMappings: [ { namespace: '', directory: '' }],
};

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

    call(command: string, args: string[]): Promise<{ stdout: string; stderr: string; } | null> {
        throw new Error('Method not implemented.');
    }

    callJson<TResult>(command: string, args: string[]): Promise<TResult | null> {
        throw new Error('Method not implemented.');
    }

    getClassDefinition(className: string): Promise<{ path: string | null; } | null> {
        throw new Error('Method not implemented.');
    }

    getClassCompletion(className: string): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    reflectType(className: string): Promise<ReflectedType | null> {
        if (className.startsWith('\\')) {
            className = className.slice(1);
        }

        return Promise.resolve(MockPhpExecutor.classMap[className] || null);
    }
}
