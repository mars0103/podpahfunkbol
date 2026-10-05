<?php
// Retired when the user reset the old rankings. Old clients cannot restore old scores.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD']==='GET' && ($_GET['route']??'leaderboard')==='leaderboard') {echo '[]';exit;}
http_response_code(410);
echo json_encode(['error'=>'O ranking antigo foi encerrado. Recarregue para jogar a Copa de Gols.'],JSON_UNESCAPED_UNICODE);
