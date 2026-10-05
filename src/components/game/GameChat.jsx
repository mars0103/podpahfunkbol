import { useEffect, useRef, useState } from 'react'
import { gameChatRead, gameChatSend } from '../../lib/campaignApi'

export default function GameChat({ user, open, onOpen, onLogin, playing }) {
  const [messages,setMessages]=useState([]),[draft,setDraft]=useState(''),[error,setError]=useState('')
  const [online,setOnline]=useState(true),[sending,setSending]=useState(false),[unread,setUnread]=useState(0)
  const [floating,setFloating]=useState(true),[flights,setFlights]=useState([])
  const pollRef=useRef(null),retry=useRef(null),list=useRef(null),toggle=useRef(null),openRef=useRef(open)
  const stick=useRef(true);openRef.current=open
  useEffect(()=>{
    setMessages([]);setFlights([]);setUnread(0);setDraft('');setError('');retry.current=null
    if(!user){pollRef.current=null;return}
    let disposed=false,pending=false,cursor='0',primed=false,epoch=null,resetTimer=null
    const clearChat=()=>{setMessages([]);setFlights([]);setUnread(0)}
    async function poll(){
      if(disposed||pending||document.hidden)return
      pending=true
      try {
        const requestedAt=Date.now()
        const data=await gameChatRead(cursor)
        if(disposed)return
        if(data.epoch!==undefined){
          if(epoch!==null&&epoch!==data.epoch)clearChat()
          epoch=data.epoch
          clearTimeout(resetTimer)
          const remaining=data.resetIn*1000-(Date.now()-requestedAt)
          if(remaining<=0){clearChat();return}
          resetTimer=setTimeout(clearChat,remaining)
        }
        const incoming=data.messages
        cursor=data.cursor;setOnline(true)
        if(incoming.length){
          setMessages(old=>{const ids=new Set(old.map(m=>m.id));return [...old,...incoming.filter(m=>!ids.has(m.id))].slice(-60)})
          if(primed){
            setFlights(old=>[...old,...incoming.map(m=>({...m,expires:Date.now()+7000}))].slice(-3))
            if(!openRef.current)setUnread(n=>Math.min(99,n+incoming.length))
          }
        }
        primed=true
      }catch{if(!disposed)setOnline(false)}
      finally{pending=false}
    }
    pollRef.current=poll;poll()
    const timer=setInterval(poll,3000),expiration=setInterval(()=>setFlights(old=>old.filter(m=>m.expires>Date.now())),1000)
    document.addEventListener('visibilitychange',poll)
    return()=>{disposed=true;clearTimeout(resetTimer);clearInterval(timer);clearInterval(expiration);document.removeEventListener('visibilitychange',poll);pollRef.current=null}
  },[user?.id])
  useEffect(()=>{if(open){setUnread(0);stick.current=true;pollRef.current?.()}},[open])
  useEffect(()=>{if(open&&stick.current&&list.current)list.current.scrollTop=list.current.scrollHeight},[messages,open])
  async function send(e){
    e.preventDefault()
    const body=draft.trim();if(!body||sending)return
    if(retry.current?.body!==body)retry.current={body,nonce:crypto.randomUUID()}
    setSending(true);setError('')
    try {await gameChatSend(body,retry.current.nonce);setDraft('');retry.current=null;stick.current=true;await pollRef.current?.()}
    catch(e){setError(e.message)}
    finally{setSending(false)}
  }
  function close(){onOpen(false);toggle.current?.focus()}
  return <aside className={'cp-chat '+(open?'is-open':'')} aria-label="Chat da torcida" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')close()}}>
    <button ref={toggle} type="button" className="cp-chat-toggle" aria-expanded={open} aria-controls="cp-chat-panel" onClick={()=>onOpen(!open)}>CHAT DA TORCIDA {unread>0&&!open&&<b>{unread}</b>} <span aria-hidden="true">{open?'▴':'▾'}</span></button>
    {open&&<section id="cp-chat-panel" className="cp-chat-panel">
      <div className="cp-chat-tools"><small>{online?'AO VIVO · LIMPA A CADA 5 MIN':'RECONECTANDO…'}</small><button type="button" aria-pressed={floating} onClick={()=>setFloating(v=>!v)}>{floating?'Ocultar balões':'Mostrar balões'}</button></div>
      {user?<><div ref={list} className="cp-chat-history" role="log" aria-label="Mensagens da torcida" aria-live="polite" onScroll={e=>{const n=e.currentTarget;stick.current=n.scrollHeight-n.scrollTop-n.clientHeight<35}}>
        {messages.length?messages.map(m=><p key={m.id} className={m.user_id===user.id?'is-own':''}><strong>{m.name}</strong><span>{m.body}</span></p>):<p className="cp-chat-empty">A resenha começa com você!</p>}
      </div><form onSubmit={send}><label className="cp-sr-only" htmlFor="cp-chat-input">Sua mensagem</label><input id="cp-chat-input" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={180} disabled={sending} autoComplete="off" placeholder="Manda a resenha…" /><button type="submit" disabled={sending||!draft.trim()}>{sending?'…':'ENVIAR'}</button></form><small className="cp-chat-hint">{playing?'Jogo pausado enquanto o chat está aberto.':'Resenha de futebol. Respeite a torcida.'} {draft.length}/180</small></>:<div className="cp-chat-login"><p>Entre na sua conta para conversar com a torcida.</p><button onClick={()=>{onOpen(false);onLogin()}}>ENTRAR / CADASTRAR</button></div>}
      {error&&<p className="cp-chat-error" role="alert">{error}</p>}
    </section>}
    {!open&&floating&&<div className="cp-chat-flights" aria-hidden="true">{flights.slice(-2).map(m=><p key={m.id}><strong>{m.name}</strong><span>{m.body}</span></p>)}</div>}
  </aside>
}
