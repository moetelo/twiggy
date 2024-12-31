<?php

ob_start();
require_once 'vendor/autoload.php';

$stderr = fopen('php://stderr', 'w');
try {
	array_shift($argv); // skip script name
	try {
		$result = [
			'error' => false,
			'result' => \Twiggy\TwigUtils::run($argv),
		];
	} catch (\Throwable $e) {
		$result = [
			'error' => true,
			'message' => $e->getMessage(),
		];
		fwrite($stderr, $e);
	}
	// direct stdout to stderr, so custom code wont mess up with JSON output
	$stdout = ob_get_clean();
	if ($stdout)
		fwrite($stderr, $stdout);
	echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
} finally {
	fclose($stderr);
}
