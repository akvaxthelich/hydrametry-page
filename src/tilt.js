import { config } from './config.js'

// Gyro parallax. Device tilt drives the same camera offset that the mouse drives on desktop.
// Values are scaled to the mouse's -0.5..0.5 range and taken relative to the pose when the page opened.
export const tilt = { x: 0, y: 0, active: false }

// Sensitivity: config.TILT_RANGE_DEG is the tilt, in degrees from the starting pose, that reaches the edge of the range.
// The clamp of 0.5 is the edge of the mouse's -0.5..0.5 range, so it is not a tunable.
let base = null
let hint = null

function onOrientation(e) {
    if (e.beta == null || e.gamma == null) return
    if (!base) base = { beta: e.beta, gamma: e.gamma }
    const clamp = (v) => Math.max(-0.5, Math.min(0.5, v))
    // Range is the full swing either side of base, so the edge is reached at RANGE_DEG in each direction.
    tilt.x = clamp((e.gamma - base.gamma) / (config.TILT_RANGE_DEG * 2))
    tilt.y = clamp((e.beta - base.beta) / (config.TILT_RANGE_DEG * 2))
    tilt.active = true
    if (hint) hint.remove()
}

function showHint() {
    if (tilt.active || hint) return
    hint = document.createElement('div')
    hint.textContent = 'Tap to enable tilt'
    Object.assign(hint.style, {
        position: 'fixed', bottom: `${config.TILT_HINT_BOTTOM_PX}px`, left: '50%', transform: 'translateX(-50%)',
        zIndex: '30', font: '12px monospace', color: '#6fbf2f', background: 'rgba(0,0,0,0.7)',
        border: '1px solid #6fbf2f', padding: '4px 8px', pointerEvents: 'none',
    })
    document.body.appendChild(hint)
}

// Call from inside a user gesture (a tap or click handler). Starts the listener at once, with no hint.
export function startTilt() {
    if (typeof DeviceOrientationEvent === 'undefined' || navigator.maxTouchPoints === 0) return
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then((state) => { if (state === 'granted') window.addEventListener('deviceorientation', onOrientation) })
            .catch(() => {})
    } else {
        window.addEventListener('deviceorientation', onOrientation)
    }
}

// Call once on a page. Only touch devices get the listener, so desktop keeps the mouse.
export function enableTilt() {
    if (typeof DeviceOrientationEvent === 'undefined' || navigator.maxTouchPoints === 0) return
    const attach = () => window.addEventListener('deviceorientation', onOrientation)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS: the permission prompt only appears from a user gesture, so ask on the first tap.
        const ask = () => DeviceOrientationEvent.requestPermission()
            .then((state) => { if (state === 'granted') attach() })
            .catch(() => {})
        window.addEventListener('touchend', ask, { once: true })
    } else {
        attach()
        // Android Chrome can hold motion events until the page gets a gesture. Any tap starts the listener again.
        window.addEventListener('pointerdown', attach)
        setTimeout(showHint, config.TILT_HINT_AFTER_MS)
    }
}
