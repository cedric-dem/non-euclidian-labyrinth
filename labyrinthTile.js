export const labyrinthTiles = [];

export class labyrinthTile {
    constructor(nextTiles) {
        this.nextTiles = nextTiles;
        this.representation = null;
        this.previousTile = [false, false, false, false];
        labyrinthTiles.push(this);
    }
}
