import { EmptyEnvironment, IFrameworkTwigEnvironment } from '../src/twigEnvironment/IFrameworkTwigEnvironment';

export const MockEnvironment: IFrameworkTwigEnvironment = {
    ...EmptyEnvironment,
    templateMappings: [ { namespace: '', directory: '' }],
};
