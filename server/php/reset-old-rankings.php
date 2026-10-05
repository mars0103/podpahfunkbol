<?php
// CLI only, deployed to the private release directory, never the public API.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {http_response_code(404);exit;}
require '/home/marsdes1/public_html/podpahfunkbol/api/config.php';
$marker=__DIR__.'/old-rankings-reset.done';
if(file_exists($marker)){echo "Old rankings already reset.\n";exit;}
$tables=$pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
$backup=[];
foreach(['game_records','game_campaign_records','game_team_records'] as $table){
 if(in_array($table,$tables,true))$backup[$table]=$pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
}
$path=__DIR__.'/old-rankings-before.json';
if(!file_exists($path)){file_put_contents($path,json_encode($backup,JSON_THROW_ON_ERROR));chmod($path,0600);}
$pdo->beginTransaction();
try {
 // Wait for in-flight old score submissions, and invalidate remaining old sessions.
 if(in_array('game_sessions',$tables,true))$pdo->exec('UPDATE game_sessions SET consumed=1 WHERE consumed=0');
 if(in_array('game_campaign_runs',$tables,true))$pdo->exec("UPDATE game_campaign_runs SET status='abandoned' WHERE status='active'");
 foreach(array_keys($backup) as $table)$pdo->exec("DELETE FROM `$table`");
 $pdo->commit();
 file_put_contents($marker,date(DATE_ATOM));chmod($marker,0600);
 foreach(array_keys($backup) as $table){if((int)$pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn()!==0)throw new RuntimeException('Old ranking is not empty');}
 echo "PASS old rankings cleared; account and chat tables untouched.\n";
} catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
