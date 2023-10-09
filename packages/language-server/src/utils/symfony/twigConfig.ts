import { DockerComposeExecCommand, parseDockerComposeExecCommand } from '../../utils/docker/command';
import { getVolumeBindingsForService } from '../../utils/docker/config';
import { exec } from '../../utils/exec';

type TwigConfig = {
    default_path: string;
    paths: Record<string, string>;
};

type TemplateNamespace = `@${string}` | '';

export type TemplatePathMapping = {
    directory: string;
    namespace: TemplateNamespace;
};

const aliasToNamespace = (alias: string): TemplateNamespace => {
    return alias === null ? '' : `@${alias}`;
};

export async function getTemplatePathMappingsFromSymfony(phpBinConsoleCommand: string): Promise<TemplatePathMapping[]> {
    const command = phpBinConsoleCommand + ' debug:config twig --format json';
    const { stdout, stderr } = await exec(command).catch((err) => err);

    if (stderr && !stdout) {
        console.error(command);
        return [];
    }

    const json = JSON.parse(stdout);
    const twigConfig: TwigConfig = json.twig;

    const dockerComposeCommandParsed = parseDockerComposeExecCommand(phpBinConsoleCommand as DockerComposeExecCommand<string>);

    if (!dockerComposeCommandParsed) {
        // Paths in twig config are real and point to the user's fs.
        const mappings = Object.entries(twigConfig.paths).map(
            ([directory, alias]): TemplatePathMapping => ({
                directory,
                namespace: aliasToNamespace(alias),
            }),
        );

        return [...mappings, { directory: twigConfig.default_path, namespace: '' }];
    }

    // Paths in twig config are bound to the user's fs via docker compose volumes.
    // We need to convert them into real paths.

    const { dockerComposeCommandPart, service } = dockerComposeCommandParsed;
    const bindings = await getVolumeBindingsForService(dockerComposeCommandPart, service);

    const convertAllBindings = (path: string) => {
        return bindings.reduce((path, { source, target }) => path.replace(target, source), path);
    };

    const mappings = Object.entries(twigConfig.paths).map(
        ([directory, alias]): TemplatePathMapping => ({
            directory: convertAllBindings(directory),
            namespace: aliasToNamespace(alias),
        }),
    );

    return [...mappings, { directory: convertAllBindings(twigConfig.default_path), namespace: '' }];
}
