import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

// Hydrametry logo as on the index page: hydra model above, extruded "Hydrametry Software" text
// below, both with the same matcap. Drawn into its own small canvas so it can sit inside the panel.
export function mountLogo(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500)
    camera.position.set(0, 0, 60) // further away: less perspective change as the hydra turns, so the silhouette stays inside the frame

    const matcap = new THREE.TextureLoader().load('/textures/matcaps/13.png')
    matcap.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.MeshMatcapMaterial({ matcap })

    const logo = new THREE.Group()
    scene.add(logo)
    const hydraPivot = new THREE.Group()
    logo.add(hydraPivot)

    // Same as index.js: the first child of the hydra scene gets the matcap, and it is turned by PI/2.
    new GLTFLoader().load('/models/hydra/hydra.gltf', (gltf) => {
        gltf.scene.children[0].material = mat
        gltf.scene.rotation.y = Math.PI / 2
        hydraPivot.add(gltf.scene)
        fit()
    })

    // Same text parameters as index.js.
    new FontLoader().load('/fonts/kenyan_coffee/KenyanCoffeeRegular.json', (font) => {
        const geom = new TextGeometry('Hydrametry Software', {
            font,
            size: 1,
            depth: 0.1,
            curveSegments: 12,
            bevelSize: 0.02,
            bevelThickness: 0.15,
            bevelOffset: 0,
            bevelEnabled: true,
        })
        geom.center()
        const text = new THREE.Mesh(geom, mat)
        text.position.y = -1.5 // just under the hydra (model spans roughly y 0.1 to 5.9)
        logo.add(text)
        fit()
    })

    // Scale and centre the logo so it fits the canvas.
    // The hydra turns, so its silhouette changes. Measure the logo at evenly spaced angles through a full
    // turn and keep the union of those boxes. The frame then always holds the whole logo, and the scale
    // does not depend on where the model happens to be in its rotation.
    let unionBox = null
    function measureUnion() {
        const spin = hydraPivot.rotation.y
        logo.scale.setScalar(1)
        logo.position.set(0, 0, 0)
        unionBox = new THREE.Box3()
        const steps = 36
        for (let i = 0; i < steps; i++) {
            hydraPivot.rotation.y = (i / steps) * Math.PI * 2
            logo.updateMatrixWorld(true) // child matrices are stale until this runs, so each sample needs it
            unionBox.union(new THREE.Box3().setFromObject(logo))
        }
        hydraPivot.rotation.y = spin
    }

    // Centre and scale the logo to fit the canvas, using the cached union box.
    function fit() {
        measureUnion()
        if (unionBox.isEmpty()) return
        const size = unionBox.getSize(new THREE.Vector3())
        const center = unionBox.getCenter(new THREE.Vector3())
        const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        const visW = visH * camera.aspect
        const s = Math.min((visH * 0.85) / size.y, (visW * 0.85) / size.x)
        logo.scale.setScalar(s)
        // The group is scaled, so its offset has to be scaled too, or the centre moves off the canvas middle.
        logo.position.copy(center).multiplyScalar(-s)
    }

    function resize() {
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        if (w === 0 || h === 0) return
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
        fit()
    }
    new ResizeObserver(resize).observe(canvas)

    const clock = new THREE.Clock()
    const tick = () => {
        const dt = clock.getDelta()
        hydraPivot.rotation.y += dt * 0.5
        if (canvas.clientWidth > 0) renderer.render(scene, camera)
        requestAnimationFrame(tick)
    }
    tick()
}
