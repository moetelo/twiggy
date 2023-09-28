import { glob } from 'glob';

export default function getTwigFiles(dir: string) {
    return glob(`${dir}/**/*.twig`, { nodir: true });
}
