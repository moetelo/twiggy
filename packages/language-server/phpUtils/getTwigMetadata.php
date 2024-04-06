<?php
declare(strict_types=1);

namespace Twiggy;

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
            fn ($acc, $item) => $acc + [$item->getName() => $item->getArguments()],
            [],
        ),
        'filters' => array_reduce(
            $twig->getFilters(),
            fn ($acc, $item) => $acc + [$item->getName() => $item->getArguments()],
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
