import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

const app = document.getElementById('app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0000ff);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
app.appendChild(renderer.domElement);

const topCamera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

const followCamera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

let isFollowCameraActive = false;

const gridSize = 9;
const tileWidth = 1;
const tileDepth = 1;
const tileHeight = 0.1;
const markerHeight = 0.5;
const markerThickness = 0.2;
const center = (gridSize - 1) / 2;
const minGridIndex = 0;
const maxGridIndex = gridSize - 1;
const gridWorldWidth = gridSize * tileWidth;
const gridWorldDepth = gridSize * tileDepth;

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

const markerDefinitions = [
    {
        geometry: new THREE.BoxGeometry(gridWorldWidth + 0.4, markerHeight, markerThickness),
        position: [0, tileHeight / 2 + markerHeight / 2, -(center + tileDepth / 2 + markerThickness / 2)],
        color: 0xff0000,
    },
    {
        geometry: new THREE.BoxGeometry(gridWorldWidth + 0.4, markerHeight, markerThickness),
        position: [0, tileHeight / 2 + markerHeight / 2, center + tileDepth / 2 + markerThickness / 2],
        color: 0x00ff00,
    },
    {
        geometry: new THREE.BoxGeometry(markerThickness, markerHeight, gridWorldDepth + 0.4),
        position: [-(center + tileWidth / 2 + markerThickness / 2), -0.01 + tileHeight / 2 + markerHeight / 2, 0],
        color: 0x000000,
    },
    {
        geometry: new THREE.BoxGeometry(markerThickness, markerHeight, gridWorldDepth + 0.4),
        position: [center + tileWidth / 2 + markerThickness / 2, -0.01 + tileHeight / 2 + markerHeight / 2, 0],
        color: 0xffff00,
    },
];

for (const markerDefinition of markerDefinitions) {
    const markerMaterial = new THREE.MeshBasicMaterial({color: markerDefinition.color});
    const marker = new THREE.Mesh(markerDefinition.geometry, markerMaterial);
    marker.position.set(...markerDefinition.position);
    scene.add(marker);
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

const updateFollowCamera = () => {
    const followOffset = new THREE.Vector3(0, 2.8, 3.2);
    followCamera.position.copy(character.position).add(followOffset);
    followCamera.lookAt(character.position);
};

updateCharacterWorldPosition();
scene.add(character);

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    let moveX = 0;
    let moveZ = 0;

    if (key === 'a' && !event.repeat) {
        isFollowCameraActive = !isFollowCameraActive;
        return;
    }

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

topCamera.position.set(0, 13, 0);
topCamera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    topCamera.aspect = aspect;
    topCamera.updateProjectionMatrix();
    followCamera.aspect = aspect;
    followCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const animate = () => {
    updateFollowCamera();
    const activeCamera = isFollowCameraActive ? followCamera : topCamera;
    renderer.render(scene, activeCamera);
    requestAnimationFrame(animate);
};

animate();