<?php
declare(strict_types=1);

namespace Twiggy;

use \Composer\Autoload\ClassLoader;

[, $WORKSPACE_DIR, $INSTANCE_CLASS] = $argv;

/** @var ClassLoader $loader */
$loader = require_once $WORKSPACE_DIR . '/vendor/autoload.php';

if (str_starts_with($INSTANCE_CLASS, '\\')) {
    $INSTANCE_CLASS = substr($INSTANCE_CLASS, strlen('\\'));
}

$refClass = new \ReflectionClass($INSTANCE_CLASS);

$properties = $refClass->getProperties(\ReflectionProperty::IS_PUBLIC);
$methods = $refClass->getMethods(\ReflectionMethod::IS_PUBLIC);

// $parameters = $method->getParameters();
// $method->parameters = [];
// foreach ($parameters as $parameter) {
//     $method->parameters[] = [
//         'name' => $parameter->getName(),
//         'type' => $parameter->getType()?->getName(),
//         'isOptional' => $parameter->isOptional(),
//         'isVariadic' => $parameter->isVariadic(),
//     ];
// }



// add getters to $properties
$completionProperties = [];
$completionMethods = [];
foreach ($methods as $method) {
    if ($method->isConstructor() || $method->isDestructor()) {
        continue;
    }

    $methodName = $method->getName();
    if (str_starts_with($methodName, '__')) {
        continue;
    }

    if (!str_starts_with($methodName, 'get')) {
        continue;
    }

    $propertyName = lcfirst(substr($methodName, 3));
    $completionProperties[] = [
        'name' => $propertyName,
        'type' => $method->getReturnType()?->getName(),
    ];
}

$result = [
    'properties' => $completionProperties,
    'methods' => $completionMethods,
];

echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
