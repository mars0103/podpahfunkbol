# Podpah Funkbol — campanha e contas de jogador

## Produção

Jogo: `https://marsdesigner.com.br/podpahfunkbol/jogo`.

- `api/game-auth.php?route=me|register|login|logout|forgot|reset`: conta básica com usuário único, e-mail e senha. Hash de senha no servidor, sessão HttpOnly/HTTPS, proteção CSRF e limite de tentativas. As contas do painel admin são separadas.
- `api/game-campaign.php?route=leaderboard|position|start|checkpoint|finish|abandon`: campanha e ranking por conta. A API recebe controles, reproduz a física e calcula os pontos; pontuações informadas pelo cliente são ignoradas.
- Os endpoints usam o `$pdo` de `api/config.php`. Nenhuma credencial de produção fica no repositório.

A recuperação envia um link de uso único, válido por 30 minutos, pelo transporte `/usr/sbin/sendmail` da hospedagem, com remetente `noreply@marsdesigner.com.br`. O token é guardado como hash no banco e transmitido no fragmento da URL, removido pela tela de recuperação. Alterar a senha invalida as sessões anteriores. A entrega na caixa de entrada depende do transporte e da configuração de e-mail do domínio; os testes verificaram a troca de senha e o uso único sem enviar mensagens a terceiros.

## Regras

A pessoa escolhe um dos seis mascotes originais. O servidor sorteia uma ordem sem repetição dos cinco outros times; o último é o chefão. Primeiro são necessários 100 pontos de aquecimento. Cada fase tem uma meta de 100, 150, 200, 250 ou 300 pontos e um rival com velocidade/frequência de investida crescentes. O rival mostra um aviso antes de avançar; pular evita o empurrão. Antes de cada fase, a bola fica parada enquanto aparecem escudo, personagem e contagem regressiva.

A base da física de bola, movimento e salto foi preservada. Cada cabeçada vale `(10 + bônus de precisão de 5 + sequência perfeita limitada a 5) × multiplicador da fase`; o multiplicador é 1 no aquecimento e de 2 a 6 nos confrontos. Ao vencer o quinto rival, a campanha termina. Bola no chão ou três minutos de ação encerram a tentativa; as introduções e a pausa não gastam esse tempo.

Na derrota, os pontos da tentativa zeram. O melhor valor atingido permanece no ranking da conta, inclusive se a tentativa acabar em derrota. O ranking é atualizado com checkpoints validados a cada cinco segundos e no resultado final. Empates: cabeçadas e ID da conta, em ordem estável. Sair não apaga o recorde já validado. Se a conexão falhar, o jogo avisa e o resultado pode ser reenviado; a API não aceita uma partida alterada nem de outra conta.

## Desenvolvimento

`npm run dev` abre o jogo em `/jogo`. O proxy `/game-api` usa a API PHP do site. Isso significa que cadastros e partidas de desenvolvimento usam o banco online; use contas de teste identificáveis e remova apenas seus próprios dados ao concluir. No proxy HTTP local a flag Secure do cookie é removida; em produção ela é preservada.

O antigo serviço `npm run game:server` permanece apenas para a versão legada do desafio individual. O frontend atual requer cadastro e conexão com a API PHP; não usa mais identidade anônima ou ranking local como fallback.

## Publicação e reversão

`server/php/campaign-schema.sql` adiciona cinco tabelas: `game_users`, `game_password_resets`, `game_auth_limits`, `game_campaign_runs`, `game_campaign_records`. Execute com `migrate-campaign.php` via CLI, definindo `PODPAH_SITE_ROOT`. Esse auxiliar e os arquivos SQL ficam fora da pasta pública. Publique somente os endpoints e bibliotecas PHP. As tabelas e APIs da versão anônima anterior são mantidas como histórico; pontuações de regras diferentes não são misturadas ao ranking da campanha.

Backup antes desta atualização: `/home/marsdes1/deployments/funkbol-campaign-20260908/site-before.tgz`. O backup fica privado, fora de `public_html`. Assets anteriores são mantidos; para reverter apenas o frontend, restaure seu `index.html`. Não sobrescreva a configuração da API nem remova dados de contas recebidos depois da publicação.

Visual: quadra em tela inteira, seleção amarela, mascotes de `game assets`, Pixelify Sans local (licença OFL em `src/assets/fonts`) e paleta `#E91176`, `#F5BA00`, `#54407D`, `#FFFFFF`.

## Verificações

- `npm run game:test:campaign`: sorteio sem repetição, pausa de física nas apresentações, perda/recorde, progressão até o chefão e igualdade JavaScript/PHP em campanhas completas.
- `npm run game:test` e `npm run game:test:php`: física e API da versão legada, compartilhadas como base.
- `npm run build`: integração do frontend.

Os testes de navegador também cobriram cadastro/login/logout, recuperação e revogação de sessão, controles por toque, telas cheia em retrato/paisagem, avisos de adversários, vitória contra o chefão, ranking ao vivo e rejeição de replay adulterado ou de outra conta. As contas temporárias são removidas ao finalizar.
