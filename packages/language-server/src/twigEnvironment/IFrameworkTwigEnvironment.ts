import { RouteNameToPathRecord, TemplatePathMapping, TwigEnvironment } from './types';

export interface IFrameworkTwigEnvironment {
    get environment(): TwigEnvironment | null;
    get routes(): RouteNameToPathRecord;
    get templateMappings(): TemplatePathMapping[];
}

const defaultPathMappings: TemplatePathMapping[] = [
    { namespace: '', directory: 'templates' },
];

export const EmptyEnvironment: IFrameworkTwigEnvironment = Object.freeze({
    environment: null,
    routes: {},
    templateMappings: defaultPathMappings,
});
