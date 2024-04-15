<?php
declare(strict_types=1);

namespace Twiggy;

use \Composer\Autoload\ClassLoader;

[, $WORKSPACE_DIR, $CLASS_PSR4] = $argv;

/** @var ClassLoader $loader */
$loader = require_once $WORKSPACE_DIR . '/vendor/autoload.php';

if (str_starts_with($CLASS_PSR4, '\\')) {
    $CLASS_PSR4 = substr($CLASS_PSR4, strlen('\\'));
}

$filePath = $loader->findFile($CLASS_PSR4) ?: null;

$result = [
    'path' => $filePath,
];

echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
