<?php declare(strict_types=1);

namespace Twiggy;

class Reflection {
	public const PRIMITIVE_TYPES = [
		'null',
		'bool',
		'true',
		'false',
		'int',
		'float',
		'string',
		'array', // this should require more advanced handing
		'object', // this should require more advanced handing
		'resource',
		'never',
		'void',
		'self',
		'parent',
		'static',
	];

	static public function loadLoader(string $autoloader): \Composer\Autoload\ClassLoader {
		$loader = TwigUtils::include(realpath($autoloader));
		if (!$loader || !($loader instanceof \Composer\Autoload\ClassLoader)) {
			throw new \Exception("Autoloader file '$autoloader' doesn't return \Composer\Autoload\ClassLoader or doesn't exist");
		}
		return $loader;
	}

	static public function findType(string $autoloader, string $type): false|string {
		$loader = static::loadLoader($autoloader);

		// try to load class via loader, otherwise assume that loader script
		// did some magic and loaded class via other ways
		$phpFilePath = $loader->findFile($type);
		if ($phpFilePath)
			return $phpFilePath;

		try {
			return (new \ReflectionClass($type))->getFileName();
		} catch (\ReflectionException) {
			return false;
		}
	}

	static public function tryLoadType(string $autoloader, string $type): void {
		$loader = static::loadLoader($autoloader);

		// try to load class via loader, otherwise assume that loader script
		// did some magic and loaded class via other ways
		$phpFilePath = $loader->findFile($type);
		if ($phpFilePath && !TwigUtils::include($phpFilePath)) {
			throw new \Exception("Class $type is found but cannot be loaded");
		}
	}


	static public function getNamespaceCompletions(string $autoloader, string $namespace): array {
		$loader = static::loadLoader($autoloader);

		echo "COMPL: $namespace" . PHP_EOL;

		$prefixesPsr4ToPaths = $loader->getPrefixesPsr4();
		$prefixesPsr4 = array_keys($prefixesPsr4ToPaths);

		if ($namespace === '\\') {
			return $prefixesPsr4;
		}

		/** @var array<string, true> */
		$classesInNamespace = [];
		// $namespaceFirstPart = '\\' . strtok($namespace, '\\');
		$namespaceFirstPart = strtok($namespace, '\\');

		foreach ($prefixesPsr4 as $prefix) {
			if (!str_starts_with($prefix, $namespaceFirstPart)) {
				continue;
			}

			$dir = $prefixesPsr4ToPaths[$prefix][0];
			$iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));

			foreach ($iterator as $file) {
				if ($file->isDir()) continue;
				if (pathinfo($file->getFilename(), PATHINFO_EXTENSION) === 'php') {
					try {
						// TODO(zekfad): need something better than blindly
						// executing all php scripts in the project
						// this footgun can demolish the face of caller
						// I remember having some rm -rf random_folder
						// in my scripts
						// Probably worse reflection or something like that
						// can help analyze code without it's execution
						// TwigUtils::include_once($file->getPathname());
					} catch (\Throwable) {}
				}
			}

			foreach (get_declared_classes() as $class) {
				if (!str_starts_with($class, $namespace)) {
					continue;
				}

				$classesInNamespace[$class] = true;
			}
		}
		return $classesInNamespace;
	}

	static public function getTypeCompletions(string $type): array {
		if (str_contains($type, '&') || str_contains($type, '(') || str_contains($type, ')')) {
			throw new \Exception("Complex types definitions such as intersection type are not yet supported");
		}

		$completions = [];

		$tok = strtok($type, '|');
		while ($tok !== false) {
			if (!in_array(strtolower($tok), static::PRIMITIVE_TYPES)) {
				$completions = array_merge($completions, static::getClassCompletion($type));
			}
			$tok = strtok('|');
		}
		strtok('', '');

		return $completions;
	}

	protected const GETTER_PREFIX = 'get';

	protected static function getPropertyName(string $getterName): string {
		return lcfirst(
			substr($getterName, strlen(static::GETTER_PREFIX)),
		);
	}

	protected static function typeToString(?\ReflectionType $type): string {
		if (null === $type) {
			return '';
		}

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

		throw new \Exception('Unknown reflection type ' . gettype($type));
	}


	static protected function getClassCompletion(string $type): array {
		$refClass = new \ReflectionClass($type);

		$properties = $refClass->getProperties(\ReflectionProperty::IS_PUBLIC);
		$methods = $refClass->getMethods(\ReflectionMethod::IS_PUBLIC);

		$completionProperties = [];
		$completionMethods = [];

		foreach ($properties as $property) {
			$completionProperties[] = [
				'name' => $property->getName(),
				'type' => static::typeToString($property->getType()),
			];
		}

		foreach ($methods as $method) {
			if ($method->isConstructor() || $method->isDestructor()) {
				continue;
			}

			$methodName = $method->getName();
			// hide magic methods
			if (str_starts_with($methodName, '__')) {
				continue;
			}

			$parameters = $method->getParameters();

			if (str_starts_with($methodName, static::GETTER_PREFIX) && count($parameters) === 0) {
				$completionProperties[] = [
					'name' => static::getPropertyName($methodName),
					'type' => static::typeToString($method->getReturnType()),
				];
			}

			$completionMethods[] = [
				'name' => $methodName,
				'type' => static::typeToString($method->getReturnType()),
				'parameters' => array_map(
					fn(\ReflectionParameter $parameter) => [
						'name' => $parameter->getName(),
						'type' => static::typeToString($parameter->getType()),
						'isOptional' => $parameter->isOptional(),
						'isVariadic' => $parameter->isVariadic(),
					],
					$parameters,
				),
			];
		}

		return [
			'properties' => $completionProperties,
			'methods' => $completionMethods,
		];
	}
}
