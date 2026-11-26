import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { config } from './config.js'

// The index page's scene: wireframe green floors above and below, a cloud of matcap cubes,
// the hydra and the extruded text. Same objects and positions as index.js, with numbers from config.js.
// onFrame(bottomPx) is called every frame with the screen y (px) of the hydra's lowest point, or null before it loads.
export function mountIndexScene(canvas, onFrame) {
    const renderer = new THREE.WebGLRenderer({ canvas })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.BG_MAX_PIXEL_RATIO))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
        config.SPLASH_CAMERA_FOV, window.innerWidth / window.innerHeight, config.BG_CAMERA_NEAR, config.SPLASH_CAMERA_FAR,
    )
    camera.position.set(0, config.SPLASH_CAMERA_Y, 0)
    scene.add(camera)

    // Matcap material shared by the hydra, text and cubes, as on the index page.
    const matcap = new THREE.TextureLoader().load('/textures/matcaps/13.png')
    matcap.colorSpace = THREE.SRGBColorSpace
    const textMat = new THREE.MeshMatcapMaterial({ matcap })

    let hydra = null
    new GLTFLoader().load('/models/hydra/hydra.gltf', (gltf) => {
        gltf.scene.children[0].material = textMat
        gltf.scene.rotation.y = Math.PI / 2
        gltf.scene.position.set(0, config.SPLASH_HYDRA_Y, config.SPLASH_HYDRA_Z)
        scene.add(gltf.scene)
        hydra = gltf.scene
    })

    new FontLoader().load('/fonts/kenyan_coffee/KenyanCoffeeRegular.json', (font) => {
        const geom = new TextGeometry('Hydrametry Software', {
            font,
            size: config.LOGO_TEXT_SIZE,
            depth: config.LOGO_TEXT_DEPTH,
            curveSegments: config.LOGO_TEXT_CURVE_SEGMENTS,
            bevelSize: config.LOGO_TEXT_BEVEL_SIZE,
            bevelThickness: config.LOGO_TEXT_BEVEL_THICKNESS,
            bevelOffset: 0,
            bevelEnabled: true,
        })
        geom.center()
        const text = new THREE.Mesh(geom, textMat)
        text.position.set(0, config.SPLASH_TEXT_Y, config.SPLASH_TEXT_Z)
        scene.add(text)

        const cubeGeom = new THREE.BoxGeometry(1, 1, 1)
        for (let i = 0; i < config.SPLASH_CUBE_COUNT; i++) {
            const cube = new THREE.Mesh(cubeGeom, textMat)
            const spread = config.SPLASH_CUBE_SPREAD
            cube.position.set((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread)
            cube.rotation.x = Math.random() * Math.PI
            cube.rotation.y = Math.random() * Math.PI
            const s = Math.random() - 0.25
            cube.scale.set(s, s, s)
            scene.add(cube)
        }
    })

    // Two wireframe floors, above and below the camera.
    const floorMat = new THREE.MeshBasicMaterial({ wireframe: true, side: THREE.DoubleSide, color: 0x6fbf2f })
    for (const y of [-config.SPLASH_FLOOR_Y, config.SPLASH_FLOOR_Y]) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 100, 100), floorMat)
        floor.rotation.x = -Math.PI / 2
        floor.position.y = y
        floor.scale.setScalar(config.SPLASH_FLOOR_SIZE)
        scene.add(floor)
    }

    // Screen y of the hydra's lowest point, in px from the top. Null until the hydra has loaded.
    const bottomPx = () => {
        if (!hydra) return null
        const box = new THREE.Box3().setFromObject(hydra)
        const anchor = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2)
        anchor.project(camera)
        return ((1 - anchor.y) / 2) * window.innerHeight
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.BG_MAX_PIXEL_RATIO))
    })

    const clock = new THREE.Clock()
    const tick = () => {
        const dt = clock.getDelta()
        if (hydra) hydra.rotation.y += dt * config.SPLASH_HYDRA_SPIN_SPEED
        renderer.render(scene, camera)
        onFrame?.(bottomPx())
        requestAnimationFrame(tick)
    }
    tick()
}
