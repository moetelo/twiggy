<?php declare(strict_types=1);

namespace Twiggy;

use ArgumentCountError;
use InvalidArgumentException;

class TwigUtils {
	public static function include(string $path) {
		// this is not a complete solution, but should
		// fix very primitive remote code execution
		// techniques, such as loading phar:// files.

		if (str_contains($path, '://'))
			throw new InvalidArgumentException('Primitive check for RCE failed');

		// TODO(zekfad): somehow add checks that realpath($path) is within
		// target workspace, otherwise it's possible to do things like
		// static::include('/etc/passwd')
		return @include($path);
	}

	public static function include_once(string $path) {
		// this is not a complete solution, but should
		// fix very primitive remote code execution
		// techniques, such as loading phar:// files.

		if (str_contains($path, '://'))
			throw new InvalidArgumentException('Primitive check for RCE failed');

		// TODO(zekfad): somehow add checks that realpath($path) is within
		// target workspace, otherwise it's possible to do things like
		// static::include('/etc/passwd')
		return @include_once($path);
	}

	/**
	 * @param string[] $argv Arguments.
	 * @return mixed
	 */
	public static function run(array $argv): mixed {
		if (empty($argv))
			throw new ArgumentCountError("Missing required argument");
		switch ($option = array_shift($argv)) {
			case 'get-env':
				return static::getTwigEnvironment($argv);
			case 'get-type-completions':
				return static::getTypeCompletions($argv);
			case 'get-type-definition':
				return static::getTypeDefinition($argv);
			case 'get-namespace-completions':
				return static::getNamespaceCompletions($argv);
			default:
				throw new InvalidArgumentException("Unknown option $option");
		};
	}

	/**
	 * @param string[] $argv
	 * @return array
	 */
	protected static function getTwigEnvironment(array $argv): array {
		if (count($argv) < 1)
			throw new ArgumentCountError("Missing required argument: framework");
		if (count($argv) < 2)
			throw new ArgumentCountError("Missing required argument: environment");

		$framework = $argv[0];
		$env = $argv[1];
		
		$twig = null;
		switch ($framework) {
			case 'craft':
				define('YII_ENABLE_ERROR_HANDLER', false);
				define('YII_ENABLE_EXCEPTION_HANDLER', false);

				$bootstrap_path = $env . '/bootstrap.php';
				$app_path = $env . '/vendor/craftcms/cms/bootstrap/web.php';

				if (!file_exists($bootstrap_path) || !static::include($bootstrap_path)) {
					throw new \Exception('Failed to load bootstrap.php');
				}
				if (!file_exists($app_path) || !($app = static::include($app_path))) {
					throw new \Exception('Failed to load craftcms/cms/bootstrap/web.php');
				}
				/** @var \craft\web\Application $app */
				$view = $app->getView();
				$twig = $view->getTwig();
				if (!$twig || !($twig instanceof \Twig\Environment))
					throw new InvalidArgumentException("Craft CMS view did not return \Twig\Environment");

				$metadata = Metadata::getTwigMetadata($twig, false);
				$metadata['loader_paths'] = $view->getSiteTemplateRoots();

				return $metadata;
			case 'vanilla':
				$twig = static::include($env);
				if (!$twig || !($twig instanceof \Twig\Environment))
					throw new InvalidArgumentException("Environment file '$env' doesn't return \Twig\Environment or doesn't exist");
				return Metadata::getTwigMetadata($twig, true);
			default:
				throw new \Exception("Support for $framework is not yet implemented. Try using vanilla if applicable instead.");
		}
	}

	/**
	 * @param string[] $argv 
	 * @return array
	 */
	protected static function getTypeDefinition(array $argv): array {
		if (count($argv) < 1)
			throw new ArgumentCountError("Missing required argument: autoloader");
		if (count($argv) < 2)
			throw new ArgumentCountError("Missing required argument: type");

		$loader_file = $argv[0];
		$type = $argv[1];

		return [
			'path' => Reflection::findType($loader_file, $type) ?: null,
		];
	}

	/**
	 * @param string[] $argv 
	 * @return array
	 */
	protected static function getTypeCompletions(array $argv): array {
		if (count($argv) < 1)
			throw new ArgumentCountError("Missing required argument: autoloader");
		if (count($argv) < 2)
			throw new ArgumentCountError("Missing required argument: type");

		$loader_file = $argv[0];
		$type = $argv[1];

		Reflection::tryLoadType($loader_file, $type);
		try {
			return Reflection::getTypeCompletions($type);
		} catch (\ReflectionException $e) {
			// TODO(zekfad): possibly rewrite error for a better UX?
			throw $e;
		}
	}

	/**
	 * @param string[] $argv 
	 * @return array
	 */
	protected static function getNamespaceCompletions(array $argv): array {
		if (count($argv) < 1)
			throw new ArgumentCountError("Missing required argument: autoloader");
		if (count($argv) < 2)
			throw new ArgumentCountError("Missing required argument: namespace");

		$loader_file = $argv[0];
		$namespace = $argv[1];

		return Reflection::getNamespaceCompletions($loader_file, $namespace);
	}
}
