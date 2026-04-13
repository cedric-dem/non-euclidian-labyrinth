import {labyrinthTile} from './labyrinthTile.js';

// convention : [up, right, down, left]

export const entryPoint = new labyrinthTile([
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