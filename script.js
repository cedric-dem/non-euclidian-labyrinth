import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import {entryPoint} from './labyrinth.js';
import {labyrinthTiles} from './labyrinthTile.js';
import {
    gridSize,
    tileWidth,
    tileDepth,
    tileHeight,
    markerHeight,
    markerThickness,
    characterHeadRadius,
    followCameraHeight,
    followCameraDistance,
    directionMarkerSize,
    centerMarkerSize,
    colorSceneBackground,
    colorLightTile,
    colorDarkTile,
    colorTopMarker,
    colorBottomMarker,
    colorLeftMarker,
    colorRightMarker,
    colorCharacterBody,
    colorCharacterHead,
    characterHeight,
    characterRadius,
    cameraHeight,
    colorTileInPath,
    colorDirectionMarker,
    colorPreviousMarker,
    colorCenterMarker,
} from './config.js';

// ---- define const --------------------------------------------------------

const center = (gridSize - 1) / 2;

const directionMarkerOffsetX = tileWidth / 2 - directionMarkerSize / 2 - 0.03;
const directionMarkerOffsetZ = tileDepth / 2 - directionMarkerSize / 2 - 0.03;
const directionMarkerY = tileHeight / 2;

const centerMarkerY = tileHeight / 2;

const minGridIndex = 0;
const maxGridIndex = gridSize - 1;
const gridWorldWidth = gridSize * tileWidth;
const gridWorldDepth = gridSize * tileDepth;

// ---- App bootstrap --------------------------------------------------------
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(colorSceneBackground);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
app.appendChild(renderer.domElement);

const topCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
const followCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
topCamera.position.set(0, cameraHeight, 0);
topCamera.lookAt(0, 0, 0);

// ---- Shared state ---------------------------------------------------------
let isFollowCameraActive = false;
let currentTile = null;
let lastMovementDirection = {x: 0, z: -1};

const tileHistory = [];
const tileByGridPosition = new Map();
const characterGridPosition = {x: center, z: gridSize - 1};

// ---- Core geometries/materials -------------------------------------------
const tileGeometry = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);
const tileLabyrinthPartMaterial = new THREE.MeshBasicMaterial({color: colorTileInPath});


const directionMarkerGeometry = new THREE.BoxGeometry(directionMarkerSize, tileHeight, directionMarkerSize);
const directionMarkerMaterial = new THREE.MeshBasicMaterial({color: colorDirectionMarker});
const previousMarkerMaterial = new THREE.MeshBasicMaterial({color: colorPreviousMarker});

const centerMarkerGeometry = new THREE.BoxGeometry(centerMarkerSize, tileHeight, centerMarkerSize);
const centerMarkerMaterial = new THREE.MeshBasicMaterial({color: colorCenterMarker});

const positionOffsets = [
    [0, -1], // up
    [1, 0], // right
    [0, 1], // down
    [-1, 0], // left
];

const getTileMapKey = (x, z) => `${x},${z}`;

// ---- Scene setup ----------------------------------------------------------
function createCheckerboardTiles() {
    for (let x = 0; x < gridSize; x += 1) {
        for (let z = 0; z < gridSize; z += 1) {
            const color = (x + z) % 2 === 0 ? new THREE.Color(colorLightTile) : new THREE.Color(colorDarkTile);
            const tileMaterial = new THREE.MeshBasicMaterial({color});
            const tile = new THREE.Mesh(tileGeometry, tileMaterial);
            tile.position.set(x - center, -0.01, z - center);
            scene.add(tile);
        }
    }
}

function createBoundaryMarkers() {
    const markerDefinitions = [
        {
            geometry: new THREE.BoxGeometry(gridWorldWidth + 0.4, markerHeight, markerThickness),
            position: [0, tileHeight / 2 + markerHeight / 2, -(center + tileDepth / 2 + markerThickness / 2)],
            color: colorTopMarker,
        },
        {
            geometry: new THREE.BoxGeometry(gridWorldWidth + 0.4, markerHeight, markerThickness),
            position: [0, tileHeight / 2 + markerHeight / 2, center + tileDepth / 2 + markerThickness / 2],
            color: colorBottomMarker,
        },
        {
            geometry: new THREE.BoxGeometry(markerThickness, markerHeight, gridWorldDepth + 0.4),
            position: [-(center + tileWidth / 2 + markerThickness / 2), -0.01 + tileHeight / 2 + markerHeight / 2, 0],
            color: colorLeftMarker,
        },
        {
            geometry: new THREE.BoxGeometry(markerThickness, markerHeight, gridWorldDepth + 0.4),
            position: [center + tileWidth / 2 + markerThickness / 2, -0.01 + tileHeight / 2 + markerHeight / 2, 0],
            color: colorRightMarker,
        },
    ];

    for (const markerDefinition of markerDefinitions) {
        const markerMaterial = new THREE.MeshBasicMaterial({color: markerDefinition.color});
        const marker = new THREE.Mesh(markerDefinition.geometry, markerMaterial);
        marker.position.set(...markerDefinition.position);
        scene.add(marker);
    }
}

// ---- Character setup ------------------------------------------------------

const characterGeometry = new THREE.CylinderGeometry(characterRadius, characterRadius, characterHeight, 24);
const characterMaterial = new THREE.MeshBasicMaterial({color: colorCharacterBody});
const character = new THREE.Group();
const characterBody = new THREE.Mesh(characterGeometry, characterMaterial);
characterBody.position.y = 0;
character.add(characterBody);

const characterHeadGeometry = new THREE.SphereGeometry(characterHeadRadius, 20, 20);
const characterHeadMaterial = new THREE.MeshBasicMaterial({color: colorCharacterHead});
const characterHead = new THREE.Mesh(characterHeadGeometry, characterHeadMaterial);
characterHead.position.set(0, characterHeight / 2 - characterHeadRadius * 0.1, characterRadius + characterHeadRadius * 0.9);
character.add(characterHead);

function updateCharacterWorldPosition() {
    character.position.set(
        characterGridPosition.x - center,
        tileHeight / 2 + characterHeight / 2,
        characterGridPosition.z - center
    );
}

function updateCharacterFacingDirection() {
    if (lastMovementDirection === null) {
        return;
    }

    character.rotation.y = Math.atan2(lastMovementDirection.x, lastMovementDirection.z);
}

function updateFollowCamera() {
    const followOffset = new THREE.Vector3(0, followCameraHeight, followCameraDistance);

    if (lastMovementDirection !== null) {
        followOffset.set(
            -lastMovementDirection.x * followCameraDistance,
            followCameraHeight,
            -lastMovementDirection.z * followCameraDistance
        );
    }

    followCamera.position.copy(character.position).add(followOffset);
    followCamera.lookAt(character.position);
}

function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    let moveX = 0;
    let moveZ = 0;
    let directionIndex = -1;

    if (key === 'a' && !event.repeat) {
        isFollowCameraActive = !isFollowCameraActive;
        return;
    }

    if (key === 'z') {
        moveZ = -1;
        directionIndex = 0;
    } else if (key === 's') {
        moveZ = 1;
        directionIndex = 2;
    } else if (key === 'q') {
        moveX = -1;
        directionIndex = 3;
    } else if (key === 'd') {
        moveX = 1;
        directionIndex = 1;
    } else {
        return;
    }

    const historyEntry = tileHistory[tileHistory.length - 1] ?? null;
    const forwardTile = currentTile?.nextTiles[directionIndex] ?? null;
    const canMoveBackward = (
        historyEntry !== null
        && historyEntry.previousDirectionIndex === directionIndex
        && tileHistory.length > 1
    );

    if (forwardTile !== null) {
        tileHistory.push({
            tile: forwardTile,
            previousDirectionIndex: (directionIndex + 2) % 4,
        });
        currentTile = forwardTile;
    } else if (canMoveBackward) {
        tileHistory.pop();
        currentTile = tileHistory[tileHistory.length - 1]?.tile ?? null;
    } else {
        return;
    }

    const nextX = THREE.MathUtils.clamp(characterGridPosition.x + moveX, minGridIndex, maxGridIndex);
    const nextZ = THREE.MathUtils.clamp(characterGridPosition.z + moveZ, minGridIndex, maxGridIndex);

    if (nextX === characterGridPosition.x && nextZ === characterGridPosition.z) {
        return;
    }

    lastMovementDirection = {
        x: nextX - characterGridPosition.x,
        z: nextZ - characterGridPosition.z,
    };

    characterGridPosition.x = nextX;
    characterGridPosition.z = nextZ;

    setSubtreeVisibility(currentTile);
    updateCharacterWorldPosition();
    updateCharacterFacingDirection();
}

function handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    topCamera.aspect = aspect;
    topCamera.updateProjectionMatrix();
    followCamera.aspect = aspect;
    followCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    updateFollowCamera();
    const activeCamera = isFollowCameraActive ? followCamera : topCamera;
    renderer.render(scene, activeCamera);
    requestAnimationFrame(animate);
}

function getRepresentation(nextTiles) {
    const tileGroup = new THREE.Group();

    // Tile itself
    const tile = new THREE.Mesh(tileGeometry, tileLabyrinthPartMaterial);
    tile.position.set(0, 0, 0);
    tileGroup.add(tile);

    // Center marker for each labyrinth tile
    const centerMarker = new THREE.Mesh(centerMarkerGeometry, centerMarkerMaterial);
    centerMarker.position.set(0, centerMarkerY, 0);
    tileGroup.add(centerMarker);

    // Direction markers (small green cubes that stay within tile bounds)

    const addDirectionMarker = (xOffset, zOffset) => {
        const marker = new THREE.Mesh(directionMarkerGeometry, directionMarkerMaterial);
        marker.position.set(xOffset, directionMarkerY, zOffset);
        tileGroup.add(marker);
    };

    //  walls
    if (nextTiles[0]) { // path to top
        addDirectionMarker(0, -directionMarkerOffsetZ);
    }
    if (nextTiles[1]) { // path to right
        addDirectionMarker(directionMarkerOffsetX, 0);
    }
    if (nextTiles[2]) { // path to bottom
        addDirectionMarker(0, directionMarkerOffsetZ);
    }
    if (nextTiles[3]) { // path to left
        addDirectionMarker(-directionMarkerOffsetX, 0);
    }

    scene.add(tileGroup);
    return tileGroup;
}

function setPreviousTiles(currentTile, visitedTiles = new Set()) {
    if (visitedTiles.has(currentTile)) {
        return;
    }
    visitedTiles.add(currentTile);

    const addPreviousMarker = (xOffset, zOffset) => {
        const marker = new THREE.Mesh(directionMarkerGeometry, previousMarkerMaterial);
        marker.position.set(xOffset, directionMarkerY, zOffset);
        currentTile.representation.add(marker);
    };

    if (currentTile.previousTile[0]) { // path to top
        addPreviousMarker(0, -directionMarkerOffsetZ);
    }
    if (currentTile.previousTile[1]) { // path to right
        addPreviousMarker(directionMarkerOffsetX, 0);
    }
    if (currentTile.previousTile[2]) { // path to bottom
        addPreviousMarker(0, directionMarkerOffsetZ);
    }
    if (currentTile.previousTile[3]) { // path to left
        addPreviousMarker(-directionMarkerOffsetX, 0);
    }

    currentTile.nextTiles.forEach((nextTile) => {
        if (nextTile !== null) {
            setPreviousTiles(nextTile, visitedTiles);
        }
    });
}

function setTilesPositions(currentLocation, currentTile) {
    //currentLocation : [x , z]
    tileByGridPosition.set(
        getTileMapKey(currentLocation[0], currentLocation[1]),
        currentTile
    );
    currentTile.representation.position.set(
        currentLocation[0] - center,
        0,
        currentLocation[1] - center
    );

    currentTile.nextTiles.forEach((nextTile, directionIndex) => {
        if (nextTile === null) {
            return;
        }

        const offset = positionOffsets[directionIndex];
        const nextLocation = [
            currentLocation[0] + offset[0],
            currentLocation[1] + offset[1],
        ];
        const previousDirectionIndex = (directionIndex + 2) % 4;
        nextTile.previousTile[previousDirectionIndex] = true;
        setTilesPositions(nextLocation, nextTile);
    });
}

function setTilesRepresentation() {
    labyrinthTiles.forEach((tile) => {
        tile.representation = getRepresentation(tile.nextTiles);
    });

}

function setSubtreeVisibility(rootTile) {
    labyrinthTiles.forEach((tile) => {
        tile.representation.visible = false;
    });

    if (rootTile === null) {
        return;
    }

    const visitedTiles = new Set();
    const showTileAndChildren = (tile) => {
        if (tile === null || visitedTiles.has(tile)) {
            return;
        }

        visitedTiles.add(tile);
        tile.representation.visible = true;

        tile.nextTiles.forEach((nextTile) => {
            showTileAndChildren(nextTile);
        });
    };

    showTileAndChildren(rootTile);
}

function initializeLabyrinthState() {
    setTilesRepresentation();
    setTilesPositions([center, gridSize - 1], entryPoint);
    setPreviousTiles(entryPoint);
    tileHistory.push({
        tile: entryPoint,
        previousDirectionIndex: null,
    });
    currentTile = entryPoint;
    setSubtreeVisibility(currentTile);
}

function initialize() {
    createCheckerboardTiles();
    createBoundaryMarkers();

    updateCharacterWorldPosition();
    updateCharacterFacingDirection();
    scene.add(character);

    initializeLabyrinthState();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    animate();
}

initialize();