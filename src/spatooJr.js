import './style.css'
import './spatooJr.css'
import './boidBackdrop.js'
import { mountLogo } from './logo3d.js'

mountLogo(document.getElementById('logo'))

// Debug toggle: shows or hides the centre panel. Press the button or the D key.
const panel = document.getElementById('panel')
const debugToggle = document.getElementById('debugToggle')
const setPanelVisible = (visible) => {
    panel.hidden = !visible
    debugToggle.setAttribute('aria-pressed', String(visible))
    debugToggle.textContent = visible ? 'Hide panel' : 'Show panel'
}
debugToggle.addEventListener('click', () => setPanelVisible(panel.hidden))
window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') setPanelVisible(panel.hidden)
})
setPanelVisible(true)
