<?php
require __DIR__ . '/campaign-engine.php';
$fixtures = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$output = [];
foreach ($fixtures as $fixture) $output[] = campaignVerify($fixture['seed'], $fixture['team'], $fixture['inputs'], $fixture['tick']);
echo json_encode($output, JSON_THROW_ON_ERROR);
