import './style.css'
import './spatooJr.css'
import './spatooJrPop.css'
import './boidBackdrop.js'
import { mountLogo } from './logo3d.js'
import { initPanelDebug } from './panelDebug.js'
import { enableTilt } from './tilt.js'

// Variant: the logo is larger than the panel and drawn above it, so it can pop out past the border as it turns.
mountLogo(document.getElementById('logoPop'))
initPanelDebug()
enableTilt()
