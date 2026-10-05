# Copa de Gols (engine 8)

Five random opponents, no repeats. Each match has 120 seconds of regulation. Wins advance; a loss ends the campaign. A tie starts three alternating shootouts each, then paired sudden death up to ten attempts per side. If still level, the campaign ends as a draw and the record remains saved. Shootout conversions decide the winner but do not inflate regulation goal statistics.

Timeline: cards unlock at 0:20; goals double for both sides at 0:40 for 15 seconds; at 1:00 low gravity or turbo lasts 15 seconds; new cards at 1:15; final 30 seconds have double goals. Cards: 15-second double goals, 6-second suspension, a 5-second penalty or shootout. Double effects do not stack into x4. No health damage. Specials reposition/protect; Nyvelados protects for two seconds.

Controls: arrows/A/D move, Space/W/Up jump and head, J shoots, E special, Q card. Hold J or the shoot button to kick whenever the ball is within range and cooldown expires. Touch controls preserve simultaneous movement and actions.

Goals require the entire ball crossing the goal line beneath the crossbar. Goal back renders before the ball, goal front after it. A goal celebration cannot award additional goals. Balls over the roof do not count.

Ranking: 20 per goal, or 30 total when the final touch comes from the player's own area (x <= 240). A later player touch updates the origin; floor/post bounces retain it. Opponent touches cannot earn the player's long-goal bonus. Double-goal cards change the match scoreboard only. At each match win, add 100 if the final score margin is at least 3 and 20 if the opponent scored zero in regulation. These bonuses stack and are awarded only once. No generic win or champion bonus. Shootout tiebreak conversions do not generate goal points.

Points accumulate through all five matches and stop on elimination or the title (or an unresolved draw). A new campaign starts from zero. The player ranking keeps the best season total; the team ranking sums account/team bests. On this release, the old game_records, game_campaign_records and game_team_records rankings are cleared at the user's request. Old game.php and game-campaign.php endpoints are retired to prevent old clients restoring them. Accounts and chat are unaffected.

Run `npm run game:build:football` after editing footballEngine.js, then `npm run game:test:football`. The restricted AST compiler emits a PHP object-based equivalent and throws on unsupported statements. Full replay tests compare server and browser results including complete five-match campaigns. Deploy football-schema.sql before the new game-football.php endpoint and frontend. Run the one-time ranking reset only as part of the approved release; its marker prevents wiping later seasons.

Engine 7 remains frozen in football-engine-v7.php to validate already-started three-minute campaigns. New sessions use engine 8.
