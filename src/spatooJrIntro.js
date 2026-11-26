import './style.css'
import './spatooJr.css'
import './spatooJrIntro.css'
import './boidBackdrop.js'
import { mountLogo } from './logo3d.js'
import { startTilt } from './tilt.js'

mountLogo(document.getElementById('logo'))

const fade = document.getElementById('fade')
const enterText = document.getElementById('enterText')

// Turn on the fade transition only after the first frame, so the page starts black with no animation.
requestAnimationFrame(() => fade.classList.add('ready'))

// The first tap is the user gesture the gyro needs. It also reveals the page, as the index page does on double-click.
// The listeners are on window, so they run in the same document as the gyro listener.
window.addEventListener('pointerdown', () => {
    startTilt()
    fade.classList.add('active')
    enterText.classList.add('hidden')
}, { once: true })
