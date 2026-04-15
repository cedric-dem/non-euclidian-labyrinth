export const fovPovView = 80;

export const gridSize = 9; // for occupation matrix

export const tileWidth = 1;
export const tileDepth = 1;
export const tileHeight = 0.01;

export const wallCubeSize = 0.33;
export const wallHeight = 0.8

export const cameraHeight = 13;

export const smallMarkerSize = 0.01 + 1 / 3;

export const characterHeight = 0.3;

export const movementDurationMs = 250;
export const movementAnimationSteps = 10;

// null => keep current behavior (render every reachable tile).
// integer >= 0 => render tiles up to that labyrinth-tree distance from current tile.
export const renderDistance = 5;

//////////////// Colors
export const colorTileInPath = 0x000000;

export const colorSceneBackground = 0x000000;

export const colorDirectionMarker = 0x939bb4;
export const colorPreviousMarker = 0x65676b;
export const colorCenterMarker = 0x778991;

export const colorWall = 0x202b2d;
export const colorWallBorder = 0xb9dbe9;