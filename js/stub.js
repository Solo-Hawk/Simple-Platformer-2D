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
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var game = new Phaser.Game(config);

var cursors;
var adventurer;
var player;
var chain = false
var testtimeout = setTimeout(function () { },0);

//testing vars
var text;
var testSprite;
var animSprites = [];
var animNames = ['attack1', 'attack2', 'attack3', 'fall', 'hurt', 'idle1', 'idle2', 'jump', 'run1', 'run2', 'slide', 'stand']
var EKey, QKey, OneKey, TwoKey, ThreeKey, FourKey;
function preload() {
    EKey = this.input.keyboard.addKey('E');
    QKey = this.input.keyboard.addKey('Q');
    OneKey = this.input.keyboard.addKey('1');
    TwoKey = this.input.keyboard.addKey('2');
    ThreeKey = this.input.keyboard.addKey('3');
    FourKey = this.input.keyboard.addKey('4');
    console.log(this)

    console.log(this.Input)

    this.load.atlas({
        key: 'adventurer',
        textureURL: 'assets/adventurer.png',
        atlasURL: 'assets/adventurer.json'
    });


}

function create() {
    testSprite = this.add.sprite(400, 300, 'adventurer', 4)

    text = this.add.text(10, 30, '', { font: '16px Courier', fill: '#ffffff' });
    createPlayerAnims.call(this)
    createPlayer.call(this)
    

    
    cursors = this.input.keyboard.createCursorKeys();
    console.log(cursors)
    
}

function update() {
    updatePlayer.call(this)

    var debug = []
    debug.push("Space to Basic Attack | Q to alternative attack")
    debug.push("E to switch weapon")
    debug.push("Arrow Keys to move")
    debug.push("\n \n \n")
    debug.push("player State : " + player.state)
    debug.push("player Equipment : " + player.equiped)
    debug.push("Chain : " + chain)
    text.setText(debug)
}

//***************** NON PHASER.SCENE FUNCTIONS ************//
//*********************************************************//
function createPlayer() {
    player = {
        state: 0,
        states: {
            IDLE: 0,
            WALKING: 1,
            ATTACKING: 2,
        },
        lastAttack: null,
        equiped: 1,
        equipment: {
            swappingFrom: null,
            SWAP: 0,
            HANDS: 1,
            SWORD: 2,
        }
    }
}

function updatePlayer() {
    console.log(player.state)

    if (Phaser.Input.Keyboard.JustDown(EKey) && player.state != player.states.ATTACKING && player.equiped != player.equipment.SWAP) {
        
        if (player.equiped == player.equipment.HANDS) {

            testSprite.once('animationstart', function () {
                console.log("Animation Started Draw")
                player.equiped = player.equipment.SWAP;
                player.equipment.swappingFrom = player.equipment.HANDS
            })
            testSprite.play('draw', true)
            testSprite.once('animationcomplete', function () {

                console.log("Animation Ended")
                player.equiped = player.equipment.SWORD;
            })
        } else {
            testSprite.once('animationstart', function () {
                console.log("Animation Started Sheath")
                player.equiped = player.equipment.SWAP;
                player.equipment.swappingFrom = player.equipment.SWORD
            })
            testSprite.play('sheath', true)
            testSprite.once('animationcomplete', function () {
                console.log("Animation Ended Sheath")
                player.equiped = player.equipment.HANDS;
            })
        }
    }                                                           
    if (player.equiped != player.equipment.SWAP) {
        if (player.equiped == player.equipment.HANDS) {
            if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                if (player.state != player.states.ATTACKING || chain ) {
                    if ((chain && player.lastAttack == "hands")) {
                        player.attack++
                        if (player.attack > 3) {
                            player.attack = 1
                        }
                        chain = false
                    } else {
                        player.attack = 1
                    }
                    clearTimeout(testtimeout)
                    testSprite.once('animationstart', function () {
                        console.log("Animation Started Hands")
                        player.lastAttack = "hands"
                        player.state = player.states.ATTACKING;
                    })
                    testSprite.play('punch' + player.attack, true)
                    testSprite.on('animationupdate', function (animation, frame, gameObject) {
                        if (animation.frames.length - frame.index <= 0) {
                            chain = true
                            testtimeout = setTimeout(function () { chain = false }, 220)
                        }
                    }, "attack", false)     
                    testSprite.once('animationcomplete', function () {

                        console.log("Animation Ended")
                        player.state = player.states.IDLE;
                        testSprite.off('animationupdate')
                    })

                }
            }
            else if (Phaser.Input.Keyboard.JustDown(QKey)) {
                if (player.state != player.states.ATTACKING || chain) {
                    if ((chain && player.lastAttack == "kick")) {
                        player.attack++
                        if (player.attack > 4) {
                            player.attack = 1
                        }
                        chain = false
                    } else {
                        player.attack = 1
                    }
                    clearTimeout(testtimeout)
                    testSprite.once('animationstart', function () {
                        console.log("Animation Started Kick")
                        player.lastAttack = "kick"
                        player.state = player.states.ATTACKING;
                    })
                    testSprite.play('kick' + ((player.attack % 2) + 1), true)
                    testSprite.on('animationupdate', function (animation, frame, gameObject) {
                        if (animation.frames.length - frame.index <= 1) {
                            chain = true
                            testtimeout = setTimeout(function () { chain = false }, 250)
                        }
                    }, "attack", false)
                    testSprite.once('animationcomplete', function () {
                        console.log("Animation Ended")
                        player.state = player.states.IDLE;
                        console.log(player.state)
                        testSprite.off('animationupdate')
                    })

                }
            }
            if (cursors.right.isDown && player.state != player.states.ATTACKING) {
                testSprite.play('run2', true)
                testSprite.setFlipX(false)
            }
            else if (cursors.left.isDown && player.state != player.states.ATTACKING) {
                testSprite.play('run2', true)
                testSprite.setFlipX(true)
            }
            else if (player.state == player.states.IDLE) {
                testSprite.play('idle1', true)
            }
        }
        if (player.equiped == player.equipment.SWORD) {
            if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
                if (player.state != player.states.ATTACKING || chain) {
                    if ((chain && player.lastAttack == "sword")) {
                        player.attack++
                        if (player.attack > 3) {
                            player.attack = 1
                        }
                        chain = false
                    } else {
                        player.attack = 1
                    }
                    clearTimeout(testtimeout)
                    testSprite.once('animationstart', function () {
                        console.log("Animation Started Sword")
                        player.lastAttack = "sword"
                        player.state = player.states.ATTACKING;
                    })
                    testSprite.play('attack' + player.attack, true)
                    testSprite.on('animationupdate', function (animation, frame, gameObject) {
                        if (animation.frames.length - frame.index <= 1) {
                            chain = true
                            testtimeout = setTimeout(function () { chain = false }, 400)
                        }
                    }, "attack", false)
                    testSprite.once('animationcomplete', function () {
                        console.log("Animation Ended")
                        player.state = player.states.IDLE;
                        testSprite.off('animationupdate')
                    })

                }
            }
            else if (Phaser.Input.Keyboard.JustDown(QKey)) {
                if (player.state != player.states.ATTACKING || chain) {
                    player.attack = 1
                    clearTimeout(testtimeout)
                    player.state = player.states.ATTACKING;
                    testSprite.once('animationstart', function () {
                        console.log("Animation Started Bow")
                        player.lastAttack = "bow"
                    })
                    testSprite.play('bow', true)
                    testSprite.on('animationupdate', function (animation, frame, gameObject) {
                        console.log("update")
                    }, "attack", false)
                    testSprite.once('animationcomplete', function () {
                        console.log("Animation Ended")
                        console.log("Bow ended")
                        player.state = player.states.IDLE;
                        testSprite.off('animationupdate')
                    })

                }
            }
            if (cursors.right.isDown && player.state != player.states.ATTACKING) {
                testSprite.play('run3', true)
                testSprite.setFlipX(false)
            }
            else if (cursors.left.isDown && player.state != player.states.ATTACKING) {
                testSprite.play('run3', true)
                testSprite.setFlipX(true)
            }
            else if (player.state == player.states.IDLE) {
                testSprite.play('idle2', true)
            }
        }
           
    }
    
}

function createPlayerAnims() {
    this.anims.create({
        key: 'crouch',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-crouch-', suffix: ''
        }),
        frameRate: 8,
        repeat: 0
    }); //crouch
    this.anims.create({
        key: 'attack1',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 4, zeroPad: 2,
            prefix: 'adventurer-attack1-', suffix: ''
        }),
        duration: 450,
        repeat: 0
    }); //attack1
    this.anims.create({
        key: 'attack2',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 5, zeroPad: 2,
            prefix: 'adventurer-attack2-', suffix: ''
        }),
        duration: 450,
        repeat: 0
    }); //attack2
    this.anims.create({
        key: 'attack3',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 5, zeroPad: 2,
            prefix: 'adventurer-attack3-', suffix: ''
        }),
        duration: 350,
        repeat: 0
    }); //attack3
    this.anims.create({
        key: 'punch1',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-punch-', suffix: ''
        }),
        duration: 400,
        repeat: 0
    }); //punch1
    this.anims.create({
        key: 'punch2',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 4, end: 7, zeroPad: 2,
            prefix: 'adventurer-punch-', suffix: ''
        }),
        duration: 400,
        repeat: 0
    }); //punch2
    this.anims.create({
        key: 'punch3',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 8, end: 12, zeroPad: 2,
            prefix: 'adventurer-punch-', suffix: ''
        }),
        duration: 400,
        repeat: 0
    }); //punch3
    this.anims.create({
        key: 'runpunch',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 6, zeroPad: 2,
            prefix: 'adventurer-run-punch-', suffix: ''
        }),
        frameRate: 8,
        repeat: 0
    }); //runpunch
    this.anims.create({
        key: 'kick2',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-kick-', suffix: ''
        }),
        duration: 450,
        repeat: 0
    }); //kick1
    this.anims.create({
        key: 'kick1',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 4, end: 7, zeroPad: 2,
            prefix: 'adventurer-kick-', suffix: ''
        }),
        duration: 350,
        repeat: 0
    }); //kick2
    // Kicks were swapped on how the double kick combo use modulus, which causes the call order to be 2 -> 1 -> 2 -> 1
    this.anims.create({
        key: 'bow',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 2, end: 8, zeroPad: 2,
            prefix: 'adventurer-bow-', suffix: ''
        }),
        duration: 450,
        repeat: 0
    }); //bow
    this.anims.create({
        key: 'run1',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 5, zeroPad: 2,
            prefix: 'adventurer-run-', suffix: ''
        }),
        frameRate: 12,
        duration: 1000,
        repeat: 0
    }); //run1
    this.anims.create({
        key: 'run2',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 5, zeroPad: 2,
            prefix: 'adventurer-run2-', suffix: ''
        }),
        frameRate: 12,
        duration: 1000,
        repeat: 0
    }); //run2
    this.anims.create({
        key: 'run3',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 5, zeroPad: 2,
            prefix: 'adventurer-run3-', suffix: ''
        }),
        frameRate: 12,
        duration: 1000,
        repeat: 0
    }); //run3
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 5, zeroPad: 2,
            prefix: 'adventurer-walk-', suffix: ''
        }),
        frameRate: 8,
        duration: 2000,
        repeat: 0
    }); //walk
    this.anims.create({
        key: 'idle1',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-idle-', suffix: ''
        }),
        frameRate: 8,
        duration: 2000,
        repeat: 0
    }); //idle1
    this.anims.create({
        key: 'idle2',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-idle-2-', suffix: ''
        }),
        frameRate: 8,
        duration: 2000,
        repeat: 0
    }); //idle2
    this.anims.create({
        key: 'draw',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-swrd-drw-', suffix: ''
        }),
        duration: 230,
        repeat: 0
    }); //draw
    this.anims.create({
        key: 'sheath',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-swrd-shte-', suffix: ''
        }),
        duration: 230,
        repeat: 0
    }); //sheath
}
