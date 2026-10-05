<?php
declare(strict_types=1);
function communityTeamRecord(PDO $pdo, string $user, string $team, int $points, int $score): void {
    if ($points <= 0) return;
    $pdo->prepare('INSERT INTO game_football_team_records (user_id,team,points,score) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE score=IF(VALUES(points)>points OR (VALUES(points)=points AND VALUES(score)>score),VALUES(score),score),points=GREATEST(points,VALUES(points))')->execute([$user,$team,$points,$score]);
}
function communityTeams(PDO $pdo): array {
    $teams=[];
    foreach (['podpah','capim','dendele','furia','loud','g3x','dibrados','nyvelados','fluxo','desimpain'] as $team) $teams[$team]=['team'=>$team,'points'=>0,'score'=>0,'players'=>0];
    foreach ($pdo->query('SELECT team,SUM(points) AS points,SUM(score) AS score,COUNT(*) AS players FROM game_football_team_records WHERE points>0 GROUP BY team')->fetchAll(PDO::FETCH_ASSOC) as $r) {
        if (!isset($teams[$r['team']])) continue;
        foreach (['points','score','players'] as $k) $r[$k]=(int)$r[$k];
        $teams[$r['team']]=$r;
    }
    $rows=array_values($teams);
    usort($rows,fn($a,$b)=>($b['points']<=>$a['points']) ?: (($b['score']<=>$a['score']) ?: strcmp($a['team'],$b['team'])));
    return $rows;
}
