export type DockerComposeCommandPart = 'docker-compose' | 'docker compose';

type DockerComposeExecParsed<TService extends string> = {
    dockerComposeCommandPart: DockerComposeCommandPart;
    service: TService;
};

export type DockerComposeExecCommand<TService extends string> = `${DockerComposeCommandPart} exec ${TService} ${string}`;

/** Parses docker compose command.
 * @example 'docker compose exec php bin/console' => { command: 'docker compose', service: 'php' }
 */
export function parseDockerComposeExecCommand<TService extends string>(
    cmd: DockerComposeExecCommand<TService>,
): DockerComposeExecParsed<TService> | undefined {
    const dockerComposeRegex =
        /(?<command>docker(?:\s+|-)compose)\s+exec\s+((?:-\S+\s+)*)(?<service>\S+)/;

    const match = cmd.match(dockerComposeRegex);

    if (!match) {
        return undefined;
    }

    const { command, service } = match.groups!;

    return {
        dockerComposeCommandPart: command as DockerComposeCommandPart,
        service: service as TService,
    };
}
