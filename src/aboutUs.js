import './style.css'
import * as THREE from 'three'
import * as UTILS from './UTILS.js'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

//Loaders
const fbxl = new FBXLoader()
const gltfl = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()
const fontLoader = new FontLoader()
// const gui = new GUI()
// Canvas
const canvas = document.querySelector('canvas.webgl')


// Scene

const scene = new THREE.Scene()
let currentScene = scene


//Ambient
const matcapTexture = textureLoader.load('/textures/matcaps/13.png')
matcapTexture.colorSpace = THREE.SRGBColorSpace
const textMat = new THREE.MeshMatcapMaterial({matcap:matcapTexture, wireframe: false})

/**
 * Floor Plane
 */

const planeGroup = new THREE.Group()
const planeMat = new THREE.MeshBasicMaterial({wireframe:true, side: THREE.DoubleSide, color: 0xff00aa})
const planeScale = 1000
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1, 100, 100),
    planeMat
)
plane.rotation.x = - Math.PI / 2 
plane.position.y = -15
plane.scale.set(planeScale,planeScale,planeScale)
planeGroup.add(plane)

const plane2 = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1, 100, 100),
    planeMat
)
plane2.rotation.x = - Math.PI / 2 
plane2.position.y = 15

plane2.scale.set(planeScale,planeScale,planeScale)
planeGroup.add(plane2)

planeGroup.rotation.z = Math.PI / 2
scene.add(planeGroup)
/**
 * Lights
 */

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

//look speed
const lookSpeed = 5


/**
 * Camera
 */
//small angles 'zoom' (obvious)
//wide angles have to squeeze more into the camera view, thus 'fisheye'. usually 45-75 is good
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500)

// const camera = new THREE.OrthographicCamera(-1 * aspectRatio, 1 * aspectRatio, 1, -1, 0.1, 100)
camera.position.z = 0
camera.position.y = 5
camera.rotation.y;
scene.add(camera)

/**
 * Cursor
 */
const cursor = {
    x:0,
    y:0
}
window.addEventListener('mousemove', (event) => {

    cursor.x = event.clientX / sizes.width - 0.5 
    cursor.y = - (event.clientY / sizes.height - 0.5) //negated because otherwise cam position on y goes opposite (y goes down on cursor)
    /** direct from article (works like spatoo)
     * Dividing event.clientX by sizes.width will give us a value between 0 and 1 (if we keep the cursor above the canvas) 
     * while subtracting 0.5 will give you a value between - 0.5 and 0.5.
     */

})

window.addEventListener('resize', (event) => {

    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //pixel ratio can change for a lot of reasons but usually when resize occurs
})

function onDoubleClick(event){
    UTILS.fadeInOrOut()
    UTILS.hideScreenText()    
    UTILS.buttonfadeIn()    
    window.removeEventListener('dblclick')
}
window.addEventListener('dblclick', onDoubleClick)


renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
//controls
// const controls = new OrbitControls(camera, canvas)

// controls.enableDamping = true

let time = Date.now() //init here

const clock = new THREE.Clock()

//gsap.to(mesh.position, {duration: 1, delay: 1, x:2})



const tick = () => {

    const elapsedTime = clock.getElapsedTime()
    //Time 
    const deltaTime = elapsedTime - time 
    time = elapsedTime //update our outside var
        // controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick) //calls the function on the next available frame, but since we use 'tick' it calls this function infinitely
}

tick()


