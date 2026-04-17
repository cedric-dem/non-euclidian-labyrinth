import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import {entryPoint} from './labyrinth.js';
import {labyrinthTiles} from './labyrinthTile.js';
import {
    gridSize,
    fovPovView,
    tileWidth,
    tileDepth,
    tileHeight,
    smallMarkerSize,
    colorSceneBackground,
    cameraHeight,
    characterHeight,
    colorTileInPath,
    colorDirectionMarker,
    colorPreviousMarker,
    colorCenterMarker,
    colorWall,
    wallCubeSize,
    wallHeight,
    colorWallBorder,
    movementDurationMs,
    movementAnimationSteps,
    renderDistance,
    objectivePoleHeight,
    objectivePoleWidth,
    colorStartPole,
    colorEndPole
} from './config.js';

// ---- define const --------------------------------------------------------

const center = (gridSize - 1) / 2;

const directionMarkerOffsetX = tileWidth / 2 - smallMarkerSize / 2 - 0.0001;
const directionMarkerOffsetZ = tileDepth / 2 - smallMarkerSize / 2 - 0.0001;
const directionMarkerY = tileHeight / 2;

const centerMarkerY = tileHeight / 2;

// ---- App bootstrap --------------------------------------------------------
const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(colorSceneBackground);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
app.appendChild(renderer.domElement);

const topCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
const povCamera = new THREE.PerspectiveCamera(fovPovView, window.innerWidth / window.innerHeight, 0.1, 100);
topCamera.position.set(0, cameraHeight, 0);
topCamera.lookAt(0, 0, 0);

// ---- Shared state ---------------------------------------------------------
let isFollowCameraActive = true;
let currentTile = null;
let lastMovementDirection = {x: 0, z: -1};
let activeTurnAnimation = null;
let activeMovementAnimation = null;

const tileHistory = [];
const tileByGridPosition = new Map();
const tileGridKeyByTile = new Map();
const characterGridPosition = {x: center, z: gridSize - 1};
let occupationMatrix = createEmptyOccupationMatrix();
// ---- Core geometries/materials -------------------------------------------

const wallCubeY = tileHeight / 2 + wallHeight / 2;
const wallCubeGeometry = new THREE.BoxGeometry(wallCubeSize, wallHeight, wallCubeSize);
const wallCubeMaterial = new THREE.MeshBasicMaterial({color: colorWall});
const wallCubeEdgesGeometry = new THREE.EdgesGeometry(wallCubeGeometry);
const wallCubeEdgesMaterial = new THREE.LineBasicMaterial({color: colorWallBorder});
const wallPositionOffset = (tileWidth - wallCubeSize) / 2;
const wallOffsets = [-wallPositionOffset, 0, wallPositionOffset];

const tileGeometry = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);
const tileLabyrinthPartMaterial = new THREE.MeshBasicMaterial({color: colorTileInPath});


const sharedMarkerGeometry = new THREE.BoxGeometry(smallMarkerSize, tileHeight, smallMarkerSize);
const directionMarkerMaterial = new THREE.MeshBasicMaterial({color: colorDirectionMarker});
const previousMarkerMaterial = new THREE.MeshBasicMaterial({color: colorPreviousMarker});
const centerMarkerMaterial = new THREE.MeshBasicMaterial({color: colorCenterMarker});
const objectivePoleGeometry = new THREE.CylinderGeometry(
    objectivePoleWidth / 2,
    objectivePoleWidth / 2,
    objectivePoleHeight,
    20
);

const positionOffsets = [[0, -1], // up
    [1, 0], // right
    [0, 1], // down
    [-1, 0], // left
];

const getTileMapKey = (x, z) => `${x},${z}`;

function createEmptyOccupationMatrix() {
    return new Set();
}

function setOccupationCell(matrix, gridX, gridZ) {
    matrix.add(getTileMapKey(gridX, gridZ));
}

function hasOccupationCell(matrix, gridX, gridZ) {
    return matrix.has(getTileMapKey(gridX, gridZ));
}

function getTileGridPosition(tile) {
    const tileGridKey = tileGridKeyByTile.get(tile);
    if (tileGridKey === undefined) {
        return null;
    }

    const [tileXAsText, tileZAsText] = tileGridKey.split(',');
    return {
        gridX: Number(tileXAsText),
        gridZ: Number(tileZAsText),
    };
}

function getTileByType(tileType) {
    return labyrinthTiles.find((tile) => tile.tileType === tileType) ?? null;
}

function addPersistentObjectivePole(tileType, color) {
    const objectiveTile = getTileByType(tileType);
    if (objectiveTile === null) {
        return;
    }

    const tileGridPosition = getTileGridPosition(objectiveTile);
    if (tileGridPosition === null) {
        return;
    }

    const objectivePole = new THREE.Mesh(objectivePoleGeometry, new THREE.MeshBasicMaterial({color}));
    const poleBottomY = -tileHeight / 2;
    objectivePole.position.set(
        tileGridPosition.gridX - center,
        poleBottomY + objectivePoleHeight / 2,
        tileGridPosition.gridZ - center
    );
    scene.add(objectivePole);
}

function logIfStartTile(tile) {
    if (tile?.tileType === 'start') {
        console.log('Player reached the start tile.');
    }
}

function logIfEndTile(tile) {
    if (tile?.tileType === 'end') {
        console.log('Player reached the end tile.');
    }
}

function trySetVisibleTile(tile) {
    const tileGridPosition = getTileGridPosition(tile);
    if (tileGridPosition === null) {
        return false;
    }

    const {gridX, gridZ} = tileGridPosition;

    if (hasOccupationCell(occupationMatrix, gridX, gridZ)) {
        return false;
    }

    setOccupationCell(occupationMatrix, gridX, gridZ);
    tile.representation.visible = true;
    return true;
}


// ---- Character setup ------------------------------------------------------

const character = new THREE.Group();
const topViewPlayerMarker = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({color: 0x000000}));
topViewPlayerMarker.visible = false;
scene.add(topViewPlayerMarker);

function updateCharacterWorldPosition() {
    const worldX = characterGridPosition.x - center;
    const worldZ = characterGridPosition.z - center;
    character.position.set(worldX, tileHeight / 2 + characterHeight / 2, worldZ);
    topViewPlayerMarker.position.set(worldX, tileHeight / 2 + 0.2, worldZ);
}

function updateCharacterFacingDirection() {
    if (lastMovementDirection === null) {
        return;
    }

    character.rotation.y = Math.atan2(lastMovementDirection.x, lastMovementDirection.z);
}

function normalizeAngle(angle) {
    let normalizedAngle = angle;

    while (normalizedAngle <= -Math.PI) {
        normalizedAngle += Math.PI * 2;
    }
    while (normalizedAngle > Math.PI) {
        normalizedAngle -= Math.PI * 2;
    }

    return normalizedAngle;
}

function startTurnToDirection(nextDirection) {
    const targetAngle = Math.atan2(nextDirection.x, nextDirection.z);
    const startAngle = normalizeAngle(character.rotation.y);
    const shortestDelta = normalizeAngle(targetAngle - startAngle);

    activeTurnAnimation = {
        startAngle,
        targetAngle: startAngle + shortestDelta,
        startTimeMs: performance.now(),
        durationMs: movementDurationMs,
    };
}

function startMovementAnimation(nextGridX, nextGridZ) {
    activeMovementAnimation = {
        startWorldX: character.position.x,
        startWorldZ: character.position.z,
        targetWorldX: nextGridX - center,
        targetWorldZ: nextGridZ - center,
        startTimeMs: performance.now(),
        durationMs: movementDurationMs,
        totalSteps: movementAnimationSteps,
        currentStep: 0,
    };
}

function updateCharacterTurnAnimation(nowMs) {
    if (activeTurnAnimation === null) {
        return;
    }

    const elapsedMs = nowMs - activeTurnAnimation.startTimeMs;
    const turnProgress = THREE.MathUtils.clamp(elapsedMs / activeTurnAnimation.durationMs, 0, 1);

    character.rotation.y = THREE.MathUtils.lerp(activeTurnAnimation.startAngle, activeTurnAnimation.targetAngle, turnProgress);

    if (turnProgress >= 1) {
        character.rotation.y = normalizeAngle(activeTurnAnimation.targetAngle);
        activeTurnAnimation = null;
    }
}

function updateCharacterMovementAnimation(nowMs) {
    if (activeMovementAnimation === null) {
        return;
    }

    const elapsedMs = nowMs - activeMovementAnimation.startTimeMs;
    const movementProgress = THREE.MathUtils.clamp(elapsedMs / activeMovementAnimation.durationMs, 0, 1);
    const targetStep = Math.floor(movementProgress * activeMovementAnimation.totalSteps);

    if (targetStep > activeMovementAnimation.currentStep) {
        activeMovementAnimation.currentStep = targetStep;
    }

    const steppedProgress = THREE.MathUtils.clamp(activeMovementAnimation.currentStep / activeMovementAnimation.totalSteps, 0, 1);
    const worldX = THREE.MathUtils.lerp(activeMovementAnimation.startWorldX, activeMovementAnimation.targetWorldX, steppedProgress);
    const worldZ = THREE.MathUtils.lerp(activeMovementAnimation.startWorldZ, activeMovementAnimation.targetWorldZ, steppedProgress);

    character.position.set(worldX, tileHeight / 2 + characterHeight / 2, worldZ);
    topViewPlayerMarker.position.set(worldX, tileHeight / 2 + 0.2, worldZ);

    if (movementProgress >= 1) {
        character.position.set(activeMovementAnimation.targetWorldX, tileHeight / 2 + characterHeight / 2, activeMovementAnimation.targetWorldZ);
        topViewPlayerMarker.position.set(activeMovementAnimation.targetWorldX, tileHeight / 2 + 0.2, activeMovementAnimation.targetWorldZ);
        activeMovementAnimation = null;
    }
}

function updateFollowCamera() {
    const facingDirection = new THREE.Vector3(Math.sin(character.rotation.y), 0, Math.cos(character.rotation.y)).normalize();
    const eyeOffset = new THREE.Vector3(0, characterHeight, 0);
    const lookAheadOffset = facingDirection.multiplyScalar(1);
    const lookTarget = new THREE.Vector3()
        .copy(character.position)
        .add(eyeOffset)
        .add(lookAheadOffset);

    povCamera.position.copy(character.position).add(eyeOffset);
    povCamera.lookAt(lookTarget);
}

function updateTopCamera() {
    topCamera.position.set(character.position.x, cameraHeight, character.position.z);
    topCamera.lookAt(character.position.x, 0, character.position.z);
}


function handleKeyDown(event) {
    if (activeMovementAnimation !== null) {
        return;
    }

    const key = event.key.toLowerCase();
    let moveX = 0;
    let moveZ = 0;
    let directionIndex = -1;
    let shouldTurnCharacter = true;

    if (key === 'a' && !event.repeat) {
        isFollowCameraActive = !isFollowCameraActive;
        return;
    }
    const keyToRelativeDirection = {
        z: 'forward', s: 'backward', q: 'left', d: 'right',
    };
    const relativeDirection = keyToRelativeDirection[key] ?? null;
    if (relativeDirection === null) {
        return;
    }
    const getDirectionIndexFromVector = (x, z) => {
        if (x === 0 && z === -1) {
            return 0; // up
        }
        if (x === 1 && z === 0) {
            return 1; // right
        }
        if (x === 0 && z === 1) {
            return 2; // down
        }
        return 3; // left
    };

    if (isFollowCameraActive) {
        const forwardX = lastMovementDirection.x;
        const forwardZ = lastMovementDirection.z;

        if (relativeDirection === 'left' || relativeDirection === 'right') {
            if (relativeDirection === 'left') {
                lastMovementDirection = {
                    x: forwardZ, z: -forwardX,
                };
            } else {
                lastMovementDirection = {
                    x: -forwardZ, z: forwardX,
                };
            }
            startTurnToDirection(lastMovementDirection);
            return;
        }

        if (relativeDirection === 'forward') {
            moveX = forwardX;
            moveZ = forwardZ;
        } else if (relativeDirection === 'backward') {
            moveX = -forwardX;
            moveZ = -forwardZ;
            shouldTurnCharacter = false;
        }
        directionIndex = getDirectionIndexFromVector(moveX, moveZ);
    } else if (relativeDirection === 'forward') {
        moveZ = -1;
        directionIndex = 0;
    } else if (relativeDirection === 'right') {
        moveX = 1;
        directionIndex = 1;
    } else if (relativeDirection === 'backward') {
        moveZ = 1;
        directionIndex = 2;
    } else if (relativeDirection === 'left') {
        moveX = -1;
        directionIndex = 3;
    }

    const historyEntry = tileHistory[tileHistory.length - 1] ?? null;
    const forwardTile = currentTile?.nextTiles[directionIndex] ?? null;
    const canMoveBackward = (historyEntry !== null && historyEntry.previousDirectionIndex === directionIndex && tileHistory.length > 1);

    const shouldOnlyBacktrack = isFollowCameraActive && relativeDirection === 'backward';

    if (shouldOnlyBacktrack) {
        if (!canMoveBackward) {
            return;
        }
        tileHistory.pop();
        currentTile = tileHistory[tileHistory.length - 1]?.tile ?? null;
    } else if (forwardTile !== null) {
        tileHistory.push({
            tile: forwardTile, previousDirectionIndex: (directionIndex + 2) % 4,
        });
        currentTile = forwardTile;
    } else if (canMoveBackward) {
        tileHistory.pop();
        currentTile = tileHistory[tileHistory.length - 1]?.tile ?? null;
    } else {
        return;
    }

    const nextX = characterGridPosition.x + moveX;
    const nextZ = characterGridPosition.z + moveZ;

    if (nextX === characterGridPosition.x && nextZ === characterGridPosition.z) {
        return;
    }

    if (shouldTurnCharacter) {
        lastMovementDirection = {
            x: nextX - characterGridPosition.x, z: nextZ - characterGridPosition.z,
        };
    }

    characterGridPosition.x = nextX;
    characterGridPosition.z = nextZ;

    setSubtreeVisibility(currentTile);
    logIfStartTile(currentTile);
    logIfEndTile(currentTile);
    startMovementAnimation(nextX, nextZ);
    if (shouldTurnCharacter) {
        startTurnToDirection(lastMovementDirection);
    }
}

function handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    topCamera.aspect = aspect;
    topCamera.updateProjectionMatrix();
    povCamera.aspect = aspect;
    povCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(nowMs = performance.now()) {
    updateCharacterMovementAnimation(nowMs);
    updateCharacterTurnAnimation(nowMs);
    updateFollowCamera();
    updateTopCamera();
    topViewPlayerMarker.visible = !isFollowCameraActive;
    const activeCamera = isFollowCameraActive ? povCamera : topCamera;
    renderer.render(scene, activeCamera);
    requestAnimationFrame(animate);
}

function getRepresentation() {
    const tileGroup = new THREE.Group();

    // Tile itself
    const tile = new THREE.Mesh(tileGeometry, tileLabyrinthPartMaterial);
    tile.position.set(0, 0, 0);
    tileGroup.add(tile);

    scene.add(tileGroup);
    return tileGroup;
}

function setTilesVisuals(currentTile, visitedTiles = new Set()) {
    if (currentTile === null || visitedTiles.has(currentTile)) {
        return;
    }
    visitedTiles.add(currentTile);

    setTilesMarkers(currentTile)
    setTilesWalls(currentTile)

    currentTile.nextTiles.forEach((nextTile) => {
        setTilesVisuals(nextTile, visitedTiles);
    });
}


function setTilesWalls(currentTile) {
    const openCells = new Set();
    openCells.add('1,1'); // center marker is always present

    if (currentTile.nextTiles[0] || currentTile.previousTiles[0]) {
        openCells.add('1,0');
    }
    if (currentTile.nextTiles[1] || currentTile.previousTiles[1]) {
        openCells.add('2,1');
    }
    if (currentTile.nextTiles[2] || currentTile.previousTiles[2]) {
        openCells.add('1,2');
    }
    if (currentTile.nextTiles[3] || currentTile.previousTiles[3]) {
        openCells.add('0,1');
    }

    for (let row = 0; row < wallOffsets.length; row += 1) {
        for (let col = 0; col < wallOffsets.length; col += 1) {
            if (openCells.has(`${col},${row}`)) {
                continue;
            }

            const wallCube = new THREE.Mesh(wallCubeGeometry, wallCubeMaterial);
            const wallCubeEdges = new THREE.LineSegments(wallCubeEdgesGeometry, wallCubeEdgesMaterial);
            wallCube.add(wallCubeEdges);
            wallCube.position.set(wallOffsets[col], wallCubeY, wallOffsets[row]);
            currentTile.representation.add(wallCube);
        }
    }
}

function setTilesMarkers(currentTile) {

    // Center marker for each labyrinth tile
    const centerMarker = new THREE.Mesh(sharedMarkerGeometry, centerMarkerMaterial);
    centerMarker.position.set(0, centerMarkerY, 0);
    currentTile.representation.add(centerMarker);

    // Next-direction markers
    const addNextMarker = (xOffset, zOffset) => {
        const marker = new THREE.Mesh(sharedMarkerGeometry, directionMarkerMaterial);
        marker.position.set(xOffset, directionMarkerY, zOffset);
        currentTile.representation.add(marker);
    };

    if (currentTile.nextTiles[0]) { // path to top
        addNextMarker(0, -directionMarkerOffsetZ);
    }
    if (currentTile.nextTiles[1]) { // path to right
        addNextMarker(directionMarkerOffsetX, 0);
    }
    if (currentTile.nextTiles[2]) { // path to bottom
        addNextMarker(0, directionMarkerOffsetZ);
    }
    if (currentTile.nextTiles[3]) { // path to left
        addNextMarker(-directionMarkerOffsetX, 0);
    }

    // Previous-direction markers
    const addPreviousMarker = (xOffset, zOffset) => {
        const marker = new THREE.Mesh(sharedMarkerGeometry, previousMarkerMaterial);
        marker.position.set(xOffset, directionMarkerY, zOffset);
        currentTile.representation.add(marker);
    };

    if (currentTile.previousTiles[0]) { // path to top
        addPreviousMarker(0, -directionMarkerOffsetZ);
    }
    if (currentTile.previousTiles[1]) { // path to right
        addPreviousMarker(directionMarkerOffsetX, 0);
    }
    if (currentTile.previousTiles[2]) { // path to bottom
        addPreviousMarker(0, directionMarkerOffsetZ);
    }
    if (currentTile.previousTiles[3]) { // path to left
        addPreviousMarker(-directionMarkerOffsetX, 0);
    }
}

function setTilesPositions(currentLocation, currentTile) {
    //currentLocation : [x , z]
    const gridKey = getTileMapKey(currentLocation[0], currentLocation[1]);
    tileByGridPosition.set(gridKey, currentTile);
    tileGridKeyByTile.set(currentTile, gridKey);
    currentTile.representation.position.set(currentLocation[0] - center, 0, currentLocation[1] - center);

    currentTile.nextTiles.forEach((nextTile, directionIndex) => {
        if (nextTile === null) {
            return;
        }

        const offset = positionOffsets[directionIndex];
        const nextLocation = [currentLocation[0] + offset[0], currentLocation[1] + offset[1],];
        const previousDirectionIndex = (directionIndex + 2) % 4;
        nextTile.previousTiles[previousDirectionIndex] = currentTile;
        setTilesPositions(nextLocation, nextTile);
    });
}

function setTilesRepresentation() {
    labyrinthTiles.forEach((tile) => {
        tile.representation = getRepresentation(tile.nextTiles);
    });

}

function setSubtreeVisibility(rootTile) {
    occupationMatrix = createEmptyOccupationMatrix();

    labyrinthTiles.forEach((tile) => {
        tile.representation.visible = false;
    });

    if (rootTile === null) {
        return;
    }

    const visibleTiles = new Set();
    const isRootVisible = trySetVisibleTile(rootTile);
    if (!isRootVisible) {
        return;
    }

    visibleTiles.add(rootTile);
    let distanceLayerTiles = [rootTile];
    let currentDistance = 0;

    while (distanceLayerTiles.length > 0) {
        if (Number.isInteger(renderDistance) && renderDistance >= 0 && currentDistance >= renderDistance) {
            break;
        }

        const nextDistanceLayerTiles = [];

        distanceLayerTiles.forEach((tile) => {
            const neighbors = [...tile.nextTiles, ...tile.previousTiles];
            neighbors.forEach((neighborTile) => {
                if (neighborTile === null || visibleTiles.has(neighborTile)) {
                    return;
                }

                if (!trySetVisibleTile(neighborTile)) {
                    return;
                }

                visibleTiles.add(neighborTile);
                nextDistanceLayerTiles.push(neighborTile);
            })
            ;
        })
        ;

        distanceLayerTiles = nextDistanceLayerTiles;
        currentDistance += 1;
    }
}

function initializeLabyrinthState() {
    setTilesRepresentation();
    setTilesPositions([center, gridSize - 1], entryPoint);
    setTilesVisuals(entryPoint);
    addPersistentObjectivePole('start', colorStartPole);
    addPersistentObjectivePole('end', colorEndPole);
    tileHistory.push({
        tile: entryPoint, previousDirectionIndex: null,
    });
    currentTile = entryPoint;
    setSubtreeVisibility(currentTile);
    logIfStartTile(currentTile);
    logIfEndTile(currentTile);
}

function initialize() {

    updateCharacterWorldPosition();
    updateCharacterFacingDirection();
    scene.add(character);

    initializeLabyrinthState();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    animate();
}

initialize();