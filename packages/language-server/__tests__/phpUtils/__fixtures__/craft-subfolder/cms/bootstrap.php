<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

// Relative, as in a typical Craft project: must resolve against this dir,
// not the workspace root one level up.
$templatesPath = 'templates';

$siteTemplateRoots = [
    'module' => ['modules/templates'],
    'plugin' => [dirname(__DIR__) . '/plugin-templates'],
];
