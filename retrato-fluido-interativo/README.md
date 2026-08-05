# Retrato Fluido Interativo
> Efeito desenvolvido por **Império WEB Codes Store**
> marsdesigner.com.br/codesstore

Efeito WebGL interativo que revela uma imagem por meio de rastros de fluido gerados pelo movimento do mouse. Usa simulação de trajetória via ping-pong de render targets e parallax suave para criar uma experiência visual única e imersiva.

## Como usar

1. Copie a pasta `assets/` para seu projeto
2. Adicione suas imagens em `assets/img/`:
   - `portrait_top.png` — imagem base (fundo, escura)
   - `portrait_bottom.png` — imagem revelada (pelo fluido)
3. Importe o CSS no `<head>`:
   ```html
   <link rel="stylesheet" href="assets/css/efeito.css">
   ```
4. Adicione o HTML onde desejar:
   ```html
   <div class="portrait-reveal-wrapper">
     <canvas id="portrait-canvas" class="portrait-canvas"></canvas>
     <footer class="portrait-footer">
       <p>Texto esquerda</p>
       <p>Texto direita</p>
     </footer>
   </div>
   ```
5. Inicialize via script de módulo:
   ```html
   <script type="module">
     import { initPortraitReveal } from './assets/js/efeito.js';
     initPortraitReveal({
       canvas:    document.getElementById('portrait-canvas'),
       topSrc:    'assets/img/portrait_top.png',
       bottomSrc: 'assets/img/portrait_bottom.png',
     });
   </script>
   ```

## Personalizações

Edite as variáveis CSS em `assets/css/efeito.css`:

| Variável | Padrão | Descrição |
|---|---|---|
| `--reveal-bg` | `#01183A` | Cor de fundo do wrapper |
| `--reveal-footer-color` | `#ffffff` | Cor do texto do rodapé |
| `--reveal-footer-size` | `0.85rem` | Tamanho do texto do rodapé |
| `--reveal-footer-shadow` | `0 2px 12px rgba(255,255,255,0.7)` | Sombra do texto |

Parâmetros da função `initPortraitReveal`:

| Parâmetro | Descrição |
|---|---|
| `canvas` | Elemento `<canvas>` alvo |
| `topSrc` | Caminho da imagem base (aparece sem interação) |
| `bottomSrc` | Caminho da imagem revelada pelo mouse |

Valores internos ajustáveis em `efeito.js`:

| Constante | Valor | Descrição |
|---|---|---|
| `uDecay` | `0.97` | Velocidade de desvanecimento do fluido (0.9 = rápido, 0.99 = lento) |
| `lineWidth` | `0.105` | Espessura do traço de fluido |
| `intensity` | `0.34` | Intensidade máxima do fluido |
| `smoothPointer lerp` | `0.075` | Suavidade do parallax |
| `parallax offset` | `0.026` | Intensidade do efeito de parallax |

## Requisitos
- Navegador moderno com suporte a WebGL 2
- Servidor HTTP local para servir os arquivos (não funciona via `file://` por restrições de CORS)
- As imagens devem ser acessíveis via HTTP (mesma origem ou CORS habilitado)

## Tecnologias
Three.js, WebGL, GLSL Shaders, CSS3, HTML5

## Compatibilidade
HTML Puro, WordPress (via bloco HTML), Webflow (via Embed), React/Next.js (instanciar no useEffect)

## Licença
Licença para uso pessoal e comercial.
Proibida a redistribuição ou revenda.
© Império WEB Codes Store
