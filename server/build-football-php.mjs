// Deliberately limited compiler for the deterministic football engine.
// Unsupported syntax fails the build instead of silently changing replay behavior.
import {parse} from '@babel/parser'
import {readFileSync,writeFileSync} from 'node:fs'
const source=readFileSync('src/components/game/footballEngine.js','utf8')
const ast=parse(source,{sourceType:'module'})
const names=new Map(),constants=new Set(['MATCH_TICKS','MAX_TICKS','STEP','OWN_AREA_END','CARDS','cardIds'])
for(const item of ast.program.body){const n=item.declaration||item;if(n.type==='FunctionDeclaration')names.set(n.id.name,({createCampaign:'campaignCreate',advanceCampaign:'campaignAdvance',campaignResult:'campaignResult'})[n.id.name]||'fb'+n.id.name);if(n.type==='VariableDeclaration')for(const d of n.declarations)if(d.init?.type==='ArrowFunctionExpression')names.set(d.id.name,'fb'+d.id.name)}
const q=s=>JSON.stringify(s).replace(/\\u([0-9a-f]{4})/g,(_,v)=>String.fromCharCode(parseInt(v,16)))
const arrayMember=n=>n.type==='Identifier'&&['CARDS','cardIds'].includes(n.name)||n.type==='MemberExpression'&&!n.computed&&n.property.name==='order'
function e(n){if(!n)return '';switch(n.type){
 case 'Identifier':return n.name==='undefined'?'null':constants.has(n.name)?'FB_'+n.name:names.has(n.name)?names.get(n.name):'$'+n.name
 case 'NumericLiteral':return String(n.value)
 case 'StringLiteral':return q(n.value)
 case 'BooleanLiteral':return String(n.value)
 case 'NullLiteral':return 'null'
 case 'ObjectExpression':{const parts=[],fields=[];for(const p of n.properties){if(p.type==='SpreadElement')parts.push('(array)'+e(p.argument));else fields.push(q(p.key.name??p.key.value)+'=>'+e(p.value))}parts.push('['+fields.join(',')+']');return '(object)array_merge('+parts.join(',')+')'}
 case 'ArrayExpression':return '['+n.elements.map(e).join(',')+']'
 case 'MemberExpression':if(n.object.type==='MemberExpression'&&n.object.object.name==='CARDS')return 'fbcardname('+e(n.object.property)+')';if(n.object.name==='input')return '('+e(n.object)+'->'+n.property.name+' ?? null)';return n.computed?(arrayMember(n.object)?e(n.object)+'['+e(n.property)+']':e(n.object)+'->{'+e(n.property)+'}'):e(n.object)+'->'+n.property.name
 case 'ConditionalExpression':return '('+e(n.test)+'?'+e(n.consequent)+':'+e(n.alternate)+')'
 case 'LogicalExpression':return '('+e(n.left)+n.operator+e(n.right)+')'
 case 'BinaryExpression':{if(n.operator==='>>>')return '('+e(n.left)+' & 0xffffffff)';let op=({'===':'==','!==':'!='})[n.operator]||n.operator;if(op==='+'&&(n.left.type==='StringLiteral'||n.right.type==='StringLiteral'||n.left.type==='ConditionalExpression'&&n.left.consequent.type==='StringLiteral'))op='.';return '('+e(n.left)+op+e(n.right)+')'}
 case 'UnaryExpression':return '('+n.operator+e(n.argument)+')'
 case 'UpdateExpression':return n.prefix?n.operator+e(n.argument):e(n.argument)+n.operator
 case 'AssignmentExpression':return e(n.left)+n.operator+e(n.right)
 case 'CallExpression':{
  if(n.callee.type==='MemberExpression'&&n.callee.object.name==='Math'){const f=n.callee.property.name;if(f==='imul')return '('+e(n.arguments[0])+'*'+e(n.arguments[1])+')';return ({max:'max',min:'min',abs:'abs',floor:'floor',round:'round',sqrt:'sqrt',exp:'exp'})[f]+'('+n.arguments.map(e).join(',')+')'}
  if(n.callee.type==='MemberExpression'&&n.callee.object.name==='Object'){if(n.callee.property.name==='keys')return 'array_keys((array)'+e(n.arguments[0])+')';if(n.callee.property.name==='assign')return 'fbassign('+n.arguments.map(e).join(',')+')'}
  if(n.callee.name==='Number')return '(int)'+e(n.arguments[0])
  return e(n.callee)+'('+n.arguments.map(e).join(',')+')'
 }
 default:throw Error('Unsupported expression '+n.type)
}}
function params(list){return list.map(n=>n.type==='AssignmentPattern'?e(n.left)+'='+(n.right.type==='ObjectExpression'?'null':e(n.right)):e(n)).join(',')}
function st(n){switch(n.type){
 case 'ImportDeclaration':return ''
 case 'ExportNamedDeclaration':return st(n.declaration)
 case 'FunctionDeclaration':return 'function '+names.get(n.id.name)+'('+params(n.params)+')'+st(n.body)+'\n'
 case 'VariableDeclaration':return n.declarations.map(d=>{if(d.id.name==='campaignOrder'||d.id.name==='CARDS')return '';if(d.id.name==='cardIds')return "define('FB_cardIds',['double','penalty','shootout','suspend']);";if(d.init?.type==='ArrowFunctionExpression')return 'function '+names.get(d.id.name)+'('+params(d.init.params)+'){return '+e(d.init.body)+';}';if(constants.has(d.id.name))return 'define('+q('FB_'+d.id.name)+','+e(d.init)+');';return e(d.id)+'='+e(d.init)+';'}).join('')
 case 'BlockStatement':return '{\n'+n.body.map(st).join('\n')+'\n}'
 case 'ExpressionStatement':return e(n.expression)+';'
 case 'ReturnStatement':return 'return '+e(n.argument)+';'
 case 'IfStatement':return 'if('+e(n.test)+')'+st(n.consequent)+(n.alternate?'else '+st(n.alternate):'')
 case 'ForStatement':return 'for('+st(n.init).replace(/;$/,'')+';'+e(n.test)+';'+e(n.update)+')'+st(n.body)
 case 'ForOfStatement':return 'foreach('+e(n.right)+' as '+e(n.left.declarations[0].id)+')'+st(n.body)
 case 'ContinueStatement':return 'continue;'
 default:throw Error('Unsupported statement '+n.type)
}}
let php=`<?php
// Generated by server/build-football-php.mjs. Edit footballEngine.js, then regenerate.
function fbcardname($id){return ['double'=>'GOL X2','penalty'=>'PÊNALTI','shootout'=>'SHOOTOUT','suspend'=>'SUSPENSÃO'][$id];}
function fbassign($target,$values){foreach($values as $key=>$value)$target->$key=$value;return $target;}
function $orderTeams($seed,$team){}
`
php=php.replace('function $orderTeams($seed,$team){}',`function orderTeams($seed,$team){$order=array_values(array_diff(['podpah','capim','dendele','furia','loud','g3x','dibrados','nyvelados','fluxo','desimpain'],[$team]));for($i=count($order)-1;$i>0;$i--){$seed=($seed*1664525+1013904223)&0xffffffff;$j=(int)floor($seed/4294967296*($i+1));[$order[$i],$order[$j]]=[$order[$j],$order[$i]];}return array_slice($order,0,5);}
function campaignOrder($seed,$team){return orderTeams($seed,$team);}`)
php+=ast.program.body.map(st).join('\n')
php=php.replaceAll('$orderTeams(', 'orderTeams(')
php+=`
function campaignVerify(int $seed,string $team,mixed $inputs,mixed $tick): array {
 if(!is_int($tick)||$tick<1||$tick>FB_MAX_TICKS||!is_array($inputs)||!array_is_list($inputs)||count($inputs)>$tick)throw new InvalidArgumentException('Replay invalido');
 $last=-1;
 foreach($inputs as $entry){
  if(!is_array($entry)||!is_int($entry['tick']??null)||$entry['tick']<0||$entry['tick']<=$last||$entry['tick']>=$tick)throw new InvalidArgumentException('Tick invalido');
  foreach(['left','right','jump','special','shoot','card'] as $key)if(!isset($entry[$key])||!is_bool($entry[$key]))throw new InvalidArgumentException('Controle invalido');
  if(!array_key_exists('target',$entry)||($entry['target']!==null&&(!is_int($entry['target'])||$entry['target']<38||$entry['target']>922)))throw new InvalidArgumentException('Alvo invalido');
  $last=$entry['tick'];
 }
 $s=campaignCreate($seed,$team);$i=0;$control=(object)['left'=>false,'right'=>false,'jump'=>false,'special'=>false,'shoot'=>false,'card'=>false,'target'=>null];
 while($s->clockTick<$tick&&!$s->ended){if(isset($inputs[$i])&&$inputs[$i]['tick']===$s->clockTick)$control=(object)$inputs[$i++];campaignAdvance($s,$control);}
 if($s->clockTick!==$tick||$i!==count($inputs))throw new InvalidArgumentException('Partida encerrada');
 return (array)campaignResult($s);
}
`
// Card metadata is an associative object, so dynamic property access stays consistent.
writeFileSync('server/php/football-engine.php',php)
console.log('Generated PHP football replay engine')
