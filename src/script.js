import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'


// 
// Canvas
const canvas = document.querySelector('canvas.webgl')
//comment
// Scene
const gui = new GUI()
const scene = new THREE.Scene()

const textureLoader = new THREE.TextureLoader()
const fontLoader = new FontLoader()


/**
 * Object
 * Prims can be found in BufferGeometry docs
 */

/**
 * Lights
 */

//Ambient
const ambientLight = new THREE.AmbientLight(0x6fbf2f, 1) 
scene.add(ambientLight)
gui.add(ambientLight, 'intensity').min(0).max(3).step(0.001)

const directionalLight = new THREE.DirectionalLight(0x00fffc, 0.9)
scene.add(directionalLight)
directionalLight.position.set(1,.25,0)

const hemisphereLight = new THREE.HemisphereLight(0x6fbf2f, 0x001100, 0.9)
scene.add(hemisphereLight)

const pointLight = new THREE.PointLight(0xff9000, 1.5, 0, 2)
scene.add(pointLight)

//Rect area light like photoshoot
const rectAreaLight = new THREE.RectAreaLight(0x4e00ff,6,1,1)
scene.add(rectAreaLight)
rectAreaLight.position.set(-1.5, 0, 1.5)
rectAreaLight.lookAt(new THREE.Vector3())

const spotLight = new THREE.SpotLight(0x78ff00, 4.5,10, Math.PI * 0.1, 0.25, 1)
spotLight.position.set(0, 2, 3)
scene.add(spotLight.target)
scene.add(spotLight)

const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 0.2)
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.2)
const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2)
const spotLightHelper = new THREE.SpotLightHelper(spotLight)

scene.add(hemisphereLightHelper)
scene.add(directionalLightHelper)
scene.add(pointLightHelper)
scene.add(spotLightHelper)
/**
 * Lighting Test Objects
 */
const litMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.4
})
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 64, 64),
    litMaterial
)
sphere.position.x = -1.5
const box = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    litMaterial
)
sphere.position.x = -1.5

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.2, 64, 128),
    litMaterial
)
torus.position.x = 1.5
const group = new THREE.Group()
group.position.z = -2

group.add(sphere, torus, box)
scene.add(group)


const matcapTexture = textureLoader.load('/textures/matcaps/10.png')
matcapTexture.colorSpace = THREE.SRGBColorSpace
const textAndTorusMat = new THREE.MeshMatcapMaterial({matcap:matcapTexture, wireframe: false})

let textMesh
fontLoader.load(
    '/fonts/kenyan_coffee/KenyanCoffeeRegular.json',
    (font) => 
    {
        const textGeometry = new TextGeometry(
        'Hydrametry Software', {
        font: font,
        size: 0.5,
        depth: 0.1,
        curveSegments: 12,
        bevelSize: 0.02,
        bevelThickness: 0.15,
        bevelOffset: 0,
        bevelEnabled: true
        
            }
        )
        textGeometry.computeBoundingBox() //doing the translation on the geometry itself makes sure that the geom is centered in the mesh 
        // textGeometry.translate(
        //     - textGeometry.boundingBox.max.x * 0.5,
        //     - textGeometry.boundingBox.max.y * 0.5,
        //     - textGeometry.boundingBox.max.z * 0.5)
        textGeometry.center() // ^ same as the above

        
                const textMesh = new THREE.Mesh(textGeometry, litMaterial)
                textMesh.position.y = -.6
        
        scene.add(textMesh)
        const cubeGeom = new THREE.BoxGeometry(1,1,1)
        for(let i = 0; i< 100; i++){
            
            const cubeMesh = new THREE.Mesh(cubeGeom, textAndTorusMat)

            cubeMesh.position.set((Math.random() - 0.5) * 100,(Math.random() - 0.5) * 100,(Math.random() - 0.5) * 100)

            cubeMesh.rotation.x = Math.random() * Math.PI
            cubeMesh.rotation.y = Math.random() * Math.PI

            const scale = Math.random() - .25
            cubeMesh.scale.set(scale,scale,scale)

            scene.add(cubeMesh)

        }
    }
)

/**
 * Floor Plane
 */
const planeMat = new THREE.MeshBasicMaterial({wireframe:true, side: THREE.DoubleSide, color: 0x6fbf2f})

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1, 50, 50),
    planeMat
)
plane.rotation.x = - Math.PI / 2 
plane.position.y = -1
const planeScale = 75
plane.scale.set(planeScale,planeScale,planeScale)
scene.add(plane)
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 100)

// const camera = new THREE.OrthographicCamera(-1 * aspectRatio, 1 * aspectRatio, 1, -1, 0.1, 100)
camera.position.z = 3
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

window.addEventListener('dblclick', (event) => {

    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    console.log('double click occurred')

    if(!fullscreenElement){
        if(canvas.requestFullscreen){
            canvas.requestFullscreen()
        }
        else if(canvas.webkitRequestFullscreen){
            canvas.webkitRequestFullscreen()
        }
    }

    else{
        if(document.exitFullscreen){
            document.exitFullscreen()
        }
        else if(document.webkitExitFullscreen){
            document.webkitExitFullscreen()
        }
    }

})


renderer.setSize(sizes.width, sizes.height)
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
//controls
const controls = new OrbitControls(camera, canvas)

controls.enableDamping = true

let time = Date.now() //init here

const clock = new THREE.Clock()

//gsap.to(mesh.position, {duration: 1, delay: 1, x:2})


const tick = () => {

    const elapsedTime = clock.getElapsedTime()
    //Time
    const currentTime = Date.now()
    const deltaTime = currentTime - time 
    time = currentTime //update our outside var

    

    

    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick) //calls the function on the next available frame, but since we use 'tick' it calls this function infinitely
}

tick()


