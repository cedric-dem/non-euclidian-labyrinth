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

const gridSize = 9;
const tileWidth = 1;
const tileDepth = 1;
const tileHeight = 0.1;
const center = (gridSize - 1) / 2;
const minGridIndex = 0;
const maxGridIndex = gridSize - 1;

const tileGeometry = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);

for (let x = 0; x < gridSize; x += 1) {
    for (let z = 0; z < gridSize; z += 1) {
        var color = new THREE.Color(Math.random(), Math.random(), Math.random());
        if ((x + z) % 2 === 0) {
            color = new THREE.Color(0.9, 0.9, 0.9);
        } else {
            color = new THREE.Color(0.5, 0.5, 0.5);
        }
        const tileMaterial = new THREE.MeshBasicMaterial({color});
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(x - center, 0, z - center);
        scene.add(tile);
    }
}

const characterHeight = 0.8;
const characterRadius = 0.3;
const characterGeometry = new THREE.CylinderGeometry(characterRadius, characterRadius, characterHeight, 24);
const characterMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
const character = new THREE.Mesh(characterGeometry, characterMaterial);

const characterGridPosition = {
    x: center,
    z: gridSize - 1,
};

const updateCharacterWorldPosition = () => {
    character.position.set(
        characterGridPosition.x - center,
        tileHeight / 2 + characterHeight / 2,
        characterGridPosition.z - center
    );
};

updateCharacterWorldPosition();
scene.add(character);

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    let moveX = 0;
    let moveZ = 0;

    if (key === 'z') {
        moveZ = -1;
    } else if (key === 's') {
        moveZ = 1;
    } else if (key === 'q') {
        moveX = -1;
    } else if (key === 'd') {
        moveX = 1;
    } else {
        return;
    }

    const nextX = THREE.MathUtils.clamp(characterGridPosition.x + moveX, minGridIndex, maxGridIndex);
    const nextZ = THREE.MathUtils.clamp(characterGridPosition.z + moveZ, minGridIndex, maxGridIndex);

    characterGridPosition.x = nextX;
    characterGridPosition.z = nextZ;
    updateCharacterWorldPosition();
});

camera.position.set(0, 13, 0);
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