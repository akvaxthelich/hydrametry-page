import './style.css'
import './spatooJrIntro.css' // "Tap to enter" prompt and its breathing animation, shared with the intro page
import './splash.css'
import { mountIndexScene } from './indexScene.js'
import { config } from './config.js'

// Splash: black, then the index scene fades in, then "Tap to enter" flashes right under the hydra. A tap fades to black and opens spatooJr.
const DESTINATION = '/spatooJr.html'

const fade = document.getElementById('fade')
const enterText = document.getElementById('enterText')

// The prompt follows the hydra: each frame, place it just below the hydra's lowest screen point.
mountIndexScene(document.querySelector('canvas.webgl'), (bottomPx) => {
    if (bottomPx == null) return
    enterText.style.top = `${bottomPx + config.SPLASH_PROMPT_GAP_PX}px`
    enterText.style.transform = 'translateX(-50%)'
})

fade.style.transition = `opacity ${config.SPLASH_FADE_MS}ms ease`

// The prompt sits in a semi-transparent black box. Sizes come from config.js.
Object.assign(enterText.style, {
    background: `rgba(0, 0, 0, ${config.SPLASH_PROMPT_BG_ALPHA})`,
    padding: `${config.SPLASH_PROMPT_PAD_Y_PX}px ${config.SPLASH_PROMPT_PAD_X_PX}px`,
    fontSize: `${config.SPLASH_PROMPT_FONT_PX}px`,
})

let ready = false // true once the prompt is showing; taps before that are ignored
let leaving = false

// The fade starts opaque (style.css), so the page opens black. Reveal the logo after the delay.
setTimeout(() => {
    fade.classList.add('active') // opacity 0: the logo is revealed
    const revealDone = config.SPLASH_FADE_MS + config.SPLASH_PROMPT_DELAY_MS
    setTimeout(() => {
        enterText.classList.remove('hidden')
        ready = true
    }, revealDone)
}, config.SPLASH_REVEAL_DELAY_MS)

function go() {
    window.location.href = DESTINATION
}

window.addEventListener('pointerdown', () => {
    if (!ready || leaving) return
    leaving = true
    enterText.classList.add('hidden')
    fade.classList.remove('active') // opacity back to 1: fade to black
    fade.addEventListener('transitionend', go, { once: true })
    setTimeout(go, config.SPLASH_FADE_MS + config.SPLASH_NAVIGATE_GRACE_MS) // in case transitionend never fires
})
