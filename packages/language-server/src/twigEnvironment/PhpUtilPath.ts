import path from 'node:path';

export type PhpUtilPathTable = Readonly<{
    getCraftTwig: string;
    printTwigEnvironment: string;
    getDefinitionPhp: string;
    getCompletionPhp: string;
    reflectType: string;
}>;

export const PhpUtilPath: PhpUtilPathTable = {
    getCraftTwig: path.resolve(__dirname, './phpUtils/printCraftTwigEnvironment.php'),
    printTwigEnvironment: path.resolve(__dirname, './phpUtils/printTwigEnvironment.php'),
    getDefinitionPhp: path.resolve(__dirname, './phpUtils/definitionClassPsr4.php'),
    getCompletionPhp: path.resolve(__dirname, './phpUtils/completeClassPsr4.php'),
    reflectType: path.resolve(__dirname, './phpUtils/reflectType.php'),
};
