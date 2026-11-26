import './style.css'
import './spatooJr.css'
import './boidBackdrop.js'
import { mountLogo } from './logo3d.js'
import { initPanelDebug } from './panelDebug.js'
import { enableTilt } from './tilt.js'
import { config } from './config.js'

mountLogo(document.getElementById('logo'))
initPanelDebug()
enableTilt()

// Arrival: start on black (the overlay is opaque until the transition runs), then fade in.
// Two frames so the browser paints the black state before the transition starts.
const fade = document.getElementById('fade')
fade.style.transition = `opacity ${config.ARRIVAL_FADE_MS}ms ease`
requestAnimationFrame(() => requestAnimationFrame(() => fade.classList.add('active')))
