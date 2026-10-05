<?php
declare(strict_types=1);
function communityTeamRecord(PDO $pdo, string $user, string $team, int $points, int $score): void {
    if ($points <= 0) return;
    $pdo->prepare('INSERT INTO game_team_records (user_id,team,points,score) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE score=IF(VALUES(points)>points OR (VALUES(points)=points AND VALUES(score)>score),VALUES(score),score),points=GREATEST(points,VALUES(points))')->execute([$user,$team,$points,$score]);
}
function communityTeams(PDO $pdo): array {
    $teams=[];
    foreach (['podpah','capim','dendele','furia','loud','g3x','dibrados','nyvelados','fluxo','desimpain'] as $team) $teams[$team]=['team'=>$team,'points'=>0,'score'=>0,'players'=>0];
    foreach ($pdo->query('SELECT team,SUM(points) AS points,SUM(score) AS score,COUNT(*) AS players FROM game_team_records WHERE points>0 GROUP BY team')->fetchAll(PDO::FETCH_ASSOC) as $r) {
        if (!isset($teams[$r['team']])) continue;
        foreach (['points','score','players'] as $k) $r[$k]=(int)$r[$k];
        $teams[$r['team']]=$r;
    }
    $rows=array_values($teams);
    usort($rows,fn($a,$b)=>($b['points']<=>$a['points']) ?: (($b['score']<=>$a['score']) ?: strcmp($a['team'],$b['team'])));
    return $rows;
}
function communityText(mixed $text): string {
    if (!is_string($text) || strlen($text)>720 || !preg_match('//u',$text)) throw new InvalidArgumentException('Escreva uma mensagem de até 180 caracteres.');
    $text=trim(preg_replace('/[\p{C}\s]+/u',' ',$text));
    $length=preg_match_all('/./us',$text);
    if (!$length || $length>180) throw new InvalidArgumentException('Escreva uma mensagem de até 180 caracteres.');
    return $text;
}
function communityChatRead(PDO $pdo, int $after): array {
    $now=(float)$pdo->query('SELECT UNIX_TIMESTAMP(NOW(3))')->fetchColumn();
    $epoch=(int)floor($now/300);
    $start=$epoch*300;
    $pdo->exec("DELETE FROM game_chat_messages WHERE created_at<FROM_UNIXTIME($start) LIMIT 1000");
    if ($after===0) {
        $stmt=$pdo->prepare('SELECT m.id,m.user_id,u.username AS name,m.body,m.created_at FROM game_chat_messages m JOIN game_users u ON u.id=m.user_id WHERE m.created_at>=FROM_UNIXTIME(?) ORDER BY m.id DESC LIMIT 25');
        $stmt->execute([$start]);$rows=array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else {
        $stmt=$pdo->prepare('SELECT m.id,m.user_id,u.username AS name,m.body,m.created_at FROM game_chat_messages m JOIN game_users u ON u.id=m.user_id WHERE m.id>? AND m.created_at>=FROM_UNIXTIME(?) ORDER BY m.id ASC LIMIT 50');
        $stmt->execute([$after,$start]);$rows=$stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    // IDs stay strings to retain BIGINT precision in browsers.
    foreach($rows as &$row)$row['id']=(string)$row['id'];unset($row);
    return ['epoch'=>$epoch,'resetIn'=>max(0,($epoch+1)*300-$now),'messages'=>$rows,'cursor'=>$rows ? (string)end($rows)['id'] : (string)$after];
}
function communityChatWrite(PDO $pdo, string $user, string $nonce, string $body): array {
    if (!preg_match('/^[a-f0-9-]{36}$/D',$nonce)) throw new InvalidArgumentException('Atualize o chat e tente novamente.');
    $body=communityText($body);
    $pdo->beginTransaction();
    try {
        $pdo->prepare('SELECT id FROM game_users WHERE id=? FOR UPDATE')->execute([$user]);
        $stmt=$pdo->prepare('SELECT id FROM game_chat_messages WHERE user_id=? AND client_nonce=?');$stmt->execute([$user,$nonce]);
        if ($id=$stmt->fetchColumn()) { $pdo->commit();return ['id'=>(string)$id]; }
        $stmt=$pdo->prepare('SELECT id FROM game_chat_messages WHERE user_id=? AND created_at>DATE_SUB(NOW(3),INTERVAL 4 SECOND) LIMIT 1');$stmt->execute([$user]);
        if ($stmt->fetchColumn()) throw new RuntimeException('Respira! Aguarde 4 segundos entre mensagens.',429);
        $pdo->prepare('INSERT INTO game_chat_messages (user_id,client_nonce,body) VALUES (?,?,?)')->execute([$user,$nonce,$body]);
        $id=$pdo->lastInsertId();$pdo->commit();
        return ['id'=>$id];
    } catch(Throwable $e) {if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}
