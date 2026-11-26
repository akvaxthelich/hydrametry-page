import './style.css'
import './spatooJr.css'
import './boidBackdrop.js'
import { mountLogo } from './logo3d.js'
import { initPanelDebug } from './panelDebug.js'
import { enableTilt } from './tilt.js'

mountLogo(document.getElementById('logo'))
initPanelDebug()
enableTilt()
