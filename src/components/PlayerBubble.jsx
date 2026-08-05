export default function PlayerBubble({ player, onClose }) {
  if (!player) return null

  return (
    <div className="player-bubble" role="status">
      <button className="player-bubble-close" onClick={onClose} aria-label="Fechar">
        ×
      </button>
      <div className="player-bubble-photo">
        <img src={player.photo} alt={player.name} />
      </div>
      <div className="player-bubble-text">
        <strong>{player.name}</strong>
        <p>{player.comment}</p>
      </div>
      <span className="player-bubble-tail" aria-hidden="true" />
    </div>
  )
}
