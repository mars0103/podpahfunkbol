<?php
require __DIR__.'/php/football-engine.php';
$cases=json_decode(stream_get_contents(STDIN),true);$out=[];
foreach($cases as $case)$out[]=campaignVerify($case['seed'],$case['team'],$case['inputs'],$case['tick']);
echo json_encode($out);
