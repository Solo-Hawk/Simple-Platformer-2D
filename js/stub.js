/* in this example we create a world that is bigger than the canvas and allow the camera to follow the player
 * we bind additional keys to allow multiple control schemes
 * we add a resize function, call this as soon as the game is initialised and also whenever the game window is resized */

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var game = new Phaser.Game(config);
var platforms, player, cursors, stars, bombs;

function preload() {

    console.log(this)
    this.load.atlas({
        key: 'adventurer',
        textureURL: 'assets/adventurer.png',
        atlasURL: 'assets/adventurer.json'
    });


}

function create() {
    var frameNames1 = this.anims.generateFrameNames('adventurer', {
        start: 0, end: 3, zeroPad: 2,
        prefix: 'adventurer-air-attack1-', suffix: ''
    })
    var frameNames2 = this.anims.generateFrameNames('adventurer', {
        start: 0, end: 2, zeroPad: 2,
        prefix: 'adventurer-air-attack2-', suffix: ''
    })
    var frameNames3 = this.anims.generateFrameNames('adventurer', {
        start: 0, end: 0, zeroPad: 2,
        prefix: 'adventurer-air-attack3-rdy-', suffix: ''
    })
    var frameNames4 = this.anims.generateFrameNames('adventurer', {
        start: 0, end: 1, zeroPad: 2,
        prefix: 'adventurer-air-attack3-loop-', suffix: ''
    })
    var frameNames5 = this.anims.generateFrameNames('adventurer', {
        start: 0, end: 1, zeroPad: 2,
        prefix: 'adventurer-air-attack3-loop-', suffix: ''
    })
    var frameNames6 = this.anims.generateFrameNames('adventurer', {
        start: 0, end: 2, zeroPad: 2,
        prefix: 'adventurer-air-attack-3-end-', suffix: ''
    })

    console.log(frameNames1)
    console.log(frameNames2)
    console.log(frameNames1.concat(frameNames2).concat(frameNames3).concat(frameNames4).concat(frameNames5).concat(frameNames6))


    frameNamesF = frameNames1.concat(frameNames2).concat(frameNames3).concat(frameNames4).concat(frameNames5).concat(frameNames6)
    
    this.anims.create({
        key: 'test',
        frames: frameNamesF,
        frameRate: 8,
        repeat: 0
    }); //test
    player = this.physics.add.sprite(400, 300, 'adventurer', 4);
    player.body.allowGravity = false;
}

function update() {
    player.anims.play('test', true)
    
}
