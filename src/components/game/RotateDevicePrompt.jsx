function RotateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" aria-hidden="true">
      <rect
        x="6.5"
        y="3"
        width="11"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        className="rotate-prompt-phone"
      />
      <path
        d="M20 8.5a7 7 0 1 1-2-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M20 3.5v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function RotateDevicePrompt() {
  return (
    <div className="rotate-prompt" role="alert">
      <div className="rotate-prompt-icon">
        <RotateIcon />
      </div>
      <p>Gire seu celular para jogar</p>
      <span>O Podpah Funkbol Challenge é melhor na horizontal</span>
    </div>
  )
}
