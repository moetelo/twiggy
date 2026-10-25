import type { IFrameworkTwigEnvironment } from './IFrameworkTwigEnvironment';
import type { TemplatePathMapping } from './types';

/**
 * Decorates a framework environment with extra template mappings.
 * They come first, so they take precedence over the framework's own mappings.
 * @param frameworkEnvironment The environment to delegate to.
 * @param mappings Mappings to check before the framework's.
 * @returns The framework environment itself when there is nothing to add.
 */
export function withTemplateMappings(
    frameworkEnvironment: IFrameworkTwigEnvironment,
    mappings: TemplatePathMapping[],
): IFrameworkTwigEnvironment {
    if (mappings.length === 0) return frameworkEnvironment;

    return {
        get environment() {
            return frameworkEnvironment.environment;
        },
        get routes() {
            return frameworkEnvironment.routes;
        },
        get templateMappings() {
            return [...mappings, ...frameworkEnvironment.templateMappings];
        },
    };
}
