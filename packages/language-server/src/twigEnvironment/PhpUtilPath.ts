import path from 'node:path';

export const PhpUtilPath = {
    getCraftTwig: path.resolve(__dirname, './phpUtils/printCraftTwigEnvironment.php'),
    printTwigEnvironment: path.resolve(__dirname, './phpUtils/printTwigEnvironment.php'),
    getDefinitionPhp: path.resolve(__dirname, './phpUtils/definitionClassPsr4.php'),
    getCompletionPhp: path.resolve(__dirname, './phpUtils/completeClassPsr4.php'),
    reflectType: path.resolve(__dirname, './phpUtils/reflectType.php'),
} as const;
