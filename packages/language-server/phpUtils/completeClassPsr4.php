<?php
declare(strict_types=1);

namespace Twiggy;

use \Composer\Autoload\ClassLoader;

[, $WORKSPACE_DIR, $NAMESPACE_PSR4] = $argv;

/** @var ClassLoader $loader */
$loader = require_once $WORKSPACE_DIR . '/vendor/autoload.php';

if (str_starts_with($NAMESPACE_PSR4, '\\')) {
    $NAMESPACE_PSR4 = substr($NAMESPACE_PSR4, strlen('\\'));
}

$prefixesPsr4ToPaths = $loader->getPrefixesPsr4();
$prefixesPsr4 = array_keys($prefixesPsr4ToPaths);

if (!$NAMESPACE_PSR4) {
    echo json_encode($prefixesPsr4, JSON_PRETTY_PRINT) . PHP_EOL;
    exit(0);
}

/** @var array<string, true> $classesInNamespace */
$classesInNamespace = [];
$namespaceFirstPart = explode('\\', $NAMESPACE_PSR4)[0];

foreach ($prefixesPsr4 as $prefix) {
    if (!str_starts_with($prefix, $namespaceFirstPart)) {
        continue;
    }

    $dir = $prefixesPsr4ToPaths[$prefix][0];
    $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));

    foreach ($iterator as $file) {
        if ($file->isDir()) continue;
        if (pathinfo($file->getFilename(), PATHINFO_EXTENSION) === 'php') {
            include_once $file->getPathname();
        }
    }

    foreach (get_declared_classes() as $class) {
        if (!str_starts_with($class, $NAMESPACE_PSR4)) {
            continue;
        }

        $classesInNamespace[$class] = true;
    }
}

echo json_encode(array_keys($classesInNamespace), JSON_PRETTY_PRINT) . PHP_EOL;
