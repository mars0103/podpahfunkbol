<?php
declare(strict_types=1);
require __DIR__ . '/juggle-engine.php';
$fixtures = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$results = [];
foreach ($fixtures as $fixture) {
    try { $results[] = juggleVerify($fixture['seed'], $fixture['inputs']); }
    catch (InvalidArgumentException $error) { $results[] = ['invalid' => true]; }
}
echo json_encode($results, JSON_THROW_ON_ERROR);
