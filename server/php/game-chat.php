<?php
declare(strict_types=1);
require __DIR__.'/campaign-common.php';
require __DIR__.'/community-store.php';
try {
    $user=campaignRequireUser($pdo);
    if ($_SERVER['REQUEST_METHOD']==='GET') {
        $raw=$_GET['after']??'0';
        if (!is_string($raw)||!preg_match('/^\d{1,18}$/D',$raw)) campaignRespond(400,['error'=>'Cursor inválido.']);
        session_write_close();
        campaignRespond(200,communityChatRead($pdo,(int)$raw));
    }
    if ($_SERVER['REQUEST_METHOD']!=='POST') campaignRespond(405,['error'=>'Método inválido.']);
    campaignCheckCsrf();
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>2048) campaignRespond(413,['error'=>'Mensagem muito grande.']);
    $b=campaignBody();
    if (!is_string($b['nonce']??null)) campaignRespond(400,['error'=>'Mensagem inválida.']);
    session_write_close();
    campaignLimit($pdo,'chat:'.$user['id'],15,60);
    $message=communityChatWrite($pdo,$user['id'],$b['nonce'],communityText($b['body']??null));
    $pdo->exec('DELETE FROM game_chat_messages WHERE created_at<DATE_SUB(NOW(),INTERVAL 1 DAY) LIMIT 100');
    campaignRespond(201,$message);
} catch(InvalidArgumentException $e) {campaignRespond(400,['error'=>$e->getMessage()]);}
catch(RuntimeException $e) {if($e->getCode()===429)campaignRespond(429,['error'=>$e->getMessage()]);error_log('Chat: '.$e->getMessage());campaignRespond(503,['error'=>'Chat indisponível. Tente novamente.']);}
catch(Throwable $e) {error_log('Chat: '.$e->getMessage());campaignRespond(503,['error'=>'Chat indisponível. Tente novamente.']);}
