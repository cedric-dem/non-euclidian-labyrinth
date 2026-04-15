export const labyrinthTiles = [];

export class labyrinthTile {
    constructor(nextTiles) {
        this.nextTiles = nextTiles;
        this.representation = null;
        this.previousTiles = [null, null, null, null];
        labyrinthTiles.push(this);
    }
}
