<?php
declare(strict_types=1);
require __DIR__.'/community-store.php';
function check(bool $value,string $label): void { if(!$value)throw new RuntimeException($label); }
check(communityText("  Boa\njogada!  ")==='Boa jogada!','normalizes whitespace');
check(communityText('⚽ Tá jogando muito!')==='⚽ Tá jogando muito!','accepts Portuguese and emoji');
foreach(['',str_repeat('á',181),['text'], "\xff"] as $bad) {
    try {communityText($bad);throw new RuntimeException('invalid message accepted');}
    catch(InvalidArgumentException $expected){}
}
check(communityText('<img src=x onerror=alert(1)>')==='<img src=x onerror=alert(1)>','returns text for escaped frontend rendering');
echo "PASS chat text validation.\n";
if (!isset($pdo)) exit(0);
// Integration runs in connection-local temporary tables. No public messages or records are written.
$pdo->exec('CREATE TEMPORARY TABLE game_users (id CHAR(32) PRIMARY KEY,username VARCHAR(20))');
$pdo->exec('CREATE TEMPORARY TABLE game_team_records (user_id CHAR(32),team VARCHAR(20),points INT,score INT,PRIMARY KEY(user_id,team))');
$pdo->exec('CREATE TEMPORARY TABLE game_chat_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id CHAR(32),client_nonce CHAR(36),body VARCHAR(180),created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),UNIQUE KEY(user_id,client_nonce)) DEFAULT CHARSET=utf8mb4');
$a=str_repeat('a',32);$b=str_repeat('b',32);
$pdo->prepare('INSERT INTO game_users VALUES (?,?),(?,?)')->execute([$a,'TesterA',$b,'TesterB']);
communityTeamRecord($pdo,$a,'podpah',1000,20);communityTeamRecord($pdo,$b,'podpah',800,18);
communityTeamRecord($pdo,$a,'capim',1600,30);
communityTeamRecord($pdo,$a,'podpah',1000,20);communityTeamRecord($pdo,$a,'podpah',200,5);
$teams=communityTeams($pdo);
check(count($teams)===10&&$teams[0]['team']==='podpah'&&$teams[0]['points']===1800&&$teams[0]['players']===2,'aggregates everyone without duplicate or lower-score inflation');
communityTeamRecord($pdo,$a,'podpah',1500,27);
check(communityTeams($pdo)[0]['points']===2300,'only improves contribution');
communityTeamRecord($pdo,$b,'fluxo',2500,40);
check(communityTeams($pdo)[0]['team']==='fluxo','new team accepts contributions');
$n='11111111-1111-4111-8111-111111111111';
$one=communityChatWrite($pdo,$a,$n,'Boa jogada!');
$again=communityChatWrite($pdo,$a,$n,'Boa jogada!');
check($one===$again,'retry is idempotent');
try {communityChatWrite($pdo,$a,'22222222-2222-4222-8222-222222222222','Outra');throw new LogicException('rate limit absent');}
catch(RuntimeException $e){check($e->getCode()===429,'rate limited');}
communityChatWrite($pdo,$b,'33333333-3333-4333-8333-333333333333','Valeu!');
$read=communityChatRead($pdo,0);
check(count($read['messages'])===2&&$read['messages'][0]['name']==='TesterA','shared history uses account names');
$next=communityChatRead($pdo,(int)$one['id']);
check(count($next['messages'])===1&&$next['messages'][0]['name']==='TesterB','cursor gets only new messages');
echo "PASS isolated MySQL: team sums, personal bests, chat, deduplication, throttle and cursor.\n";
