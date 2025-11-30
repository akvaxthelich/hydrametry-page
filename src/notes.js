import * as THREE from 'three'
//Canvas -> Renderer result is drawn here
const canvas = document.querySelector('canvas.webgl')
//Sizes (aspect ratio)
const sizes = {
    width: 800,
    height: 600
}
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.setSize(sizes.width, sizes.height)
// need scene, objects, camera, renderer.

const scene = new THREE.Scene()
const axesHelper = new THREE.AxesHelper(2)
scene.add(axesHelper)
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({color : 0xFF0000}) //red material

const mesh = new THREE.Mesh(geometry, material)

scene.add(mesh)

mesh.position.x = .8
mesh.position.y = -.6
mesh.position.z = 1

mesh.scale.x = 2
mesh.scale.y = 0.25
mesh.scale.z = 0.5

mesh.rotation.x = Math.PI * 0.25
mesh.rotation.y = Math.PI * 0.25


//Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3
scene.add(camera)

console.log(mesh.position.length())
console.log(mesh.position.distanceTo(camera.position))
console.log(mesh.position.normalize())

// mesh.position.set(2, .5, -4)

// camera.lookAt(new THREE.Vector3(0, 0, 0))

camera.lookAt(mesh.position)

// const image = new Image()
// image.onload = () => {
//     alert('it worked stop just fucking relax,')
// }
// image.src = '/textures/door/color.jpg' //native js onload


/**
 * Objects
 */

// const geometry = new THREE.BufferGeometry()

// const count = 50 //50 tris * 3 vertices each * 3 positions for each vertex

// const positionsArray = new Float32Array(count * 3 * 3)
// for(let i = 0; i < count * 3 * 3; i++){
//     positionsArray[i] = (Math.random() - 0.5) * 4
// }

// //this needs to be a buffer attribute first
// const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3)
// //then send it to the geom
// geometry.setAttribute('position', positionsAttribute)

// const positionsArray = new Float32Array(9)

// //Vertex 1
// positionsArray[0] = 0
// positionsArray[1] = 0
// positionsArray[2] = 0

// //vertex 2
// positionsArray[3] = 0
// positionsArray[4] = 1
// positionsArray[5] = 0
// //vertex 3
// positionsArray[6] = 1
// positionsArray[7] = 0
// positionsArray[8] = 0


const group = new THREE.Group()
group.scale.y = 2
group.rotation.y = 0.2
scene.add(group)

const cube1 = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({color: 0x00ff00})
)
cube1.position.x = -1.5
group.add(cube1)

const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({color: 0x0000ff})
)

cube2.position.x = 0
group.add(cube2)

const cube3 = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({color: 0xff000})
)
cube3.position.x = 1.5

group.add(cube3)
renderer.render(scene, camera)
