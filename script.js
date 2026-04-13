import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

const app = document.getElementById('app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0000ff);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
app.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

const gridSize = 10;
const tileWidth = 1;
const tileDepth = 1;
const tileHeight = 0.1;
const center = (gridSize - 1) / 2;

const tileGeometry = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);

for (let x = 0; x < gridSize; x += 1) {
    for (let z = 0; z < gridSize; z += 1) {
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const tileMaterial = new THREE.MeshBasicMaterial({color});
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(x - center, 0, z - center);
        scene.add(tile);
    }
}

camera.position.set(0, 10, 0);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const animate = () => {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();