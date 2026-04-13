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

const character = new THREE.Group();

const characterBody = new THREE.Mesh(characterGeometry, characterMaterial);
characterBody.position.y = 0;
character.add(characterBody);

const characterHeadRadius = 0.11;
const characterHeadGeometry = new THREE.SphereGeometry(characterHeadRadius, 20, 20);
const characterHeadMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
const characterHead = new THREE.Mesh(characterHeadGeometry, characterHeadMaterial);
characterHead.position.set(0, characterHeight / 2 - characterHeadRadius * 0.1, characterRadius + characterHeadRadius * 0.9);
character.add(characterHead);

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

const updateCharacterFacingDirection = () => {
    if (lastMovementDirection === null) {
        return;
    }

    const facingAngle = Math.atan2(lastMovementDirection.x, lastMovementDirection.z);
    character.rotation.y = facingAngle;
};

const followCameraHeight = 2.8;
const followCameraDistance = 3.2;
let lastMovementDirection = {x: 0, z: -1};

const updateFollowCamera = () => {
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
};

updateCharacterWorldPosition();
updateCharacterFacingDirection();
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

    if (nextX === characterGridPosition.x && nextZ === characterGridPosition.z) {
        return;
    }

    lastMovementDirection = {
        x: nextX - characterGridPosition.x,
        z: nextZ - characterGridPosition.z,
    };

    characterGridPosition.x = nextX;
    characterGridPosition.z = nextZ;
    updateCharacterWorldPosition();
    updateCharacterFacingDirection();
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

const tileLabyrinthPartMaterial = new THREE.MeshBasicMaterial({color: 0x444444});

const directionMarkerSize = 0.333;
const directionMarkerOffsetX = tileWidth / 2 - directionMarkerSize / 2 - 0.03;
const directionMarkerOffsetZ = tileDepth / 2 - directionMarkerSize / 2 - 0.03;
const directionMarkerY = tileHeight / 2;
const directionMarkerGeometry = new THREE.BoxGeometry(
    directionMarkerSize,
    tileHeight,
    directionMarkerSize
);
const directionMarkerMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
const previousMarkerMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
const centerMarkerSize = 0.33;
const centerMarkerY = tileHeight / 2;
const centerMarkerGeometry = new THREE.BoxGeometry(
    centerMarkerSize,
    tileHeight,
    centerMarkerSize
);
const centerMarkerMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});

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

const positionOffsets = [
    [0, -1], // up
    [1, 0],  // right
    [0, 1],  // down
    [-1, 0], // left
];

function setTilesPositions(currentLocation, currentTile) {
    //currentLocation : [x , z]
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

class labyrinthTile {
    constructor(nextTiles) {
        this.nextTiles = nextTiles;
        this.representation = getRepresentation(nextTiles);
        this.previousTile = [false, false, false, false];
    }
}

// convention : [up, right, down, left]

const entryPoint = new labyrinthTile([
    new labyrinthTile([
        new labyrinthTile([
            null,
            new labyrinthTile([
                null,
                new labyrinthTile([
                    new labyrinthTile([
                        new labyrinthTile([
                            new labyrinthTile([
                                new labyrinthTile([null, null, null, null]),
                                null,
                                null,
                                null
                            ]),
                            null,
                            null,
                            null
                        ]),
                        null,
                        null,
                        null
                    ]),
                    null,
                    null,
                    null
                ]),
                null,
                null
            ]),
            null,
            new labyrinthTile([
                null,
                null,
                null,
                new labyrinthTile([
                    new labyrinthTile([
                        new labyrinthTile([
                            null,
                            new labyrinthTile([
                                null,
                                new labyrinthTile([
                                    null,
                                    new labyrinthTile([
                                        null,
                                        new labyrinthTile([
                                            null,
                                            new labyrinthTile([
                                                null,
                                                new labyrinthTile([null, null, null, null]),
                                                null,
                                                null
                                            ]),
                                            null,
                                            null
                                        ]),
                                        null,
                                        null
                                    ]),
                                    null,
                                    null
                                ]),
                                null,
                                null
                            ]),
                            null,
                            null
                        ]),
                        null,
                        null,
                        null
                    ]),
                    null,
                    null,
                    null
                ])
            ])
        ]),
        null,
        null,
        null
    ]),
    null,
    null,
    null
])

/*
const entryPoint = new labyrinthTile([
    new labyrinthTile([
        null,
        new labyrinthTile([
            new labyrinthTile([
                null,
                null,
                null,
                new labyrinthTile([
                    null,
                    null,
                    new labyrinthTile([null, null, null, null]),
                    null
                ])
            ]),
            null,
            null,
            null
        ]),
        null,
        new labyrinthTile([
            new labyrinthTile([
                null,
                new labyrinthTile([
                    new labyrinthTile([
                        new labyrinthTile([
                            null,
                            new labyrinthTile([null, null, null, null]),
                            null,
                            null
                        ]),
                        null,
                        null,
                        null
                    ]),
                    null,
                    null,
                    null]),
                null,
                null
            ]),
            null,
            null,
            null
    ]),
    ]),
        null,
            null,
            null
    ]);
*/

setTilesPositions([center, gridSize - 1], entryPoint);
setPreviousTiles(entryPoint);

animate();