import path from 'node:path';

export const PhpUtilPath = {
    utilsPhar: path.resolve(__dirname, './phpUtils/twiggy-php-utils.phar'),
} as const;
