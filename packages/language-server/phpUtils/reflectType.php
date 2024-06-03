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

$phpFilePath = $loader->findFile($INSTANCE_CLASS);
require_once $phpFilePath;

$refClass = new \ReflectionClass($INSTANCE_CLASS);

$properties = $refClass->getProperties(\ReflectionProperty::IS_PUBLIC);
$methods = $refClass->getMethods(\ReflectionMethod::IS_PUBLIC);

const GETTER_PREFIX = 'get';
function getPropertyName(string $getterName): string {
    return lcfirst(
        substr($getterName, strlen(GETTER_PREFIX)),
    );
}

function typeToString(\ReflectionType $type): string {
    if ($type instanceof \ReflectionNamedType) {
        return $type->getName();
    }

    if ($type instanceof \ReflectionUnionType) {
        return implode('|', array_map(
            fn(\ReflectionNamedType $type) => $type->getName(),
            $type->getTypes(),
        ));
    }

    if ($type instanceof \ReflectionIntersectionType) {
        return implode('&', array_map(
            fn(\ReflectionNamedType $type) => $type->getName(),
            $type->getTypes(),
        ));
    }

    throw new \RuntimeException('Unknown type');
}

$completionProperties = [];
$completionMethods = [];
/** @var \ReflectionMethod $method */
foreach ($methods as $method) {
    if ($method->isConstructor() || $method->isDestructor()) {
        continue;
    }

    $methodName = $method->getName();
    if (str_starts_with($methodName, '__')) {
        continue;
    }

    $parameters = $method->getParameters();

    if (str_starts_with($methodName, GETTER_PREFIX) && count($parameters) === 0) {
        $propertyName = getPropertyName($methodName);
        $completionProperties[] = [
            'name' => $propertyName,
            'type' => $method->getReturnType()?->getName() ?? '',
        ];
    }

    $completionMethods[] = [
        'name' => $methodName,
        'type' => $method->hasReturnType() ? typeToString($method->getReturnType()) : '',
        'parameters' => array_map(
            fn(\ReflectionParameter $parameter) => [
                'name' => $parameter->getName(),
                'type' => $parameter->hasType() ? typeToString($parameter->getType()) : '',
                'isOptional' => $parameter->isOptional(),
                'isVariadic' => $parameter->isVariadic(),
            ],
            $parameters,
        ),
    ];
}

$result = [
    'properties' => $completionProperties,
    'methods' => $completionMethods,
];

echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
