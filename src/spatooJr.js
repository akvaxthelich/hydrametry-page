import './style.css'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

// spatooJr: Unity BoidsInSpace backdrop. Nebula skybox + stars + a flock of BoidFodder meshes.
// Skybox source: Unity TestBox2 (Assets/Textures/Skyboxes/swap.png), a 4x3 cross layout.
// Flock rules follow Assets/Scripts/AI/Boid (separation, cohesion, alignment) with the cage
// steering back in place of Unity's obstacle avoidance. Units are scaled down for the site.

const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.add(new THREE.AmbientLight(0xffffff, 1.2))
const sun = new THREE.DirectionalLight(0xffffff, 2.5)
sun.position.set(1, 2, 3)
scene.add(sun)
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
scene.add(camera)

// Swarm centre, in front of the camera (camera looks down -z).
const CENTER = new THREE.Vector3(0, 0, -60)

// Cross cell (col,row) for each cube face, in CubeTexture order: +x, -x, +y, -y, +z, -z.
const FACE_CELLS = [[2, 1], [0, 1], [1, 0], [1, 2], [1, 1], [3, 1]]

function sliceCross(img) {
    const cell = img.width / 4
    return FACE_CELLS.map(([col, row]) => {
        const c = document.createElement('canvas')
        c.width = c.height = 1024
        c.getContext('2d').drawImage(img, col * cell, row * cell, cell, cell, 0, 0, 1024, 1024)
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
const starCount = 3000
const starPos = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
    const r = 300 + Math.random() * 500
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = r * Math.cos(phi)
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
}
const starGeom = new THREE.BufferGeometry()
starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
scene.add(new THREE.Points(starGeom, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false })))

// Boids.
const COUNT = 60
const INNER = 5      // separation radius
const OUTER = 10     // cohesion/alignment radius
const SPEED = 12
const MAX_GROUP_SIZE = 6 // GroupedBoidManager.maxBoidGroupSize: boids only flock with their own group
const CAGE_R = 35    // soft boundary around CENTER
const MODEL_LENGTH = 3 // longest side of the assembled fodder, in scene units

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
    const p = new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 20).add(CENTER)
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

        tmpDesired.copy(tmpSep).multiplyScalar(1.2)
        if (nRing > 0) {
            tmpCoh.divideScalar(nRing).sub(b.p)
            tmpAli.divideScalar(nRing)
            tmpDesired.addScaledVector(tmpCoh, 0.6).addScaledVector(tmpAli, 0.6)
        }

        // Cage: push back toward CENTER beyond CAGE_R.
        tmpDiff.subVectors(b.p, CENTER)
        const off = tmpDiff.length()
        if (off > CAGE_R) tmpDesired.addScaledVector(tmpDiff, -((off - CAGE_R) * 2) / off)

        b.v.addScaledVector(tmpDesired, dt * 4)
        // Keep speed in a band so the flock never stalls or runs away.
        const sp = b.v.length()
        if (sp > SPEED) b.v.multiplyScalar(SPEED / sp)
        else if (sp < SPEED * 0.5) b.v.setLength(SPEED * 0.5)

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const clock = new THREE.Clock()
const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.05)
    stepFlock(dt)
    camera.position.set(cursor.x * 6, cursor.y * 4, 0)
    camera.lookAt(CENTER)
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
}
tick()
