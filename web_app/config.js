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

export const objectivePoleHeight = 10;
export const objectivePoleWidth = 0.2;

// null => keep current behavior (render every reachable tile).
// integer >= 0 => render tiles up to that labyrinth-tree distance from current tile.
export const renderDistance = 5;

//////////////// Light
export const sunHeight = 22;
export const sunOffsetX = -8;
export const sunOffsetZ = -10;
export const sunLightIntensity = 8.1;
export const sunLightDecay = 0;

export const torchLightColor = 0xfff0c2;
export const torchLightIntensity = 4.5;
export const torchLightDistance = 8;
export const torchLightAngle = Math.PI / 7;
export const torchLightPenumbra = 0.45;
export const torchLightDecay = 1.2;
export const torchOffsetX = 0.17;
export const torchOffsetYFactor = 0.74;
export const torchOffsetZ = 0.08;
export const torchTargetOffsetX = 0.42;
export const torchTargetOffsetYFactor = 0.58;
export const torchTargetOffsetZ = 3.1;

//////////////// Colors
export const colorTileInPath = 0x000000;

export const colorSceneBackground = 0x87CEEB;

export const colorDirectionMarker = 0x939bb4;
export const colorPreviousMarker = 0x65676b;
export const colorCenterMarker = 0x778991;

export const colorWall = 0x202b2d;
export const colorWallBorder = 0xb9dbe9;

export const colorStartPole = 0xff8a3d;
export const colorEndPole = 0x4dd2ff;

export const colorSunLight = 0xfff0c4;