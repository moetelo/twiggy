export const PhpUtilPath = {
    getCraftTwig: require.resolve('./phpUtils/printCraftTwigEnvironment.php'),
    printTwigEnvironment: require.resolve('./phpUtils/printTwigEnvironment.php'),
    getDefinitionPhp: require.resolve('./phpUtils/definitionClassPsr4.php'),
    getCompletionPhp: require.resolve('./phpUtils/completeClassPsr4.php'),
    reflectType: require.resolve('./phpUtils/reflectType.php'),
} as const;
