import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const imageSource = '/image.png' //can only do this because of Vite and Static folder
console.log(imageSource)
/**
 * Images/Textures
 */
const loadingManager = new THREE.LoadingManager()
loadingManager.onStart = () => {
    console.log('loading started')
}
loadingManager.onLoad = () => {
    console.log('loading finished')
}
loadingManager.onProgress = () => {
    console.log('loading progressing')
}
loadingManager.onError = () => {
    console.log('loading error')
}

const textureLoader = new THREE.TextureLoader(loadingManager) //mutualization + notify when multiple images are loaded
//can send three functions after the path, in order they are finished, loading, and error
//const colorTexture = textureLoader.load('/textures/door/color.jpg') 
const colorTexture = textureLoader.load('/textures/minecraft.png')
colorTexture.colorSpace = THREE.SRGBColorSpace
// colorTexture.repeat.x = 2
// colorTexture.repeat.y = 3
// colorTexture.wrapS = THREE.MirroredRepeatWrapping
// colorTexture.wrapT = THREE.MirroredRepeatWrapping
// colorTexture.offset.x = 0.5
// colorTexture.offset.y = 0.5

colorTexture.center.x = 0.5
colorTexture.center.y = 0.5

colorTexture.minFilter = THREE.NearestFilter //can disable this entirely if you're gonna use nearest, instead doing:
colorTexture.generateMipmaps = false
colorTexture.magFilter = THREE.NearestFilter
// colorTexture.rotation = Math.PI * 0.25

    // poliigon.com
    // 3dtextures.me
    // arroway-textures.ch


const alphaTexture = textureLoader.load('/textures/door/alpha.jpg')
const heightTexture = textureLoader.load('/textures/door/height.jpg')
const metalTexture = textureLoader.load('/textures/door/metalness.jpg')
const ambOccTexture = textureLoader.load('/textures/door/ambientOcclusion.jpg')
const normalTexture = textureLoader.load('/textures/door/roughness.jpg')

// 
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Object
 * Prims can be found in BufferGeometry docs
 */
//const geometry = new THREE.SphereGeometry(1, 32, 32)
const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2)


const material = new THREE.MeshBasicMaterial({ map: colorTexture, wireframe: false })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

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
//Delta time bit (let used here since this var changes)



let time = Date.now() //init here

const clock = new THREE.Clock()

//gsap.to(mesh.position, {duration: 1, delay: 1, x:2})


const tick = () => {

    const elapsedTime = clock.getElapsedTime()
    //Time
    const currentTime = Date.now()
    const deltaTime = currentTime - time 
    time = currentTime //update our outside var
    //update object 
    // colorTexture.rotation += (Math.PI * 0.25) * deltaTime * 0.001
controls.update()
    //    mesh.rotation.y += 0.01 * deltaTime
    // mesh.rotation.y = Math.cos(elapsedTime)
    // mesh.rotation.x = Math.sin(elapsedTime)

    // camera.position.x = cursor.x * lookSpeed
    // camera.position.y = cursor.y * lookSpeed

    

    //circle cam
    // camera.position.x = Math.sin(cursor.x * Math.PI * 2) * 2
    // camera.position.z = Math.cos(cursor.x * Math.PI * 2) * 2
    
    // camera.position.y = cursor.y * 3

    // camera.lookAt(mesh.position)

    //     // camera.lookAt(mesh.position)

    //re-render the scene with the modification
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick) //calls the function on the next available frame, but since we use 'tick' it calls this function infinitely
}

tick()


// const material = new THREE.MeshBasicMaterial({
//     map: doorColorTexture,
//     alphaMap: doorAlphaTexture,
//     side: THREE.DoubleSide,
//     color: '#ff0000',
//     wireframe: false,
//     opacity: 0.5,
//     transparent: true

//     })
// const material = new THREE.MeshNormalMaterial({
//     flatShading: false
// })

// const material = new THREE.MeshMatcapMaterial({
//     matcap: matcapTexture
// })
// const material = new THREE.MeshDepthMaterial()
// const material = new THREE.MeshLambertMaterial()
// const material = new THREE.MeshPhongMaterial({
//     shininess: 100,
//     specular: 0x1188ff
// })

// gradientTexture.minFilter = THREE.NearestFilter //nearestfilter doesnt use mipmap versions of tex, so we can disable them
// gradientTexture.magFilter = THREE.NearestFilter
// gradientTexture.generateMipmaps = false
// const material = new THREE.MeshToonMaterial({
//     gradientMap: gradientTexture //will not work on its own as the gpu will blend pixels
// })
const material = new THREE.MeshPhysicalMaterial({
    metalnessMap: doorMetalnessTexture,
    roughnessMap: doorRoughnessTexture,
    map: doorColorTexture,
    aoMap: doorAmbientOcclusionTexture,
    aoMapIntensity: 1,
    displacementMap: doorHeightTexture,
    displacementScale: 0.1,
    normalMap: doorNormalTexture,
    transparent: true,
    alphaMap: doorAlphaTexture,
    // clearcoat: 1,
    // clearcoatRoughness: 1
    // sheen: 1,
    // sheenRoughness: 1,
    // iridescence: 1,
    // iridescenceIOR: 1,
    transmission: 1,
    ior: 1.5,
    thickness: 0.5
    
})
// const material = new THREE.MeshStandardMaterial({
//     metalnessMap: doorMetalnessTexture,
//     roughnessMap: doorRoughnessTexture,
//     map: doorColorTexture,
//     aoMap: doorAmbientOcclusionTexture,
//     aoMapIntensity: 1,
//     displacementMap: doorHeightTexture,
//     displacementScale: 0.1,
//     normalMap: doorNormalTexture,
//     transparent: true,
//     alphaMap: doorAlphaTexture
// })
// material.normalScale.set(0.5,0.5)
/**
 * Lights
 */

// const ambientLight = new THREE.AmbientLight(0xffffff, 1)
// const pointLight = new THREE.PointLight(0xFFFFFF, 30)
// pointLight.position.x = 2
// pointLight.position.y = 3
// pointLight.position.z = 4
// scene.add(ambientLight, pointLight)
// const textureLoader = new THREE.TextureLoader()

// const doorColorTexture = textureLoader.load('./textures/door/color.jpg')
// const doorAlphaTexture = textureLoader.load('./textures/door/alpha.jpg')
// const doorAmbientOcclusionTexture = textureLoader.load('./textures/door/ambientOcclusion.jpg')
// const doorHeightTexture = textureLoader.load('./textures/door/height.jpg')
// const doorNormalTexture = textureLoader.load('./textures/door/normal.jpg')
// const doorMetalnessTexture = textureLoader.load('./textures/door/metalness.jpg')
// const doorRoughnessTexture = textureLoader.load('./textures/door/roughness.jpg')

// const matcapTexture = textureLoader.load('./textures/matcaps/8.png')
// const gradientTexture = textureLoader.load('./textures/gradients/5.jpg')

// doorColorTexture.colorSpace = THREE.SRGBColorSpace
// matcapTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Environment Map
 */    //    mesh.rotation.y += 0.01 * deltaTime
    // mesh.rotation.y = Math.cos(elapsedTime)
    // mesh.rotation.x = Math.sin(elapsedTime)

    // camera.position.x = cursor.x * lookSpeed
    // camera.position.y = cursor.y * lookSpeed

    

    //circle cam
    // camera.position.x = Math.sin(cursor.x * Math.PI * 2) * 2
    // camera.position.z = Math.cos(cursor.x * Math.PI * 2) * 2
    
    // camera.position.y = cursor.y * 3

    // camera.lookAt(mesh.position)

    //     // camera.lookAt(mesh.position)

    //re-render the scene with the modification
// const rgbeLoader = new RGBELoader()
// rgbeLoader.load('./textures/environmentMap/2k.hdr', (environmentMap) => {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping

//     scene.background = environmentMap
//     scene.environment = environmentMap
// })
