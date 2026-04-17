export const labyrinthTiles = [];

export class labyrinthTile {
    constructor(nextTiles) {
        this.tileType = "normal"
        this.nextTiles = nextTiles;
        this.representation = null;
        this.previousTiles = [null, null, null, null];
        labyrinthTiles.push(this);
    }
}


export class endLabyrinthTile extends labyrinthTile {
    constructor(nextTiles) {
        super(nextTiles);
        this.tileType = "end"
    }
}

export class startLabyrinthTile extends labyrinthTile {
    constructor(nextTiles) {
        super(nextTiles);
        this.tileType = "start"
    }
}
