<?php
declare(strict_types=1);

namespace Twiggy\Metadata;

function getTwigMetadata(\Twig\Environment $twig, string $framework): array {
    $loaderPathsArray = [];
    if ($framework !== 'craft') {
        $twigLoader = $twig->getLoader();
        $namespaces = $twigLoader->getNamespaces();
        foreach ($namespaces as $namespace) {
            $loaderPathsArray[$namespace] = $twigLoader->getPaths($namespace);
        }
    }

    $globals = $twig->getGlobals();
    $globalsArray = [];
    $emptyArrayObject = new \ArrayObject();
    foreach ($globals as $key => $value) {
        $globalsArray[$key] = is_scalar($value) ? $value : $emptyArrayObject;
    }

    return [
        'functions' => array_reduce(
            $twig->getFunctions(),
            fn ($acc, $item) => $acc + [$item->getName() => \Twiggy\Metadata\getArguments('functions', $item)],
            [],
        ),
        'filters' => array_reduce(
            $twig->getFilters(),
            fn ($acc, $item) => $acc + [$item->getName() => \Twiggy\Metadata\getArguments('filters', $item)],
            [],
        ),
        'tests' => array_values(
            array_map(
                fn ($item) => $item->getName(),
                $twig->getTests(),
            ),
        ),
        'globals' => $globalsArray,
        'loader_paths' => $loaderPathsArray,
    ];
}

// https://github.com/symfony/twig-bridge/blob/1d5745dac2e043553177a3b88a76b99c2a2f6c2e/Command/DebugCommand.php#L305-L361
function getArguments(string $type, \Twig\TwigFunction|\Twig\TwigFilter $entity): mixed {
    $cb = $entity->getCallable();
    if (null === $cb) {
        return null;
    }
    if (\is_array($cb)) {
        if (!method_exists($cb[0], $cb[1])) {
            return null;
        }
        $refl = new \ReflectionMethod($cb[0], $cb[1]);
    } elseif (\is_object($cb) && method_exists($cb, '__invoke')) {
        $refl = new \ReflectionMethod($cb, '__invoke');
    } elseif (\function_exists($cb)) {
        $refl = new \ReflectionFunction($cb);
    } elseif (\is_string($cb) && preg_match('{^(.+)::(.+)$}', $cb, $m) && method_exists($m[1], $m[2])) {
        $refl = new \ReflectionMethod($m[1], $m[2]);
    } else {
        throw new \UnexpectedValueException('Unsupported callback type.');
    }

    $args = $refl->getParameters();

    // filter out context/environment args
    if ($entity->needsEnvironment()) {
        array_shift($args);
    }
    if ($entity->needsContext()) {
        array_shift($args);
    }

    if ('filters' === $type) {
        // remove the value the filter is applied on
        array_shift($args);
    }

    // format args
    $args = array_map(function (\ReflectionParameter $param) {
        if ($param->isDefaultValueAvailable()) {
            return $param->getName().' = '.json_encode($param->getDefaultValue());
        }

        return $param->getName();
    }, $args);

    return $args;
}
