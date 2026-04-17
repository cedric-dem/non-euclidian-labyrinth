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
export const sunHeight = 26;
export const sunOffsetX = -11;
export const sunOffsetZ = -14;
export const sunLightIntensity = 4.2;
export const sunLightDecay = 0;

export const torchLightColor = 0xfff0c2;
export const torchLightIntensity = 5.2;
export const torchLightDistance = 9;
export const torchLightAngle = Math.PI / 8.5;
export const torchLightPenumbra = 0.35;
export const torchLightDecay = 1.2;
export const torchOffsetX = 0.17;
export const torchOffsetYFactor = 0.74;
export const torchOffsetZ = 0.08;
export const torchTargetOffsetX = 0.42;
export const torchTargetOffsetYFactor = 0.58;
export const torchTargetOffsetZ = 3.1;

//////////////// Colors
export const colorTileInPath = 0x5d6470;

export const colorSceneBackground = 0xbfe0ff;

export const colorDirectionMarker = 0x8f9aff;
export const colorPreviousMarker = 0xb2bcc9;
export const colorCenterMarker = 0x6b7fe6;

export const colorWall = 0x4a5568;
export const colorWallBorder = 0xc9d2de;

export const colorStartPole = 0xff8a3d;
export const colorEndPole = 0x00b8ff;

export const colorSunLight = 0xfff0c4;