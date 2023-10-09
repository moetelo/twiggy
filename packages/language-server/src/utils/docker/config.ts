import { exec } from '../exec';
import { DockerComposeCommandPart } from './command';

export type DockerComposeVolume = {
    source: string;
    target: string;
};

type DockerComposeServiceConfig = {
    volumes: (DockerComposeVolume & { type: 'bind' | 'volume' | 'tmpfs' })[];
};

export async function getVolumeBindingsForService(dockerComposeCommand: DockerComposeCommandPart, serviceName: string): Promise<DockerComposeVolume[]> {
    const { stdout, stderr } = await exec(`${dockerComposeCommand} config --format json`).catch((err) => err);

    if (stderr) {
        return [];
    }

    const services: Record<string, DockerComposeServiceConfig> = JSON.parse(stdout).services;
    const bindings = services[serviceName].volumes
        .filter(v => v.type === 'bind')
        .map(({ source, target }) => ({ source, target }));

    return bindings;
}
