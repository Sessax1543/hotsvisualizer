import * as THREE from 'https://cdn.skypack.dev/three@0.132.2'

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/*
var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5
);
camera.position.z = 5;
*/

// map size 248 x 216

var map_w = 248
var map_h = 216

var a = 245
var b = 150

var camera = new THREE.OrthographicCamera( a / - 2, a / 2, b / 2, b / - 2, -10, 10 );

var scene = new THREE.Scene();

{
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
}

const loader = new THREE.TextureLoader();
//const bgTexture = loader.load('https://static.heroesofthestorm.com/images/battlegrounds/maps/tomb-of-the-spider-queen/map-full-8cc5c93b80.jpg');
const bgTexture = loader.load('../img/map_cropped.jpg');
scene.background = bgTexture;

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    //camera.updateProjectionMatrix();
})

/*
var geometry = new THREE.SphereGeometry(1, 10 ,10);
var material = new THREE.MeshLambertMaterial({color: 0x00FF00});
var mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
mesh.position.setX(45);
mesh.position.setY(0);
mesh.position.setZ(0);
console.log(mesh.position.x);
console.log(mesh.position.y);
*/

const verticies = []

document.addEventListener('keypress', processKey);

function processKey(e) {
    listOfPositions.forEach(e => verticies.push(e.point.x - map_w / 2, e.point.y - map_h / 2, 0))
    console.log(verticies)
    
    var dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( verticies, 3 ) );
    var dotMaterial = new THREE.PointsMaterial( { color: 0x00FF00, size: 10 } );
    var dot = new THREE.Points( dotGeometry, dotMaterial );
    scene.add( dot );
    
}

//listOfPositions.forEach(e => verticies.push(e.point.x, e.point.y, 0))

/*
var dotGeometry = new THREE.BufferGeometry();
dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( new THREE.Vector3(36 - map_w / 2, 131 - map_h / 2, 0).toArray(), 3 ) );
var dotMaterial = new THREE.PointsMaterial( { color: 0x888888, size: 10 } );
var dot = new THREE.Points( dotGeometry, dotMaterial );
scene.add( dot );
*/

function render() {
    requestAnimationFrame(render);

    //main loop

    var done_once = false
    if(listOfPositions.length && !done_once) {
        //listOfPositions.forEach(e => verticies.push(e.point.x, e.point.y, 0))
        //console.log(verticies)
        done_once = true
    }

    renderer.render(scene, camera);
}

render();