import './style.css'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { tilt } from './tilt.js'
import { config } from './config.js'

// spatooJr: Unity BoidsInSpace backdrop. Nebula skybox + stars + a flock of BoidFodder meshes.
// Skybox source: Unity TestBox2 (Assets/Textures/Skyboxes/swap.png), a 4x3 cross layout.
// Flock rules follow Assets/Scripts/AI/Boid (separation, cohesion, alignment) with the cage
// steering back in place of Unity's obstacle avoidance. Units are scaled down for the site.
// Every tunable number comes from config.js (override with APP_<KEY> env vars in the container).

const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.BG_MAX_PIXEL_RATIO))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.add(new THREE.AmbientLight(0xffffff, config.BG_AMBIENT_INTENSITY))
const sun = new THREE.DirectionalLight(0xffffff, config.BG_SUN_INTENSITY)
sun.position.set(1, 2, 3)
scene.add(sun)
const camera = new THREE.PerspectiveCamera(
    config.BG_CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    config.BG_CAMERA_NEAR,
    config.BG_CAMERA_FAR,
)
scene.add(camera)

// Swarm centre, in front of the camera (camera looks down -z).
const CENTER = new THREE.Vector3(0, 0, config.BG_CENTER_Z)

// Cross cell (col,row) for each cube face, in CubeTexture order: +x, -x, +y, -y, +z, -z.
const FACE_CELLS = [[2, 1], [0, 1], [1, 0], [1, 2], [1, 1], [3, 1]]

function sliceCross(img) {
    const cell = img.width / 4
    const face = config.BG_SKY_FACE_PX
    return FACE_CELLS.map(([col, row]) => {
        const c = document.createElement('canvas')
        c.width = c.height = face
        c.getContext('2d').drawImage(img, col * cell, row * cell, cell, cell, 0, 0, face, face)
        return c
    })
}

new THREE.ImageLoader().load('/textures/space/swap.png', (img) => {
    const cube = new THREE.CubeTexture(sliceCross(img))
    cube.colorSpace = THREE.SRGBColorSpace
    cube.needsUpdate = true
    scene.background = cube
})

// Stars on top of the nebula.
const starCount = config.BG_STAR_COUNT
const starPos = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
    const r = config.BG_STAR_MIN_RADIUS + Math.random() * config.BG_STAR_RADIUS_RANGE
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = r * Math.cos(phi)
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
}
const starGeom = new THREE.BufferGeometry()
starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
scene.add(new THREE.Points(starGeom, new THREE.PointsMaterial({
    color: 0xffffff,
    size: config.BG_STAR_SIZE,
    sizeAttenuation: false,
})))

// Boids.
const COUNT = config.FLOCK_COUNT
const INNER = config.FLOCK_INNER_RADIUS   // separation radius
const OUTER = config.FLOCK_OUTER_RADIUS   // cohesion/alignment radius
const SPEED = config.FLOCK_SPEED
const MAX_GROUP_SIZE = config.FLOCK_MAX_GROUP_SIZE // GroupedBoidManager.maxBoidGroupSize: boids only flock with their own group
const CAGE_R = config.FLOCK_CAGE_RADIUS   // soft boundary around CENTER
const CAGE_STRENGTH = config.FLOCK_CAGE_STRENGTH
const MODEL_LENGTH = config.FLOCK_MODEL_LENGTH // longest side of the assembled fodder, in scene units
const SEPARATION_WEIGHT = config.FLOCK_SEPARATION_WEIGHT
const COHESION_WEIGHT = config.FLOCK_COHESION_WEIGHT
const ALIGNMENT_WEIGHT = config.FLOCK_ALIGNMENT_WEIGHT
const STEER_RATE = config.FLOCK_STEER_RATE
const MIN_SPEED = SPEED * config.FLOCK_MIN_SPEED_RATIO
const SPAWN_RADIUS = config.FLOCK_SPAWN_RADIUS

// Groups of boids, as in GroupedBoidManager: each group is a list of boid refs.
const groups = []

// Mirrors GroupedBoidManager.Register: join the group whose centroid is nearest among those with room,
// otherwise start a new group.
function registerBoid(b) {
    let best = null
    let bestSqr = Infinity
    for (const g of groups) {
        if (g.length >= MAX_GROUP_SIZE) continue
        const centroid = new THREE.Vector3()
        for (const m of g) centroid.add(m.p)
        centroid.divideScalar(g.length)
        const sqr = b.p.distanceToSquared(centroid)
        if (sqr < bestSqr) { bestSqr = sqr; best = g }
    }
    if (!best) {
        best = []
        groups.push(best)
    }
    best.push(b)
    b.group = best
}

const boids = []
for (let i = 0; i < COUNT; i++) {
    const p = new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * SPAWN_RADIUS).add(CENTER)
    const v = new THREE.Vector3().randomDirection().multiplyScalar(SPEED)
    const b = { p, v, index: i, group: null }
    boids.push(b)
    registerBoid(b)
}

// Filled in once the FBX has loaded: one InstancedMesh per submesh of each part.
const flocks = []
let modelScale = 1

// Materials from Unity: Fodder.mat (textured toon, gradient B2) and EnemyEyes.mat (gradient C1).
const texLoader = new THREE.TextureLoader()
const nearest = (t) => { t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; return t }
const bodyMap = texLoader.load('/textures/fodder/body-mk4.png'); bodyMap.colorSpace = THREE.SRGBColorSpace
const bodyToon = new THREE.MeshToonMaterial({ map: bodyMap, gradientMap: nearest(texLoader.load('/textures/fodder/gradient-b2.png')) })
const eyeMap = texLoader.load('/textures/fodder/gradient-c1.png'); eyeMap.colorSpace = THREE.SRGBColorSpace
const eyeToon = new THREE.MeshToonMaterial({ map: nearest(eyeMap) })

// Prefab BoidFodder: Body at 0, LeftWing at x=-2.865, RightWing at x=+2.865 (Gun.L / Gun.R in the FBX).
// Trail (TrailRenderer) and RadarIndicator (HUD arrow, scale 2500) are not drawn.
const PART_X = { Body: 0, GunL: -2.865, GunR: 2.865 }
const materialFor = (name) => (name === 'Infantry.Eyes' ? eyeToon : bodyToon)

new FBXLoader().load('/models/fodder/fodder.fbx', (fbx) => {
    const parts = []
    fbx.traverse((o) => {
        if (!o.isMesh) return
        const key = Object.keys(PART_X).find((k) => o.name.endsWith(k))
        if (key) parts.push({ x: PART_X[key], geom: o.geometry, mats: Array.isArray(o.material) ? o.material : [o.material] })
    })
    if (parts.length === 0) {
        console.error('spatooJr: no Body/GunL/GunR meshes in fodder.fbx')
        return
    }

    // Fit the assembled model to MODEL_LENGTH.
    const box = new THREE.Box3()
    for (const p of parts) {
        p.geom.computeBoundingBox()
        box.union(p.geom.boundingBox.clone().translate(new THREE.Vector3(p.x, 0, 0)))
    }
    const size = box.getSize(new THREE.Vector3())
    modelScale = MODEL_LENGTH / Math.max(size.x, size.y, size.z)

    for (const p of parts) {
        for (const g of p.geom.groups) {
            const geom = p.geom.clone()
            geom.clearGroups()
            geom.setDrawRange(g.start, g.count)
            const mesh = new THREE.InstancedMesh(geom, materialFor(p.mats[g.materialIndex]?.name), COUNT)
            mesh.userData.offset = new THREE.Matrix4().makeTranslation(p.x, 0, 0)
            flocks.push(mesh)
            scene.add(mesh)
        }
    }
})

const tmpDiff = new THREE.Vector3()
const tmpSep = new THREE.Vector3()
const tmpCoh = new THREE.Vector3()
const tmpAli = new THREE.Vector3()
const tmpDesired = new THREE.Vector3()
const dummy = new THREE.Object3D()
const partMatrix = new THREE.Matrix4()

function stepFlock(dt) {
    for (let i = 0; i < COUNT; i++) {
        const b = boids[i]
        tmpSep.set(0, 0, 0)
        tmpCoh.set(0, 0, 0)
        tmpAli.set(0, 0, 0)
        let nRing = 0

        // Neighbours come from this boid's group only (GroupedBoidManager.GetRelevantBoids).
        for (const o of b.group) {
            if (o === b) continue
            tmpDiff.subVectors(b.p, o.p)
            const d = tmpDiff.length()
            if (d < INNER) {
                if (d > 1e-4) tmpSep.addScaledVector(tmpDiff, (INNER - d) / d)
            } else if (d < OUTER) {
                tmpCoh.add(o.p)
                tmpAli.add(o.v)
                nRing++
            }
        }

        tmpDesired.copy(tmpSep).multiplyScalar(SEPARATION_WEIGHT)
        if (nRing > 0) {
            tmpCoh.divideScalar(nRing).sub(b.p)
            tmpAli.divideScalar(nRing)
            tmpDesired.addScaledVector(tmpCoh, COHESION_WEIGHT).addScaledVector(tmpAli, ALIGNMENT_WEIGHT)
        }

        // Cage: push back toward CENTER beyond CAGE_R.
        tmpDiff.subVectors(b.p, CENTER)
        const off = tmpDiff.length()
        if (off > CAGE_R) tmpDesired.addScaledVector(tmpDiff, -((off - CAGE_R) * CAGE_STRENGTH) / off)

        b.v.addScaledVector(tmpDesired, dt * STEER_RATE)
        // Keep speed in a band so the flock never stalls or runs away.
        const sp = b.v.length()
        if (sp > SPEED) b.v.multiplyScalar(SPEED / sp)
        else if (sp < MIN_SPEED) b.v.setLength(MIN_SPEED)

        b.p.addScaledVector(b.v, dt)

        dummy.position.copy(b.p)
        dummy.lookAt(b.p.x + b.v.x, b.p.y + b.v.y, b.p.z + b.v.z)
        dummy.scale.setScalar(modelScale)
        dummy.updateMatrix()
        for (const mesh of flocks) {
            partMatrix.multiplyMatrices(dummy.matrix, mesh.userData.offset)
            mesh.setMatrixAt(i, partMatrix)
        }
    }
    for (const mesh of flocks) mesh.instanceMatrix.needsUpdate = true
}

// Cursor parallax: the camera drifts slightly and always looks at the swarm.
const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (e) => {
    cursor.x = e.clientX / window.innerWidth - 0.5
    cursor.y = e.clientY / window.innerHeight - 0.5
})

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.BG_MAX_PIXEL_RATIO))
})

const clock = new THREE.Clock()
const tick = () => {
    const dt = Math.min(clock.getDelta(), config.BG_MAX_FRAME_DT)
    stepFlock(dt)
    // Touch devices use the gyro; desktop uses the mouse.
    const px = tilt.active ? tilt.x : cursor.x
    const py = tilt.active ? tilt.y : cursor.y
    // Parallax sensitivity: how far the camera moves for a full -0.5..0.5 input range.
    camera.position.set(px * config.PARALLAX_X, py * config.PARALLAX_Y, 0)
    camera.lookAt(CENTER)
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
}
tick()
