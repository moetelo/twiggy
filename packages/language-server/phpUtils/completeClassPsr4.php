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

$classesInNamespace = [];
$namespaceFirstPart = explode('\\', $NAMESPACE_PSR4)[0];

foreach (array_keys($loader->getPrefixesPsr4()) as $prefix) {
    if (!str_starts_with($prefix, $namespaceFirstPart)) {
        continue;
    }

    $dir = $loader->getPrefixesPsr4()[$prefix][0];
    $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));

    foreach ($iterator as $file) {
        if ($file->isDir()) continue;
        if (pathinfo($file->getFilename(), PATHINFO_EXTENSION) === 'php') {
            include_once $file->getPathname();
        }
    }

    $classes = get_declared_classes();
    $inNamespacePrefix = array_filter($classes, fn($class) => str_starts_with($class, $NAMESPACE_PSR4));
    array_push($classesInNamespace, ...$inNamespacePrefix);
}

echo json_encode($classesInNamespace, JSON_PRETTY_PRINT) . PHP_EOL;
