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
    },
    callbacks: {
        postBoot: function () {
            resize();
        }
    }
};
//*********** PHASER BASED VARIABLES AND SYSTEMS ************//
//*********************************************************//
var game = new Phaser.Game(config);
var debug = {}
var EKey, QKey, RKey, OneKey, TwoKey, ThreeKey, FourKey;
var camera;


function preload() {
    // Setting up Keyboard
    EKey = this.input.keyboard.addKey('E');
    QKey = this.input.keyboard.addKey('Q');
    RKey = this.input.keyboard.addKey('R');
    OneKey = this.input.keyboard.addKey('1');
    TwoKey = this.input.keyboard.addKey('2');
    ThreeKey = this.input.keyboard.addKey('3');
    FourKey = this.input.keyboard.addKey('4');

    // Loading Map Assets
    this.load.image("background", "assets/map/Background.png");
    this.load.image("midground", "assets/map/Middleground.png");
    this.load.image("props", "assets/map/Props.png");
    this.load.image("tileset", "assets/map/Tileset.png");
    this.load.image("ladder", "assets/map/ladder.png");
    this.load.image("spike", "assets/map/spike.png");
    this.load.spritesheet(
        "coin",
        "assets/coin.png",
        { frameWidth: 8, frameHeight: 8 }
    )
    this.load.spritesheet(
        "powerup",
        "assets/powerup.png",
        { frameWidth: 8, frameHeight: 8 }
    )
    this.load.spritesheet(
        "batfly",
        "assets/batfly.png",
        { frameWidth: 16, frameHeight: 24 }
    )
    this.load.spritesheet(
        "batdie",
        "assets/batdie.png",
        { frameWidth: 16, frameHeight: 24 }
    )
    
    this.load.tilemapTiledJSON("tilemap", "assets/map/Map.json");

    // Loading Player Animation Atlas
    this.load.atlas({
        key: 'adventurer',
        textureURL: 'assets/adventurer.png',
        atlasURL: 'assets/adventurer.json'
    });
}

function create() {
    gems = this.physics.add.group()
    powerup = this.physics.add.group()

    window.addEventListener("resize", resize, false);

    createMap.call(this)

    var playerSpawn = map.findObject("Spawn Layer", function (object) {
        if (object.name === "Spawn") {
            return object
        }
    })

    createPlayerAnims.call(this)
    createPlayer.call(this, playerSpawn)
    createObjectAnims.call(this)
    createEnemyAnims.call(this)

    player.hitbox = this.add.rectangle(player.sprite.x + 10, player.sprite.y + 10, 16, 32, 0xFFFFFF, 0)
    this.physics.add.existing(player.hitbox)
    player.hitbox.body.allowGravity = false

    createGems.call(this)
    createPowerup.call(this)    
    createCamera.call(this)

    cursors = this.input.keyboard.createCursorKeys();

    var enemySpawn, enemyDest, line, enemy;
    enemies = this.physics.add.group();
    var enemySpawns = findPoints.call(this, map, 'Enemy Layer', 'Spawn')
    console.log(enemySpawns)
    var len = enemySpawns.length
    for (var i = 1; i < len + 1; i++) {
        enemySpawn = findPoint.call(this, map, 'Enemy Layer', 'Spawn', i);
        enemyDest = findPoint.call(this, map, 'Enemy Layer', 'Path', i);
        line = new Phaser.Curves.Line(enemySpawn, enemyDest);
        enemy = this.add.follower(line, enemySpawn.x, enemySpawn.y, 'enemy');
        enemy.anims.play('batfly', true);
        enemy.alive = true
        enemies.add(enemy);

        enemy.body.setSize(10, 10, true)
        enemy.body.allowGravity = false;
        enemy.startFollow(
            {
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            }
        );

    }

    createCollision.call(this)

    debug.text = this.add.text(225, 165, '', { font: '11px Courier', fill: '#ffffff' });
    debug.text.setScrollFactor(0, 0)

}
var flag = false
function update() {
    debug.string = []
//*********************************************************//
    updatePlayer.call(this)
    updateHitbox.call(this)
    updateObjectAnims.call(this)

    
    if (dead && !flag) {
        console.log("fade")
        flag = !flag
        camera.fadeOut(1000, 0, 0, 0)

    } else if (score == gems.getChildren().length && !flag) {
        console.log("fade")
        flag = !flag
        camera.fadeOut(1000, 255, 255, 255)

    }

//*********************************************************//
    debug.string.push("Arrow Keys to move  |  Space to Jump")
    debug.string.push(" Q to Basic Attack  |  E to alternative attack")
    debug.string.push(" R to Swap Weapons  |  Press up on ladders to climb")
    debug.string.push("Collect all gems to win")
    debug.string.push("Collect potion to double jump")
    debug.string.push("Score:" + score)
    debug.text.setText(debug.string)
}

//*********** GAME BASED VARIABLES AND SYSTEMS ************//
//*********************************************************//
var score = 0;
var map;
var layers = {};
var ladders, spikes;
var gems, powerup;
var enemies;
var player = {
    sprite: null,
    equipped: null,
    hitbox: null,
    state: 0,
    lives: 3,
    invunerable: false,
    jumps: 0,
    maxJumps: 1,
    States: {
        IDLE: 0,
        ATTACKING: 1,
        JUMPING: 2,
        JUMPED: 3,
        SWAPPING: 4,
        CASTING: 5,
        CLIMBING: 6,
        HURT: 7,
        DYING: 8
    },
    attack: {
        hit: false,
        last: "",
        chain: false,
        chainFrame: null,
        startChainFrame: function (duration) {
            if (duration == -1) {
                player.attack.chain = false;
                return;
            }
            player.attack.chain = true
            player.attack.chainFrame = setTimeout(function () {
                player.attack.chain = false
            }, duration)
        },
        cancelChainFrame: function () {
            clearTimeout(player.attack.chainFrame)
        },
        sequence: 1
    }
}
var equipment = {
    HANDS: {
        attack: {
            normal: {
                name: "punch",
                run: function () {
                    player.sprite.setVelocityX(0)
                    console.log(player.attack.chain && player.attack.last == this.name)
                    console.log(this.name)
                    if (player.attack.chain && player.attack.last == this.name) {
                        player.attack.sequence++
                        if (player.attack.sequence > this.maxChain) {
                            player.attack.sequence = 1
                        }
                    } else {
                        player.attack.sequence = 1
                    }
                    player.attack.cancelChainFrame()
                    player.sprite.once('animationstart', function () {
                        player.attack.last = equipment.HANDS.attack.normal.name
                        player.state = player.States.ATTACKING;
                    })
                    player.sprite.play('punch' + player.attack.sequence, true)
                    player.sprite.on('animationupdate', function (animation, frame, gameObject) {
                        if (animation.frames.length - frame.index <= equipment.HANDS.attack.normal.hits[player.attack.sequence - 1].frame) {
                            player.attack.startChainFrame(equipment.HANDS.attack.normal.hits[player.attack.sequence - 1].chainTime)
                            playerAttack()
                            player.sprite.off('animationupdate')
                        }
                    }, "attack", false)
                    player.sprite.once('animationcomplete', function () {
                        player.state = player.States.IDLE;
                    })

                },
                maxChain: 3,
                hits: [
                    { frame: 3, chainTime: 400, damage: 1, knockback: true, knockup: false },
                    { frame: 3, chainTime: 400, damage: 2, knockback: true, knockup: false },
                    { frame: 3, chainTime: -1, damage: 4, knockback: true, knockup: true }
                ]
            },
            alternative: {
                name: "kick",
                run: function () {
                    player.sprite.setVelocityX(0)
                    console.log(player.attack.chain && player.attack.last == this.name)
                    console.log(this.name)
                    if (player.attack.chain && player.attack.last == this.name) {
                        player.attack.sequence++
                        if (player.attack.sequence > this.maxChain) {
                            player.attack.sequence = 1
                        }
                    } else {
                        player.attack.sequence = 1
                    }
                    player.attack.cancelChainFrame()
                    player.sprite.once('animationstart', function () {
                        player.attack.last = equipment.HANDS.attack.alternative.name
                        player.state = player.States.ATTACKING;
                    })
                    player.sprite.play('kick' + Math.ceil(player.attack.sequence / 2), true)
                    player.sprite.on('animationupdate', function (animation, frame, gameObject) {
                        if (animation.frames.length - frame.index <= equipment.HANDS.attack.alternative.hits[player.attack.sequence - 1].frame) {
                            player.attack.startChainFrame(equipment.HANDS.attack.alternative.hits[player.attack.sequence - 1].chainTime)
                            playerAttack()
                            player.sprite.off('animationupdate')
                        }
                    }, "attack", false)
                    player.sprite.once('animationcomplete', function () {
                        player.state = player.States.IDLE;
                    })
                },
                maxChain: 4,
                hits: [
                    { frame: 3, chainTime: 400, damage: 1, knockback: false, knockup: false },
                    { frame: 3, chainTime: 400, damage: 2, knockback: true, knockup: false },
                    { frame: 3, chainTime: 400, damage: 1, knockback: false, knockup: false },
                    { frame: 3, chainTime: -1, damage: 3, knockback: false, knockup: true }
                ]
            }
        },
        movement: {
            idle: function () {
                player.sprite.setVelocityX(0)
                player.sprite.play('idle1', true)
            },
            walking: function (flipped, vx) {


            },
            running: function (flipped, vx) {
                player.sprite.setVelocityX(vx);
                player.sprite.play('run2', true)
                player.sprite.setFlipX(flipped)
            },
            jump: function () {
                player.state = player.States.JUMPING;
                player.jumps++
                player.sprite.once('animationstart', function () {
                })
                player.sprite.play('jumping', true)
                player.sprite.on('animationupdate', function (animation, frame, gameObject) {
                    if (animation.frames.length - frame.index <= 1) {
                        player.state = player.States.JUMPED;
                        player.sprite.setVelocityY(-170)
                        player.sprite.off('animationupdate')
                    }
                }, "jump", false)
                player.sprite.once('animationcomplete', function () {
                })
            },
            climb: function () {
                player.state = player.States.CLIMBING
                console.log("climbing")
                player.sprite.play('climb', true)
                player.sprite.setVelocityY(-80)
            }
        }
    },
    SWORD: {
        attack: {
            normal: {
                name: "sword",
                run: function () {
                    player.sprite.setVelocityX(0)
                    console.log(player.attack.chain && player.attack.last == this.name)
                    console.log(this.name)
                    if (player.attack.chain && player.attack.last == this.name) {
                        player.attack.sequence++
                        if (player.attack.sequence > this.maxChain) {
                            player.attack.sequence = 1
                        }
                    } else {
                        player.attack.sequence = 1
                    }
                    player.attack.cancelChainFrame()
                    player.sprite.once('animationstart', function () {
                        player.attack.last = equipment.SWORD.attack.normal.name
                        player.state = player.States.ATTACKING;
                    })
                    player.sprite.play('attack' + player.attack.sequence, true)
                    player.sprite.on('animationupdate', function (animation, frame, gameObject) {
                        if (animation.frames.length - frame.index <= equipment.SWORD.attack.normal.hits[player.attack.sequence - 1].frame) {
                            player.attack.startChainFrame(equipment.SWORD.attack.normal.hits[player.attack.sequence - 1].chainTime)
                            playerAttack()
                            player.sprite.off('animationupdate')
                        }
                    }, "attack", false)
                    player.sprite.once('animationcomplete', function () {
                        player.state = player.States.IDLE;
                    })

                },
                maxChain: 3,
                hits: [
                    { frame: 3, chainTime: 400, damage: 2, knockback: false, knockup: false },
                    { frame: 4, chainTime: 450, damage: 2, knockback: false, knockup: true },
                    { frame: 3, chainTime: -1, damage: 4, knockback: true, knockup: false }
                ]
            },
            alternative: {
                name: "bow",
                run: function () {
                    player.sprite.setVelocityX(0)

                },
                maxChain: 1,
                hits: [
                    { damage: 5, knockback: true, knockup: false }
                ]
            }
        },
        movement: {
            idle: function () {
                player.sprite.setVelocityX(0)
                player.sprite.play('idle2', true)
            },
            walking: function (flipped, vx) {


            },
            running: function (flipped, vx) {
                player.sprite.setVelocityX(vx);
                player.sprite.play('run3', true)
                player.sprite.setFlipX(flipped)
            },
            jump: function () {

            },
            climb: function () {

            }
        }
    },
    Swap: function () {
        player.sprite.setVelocityX(0)
        if (player.equipped == equipment.HANDS) {
            player.sprite.once('animationstart', function () {
                console.log("Animation Started Draw")
                player.state = player.States.SWAPPING
            })
            player.sprite.play('draw', true)
            player.sprite.once('animationcomplete', function () {
                player.state = player.States.IDLE;
                console.log("Animation Ended")
                player.equipped = equipment.SWORD;
                console.log(player.equipped)
            })
        } else {
            player.sprite.once('animationstart', function () {
                console.log("Animation Started Sheath")
                player.state = player.States.SWAPPING
            })
            player.sprite.play('sheath', true)
            player.sprite.once('animationcomplete', function () {
                player.state = player.States.IDLE;
                console.log("Animation Ended")
                player.equipped = equipment.HANDS;
            })
        }
    }

}
//***************** NON PHASER.SCENE FUNCTIONS ************//
//*********************************************************//
function findPoint(map, layer, type, name) {
    var loc = map.findObject(layer, function (object) {
        if (object.type == type && object.name == name) {
            return object;
        }
    });
    return loc
}

function findPoints(map, layer, type) {
    //var locs = map.filterObjects(layer, obj => obj.type === type);
    var locs = map.filterObjects(layer, function (object) {
        if (object.type === type) {
            return object
        }
    });
    return locs
}

function createPlayer(spawn) {
    player.sprite = this.physics.add.sprite(spawn.x, spawn.y, 'adventurer')
    player.sprite.setCollideWorldBounds(true);
    player.equipped = equipment.HANDS
}

function createMap() {
    this.physics.world.setBounds(0, 0, 16 * 200, 16 * 50)
    console.log(layers)
    // background
    this.add.image(400, 250, 'background').setScrollFactor(0.005, 0.12).setScale(1, 1.3).update();
    this.add.image(400, 320, 'midground').setScrollFactor(0.01, 0.1).setScale(1, 1.3).update();

    map = this.make.tilemap({ key: "tilemap" })
    var tileset = map.addTilesetImage("Tileset", "tileset")
    var props = map.addTilesetImage("Props", "props")
    map.createStaticLayer("Background Layer", [tileset, props], 0, 0);
    map.createStaticLayer("Prop Layer", [tileset, props], 0, 0);
    layers.collisionLayer = map.createStaticLayer("Collision Layer", [tileset, props], 0, 0);
    layers.ladderLayer = map.createStaticLayer("Ladder Layer", [tileset, props], 0, 0);
    layers.spikeLayer = map.createStaticLayer("Spike Layer", [tileset, props], 0, 0);

    layers.collisionLayer.setCollisionBetween(0, 1000)
    var group = layers.ladderLayer.createFromTiles(154, -1, { key:"ladder"})
    ladders = this.physics.add.staticGroup()
    ladders.addMultiple(group)
    ladders.getChildren().forEach(function (sprite) {
        sprite.setX(sprite.x+8)
        sprite.setY(sprite.y + 8)
    })
    ladders.refresh()
    group = layers.spikeLayer.createFromTiles(82, -1, { key: "spike" })
    spikes = this.physics.add.staticGroup()
    spikes.addMultiple(group)
    spikes.getChildren().forEach(function (sprite) {
        sprite.setX(sprite.x+8)
        sprite.setY(sprite.y + 8)
        sprite.alive = true
    })
    spikes.refresh()
   
}

function createCollision() {
    this.physics.add.collider(player.sprite, layers.collisionLayer);
    this.physics.add.collider(ladders, layers.collisionLayer);
    this.physics.add.overlap(player.sprite, ladders);
    this.physics.add.overlap(player.sprite, spikes, playerDie);
    this.physics.add.overlap(player.sprite, enemies, playerDie);
    this.physics.add.overlap(player.sprite, gems, gemPickup);
    this.physics.add.overlap(player.sprite, powerup, powerPickup);
    this.physics.add.overlap(player.hitbox, enemies, enemyHit, null, this);
    console.log(player.hitbox)
}

function createCamera() {
    camera = this.cameras.getCamera("")
    //Change camera settings
    camera.zoom =2.2;
    camera.startFollow(player.sprite);
    camera.setBounds(0, 0, 16*200, 16*50)
}

function createObjectAnims() {
    this.anims.create({
        key: 'coin',
        frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: 0
    });
    this.anims.create({
        key: 'powerup',
        frames: this.anims.generateFrameNumbers('powerup', { start: 0, end: 0}),
        frameRate: 8,
        repeat: 0
    });
}

function createGems() {
    map.filterObjects("Gem Layer", function (object) {
        var gem = gems.create(object.x + 8, object.y - 8, "gem")
        gem.setSize(8, 8)
        gem.setOffset(0, 0)
        gem.body.allowGravity = false
    })
}

function createPowerup() {
    map.filterObjects("Powerup Layer", function (object) {
        var pUp = powerup.create(object.x + 8, object.y -8, "powerup")
        pUp.setSize(8, 8)
        pUp.setOffset(0, 0)
        pUp.body.allowGravity = false
    })
}

function updateObjectAnims() {

    gems.children.iterate(function (object) {
        object.anims.play('coin', true)
    })
    powerup.children.iterate(function (object) {
        object.anims.play('powerup', true)
    })
}

function createEnemyAnims() {
    this.anims.create({
        key: 'batfly',
        frames: this.anims.generateFrameNumbers('batfly', { start: 0, end: 4 }),
        frameRate: 8,
        repeat: -1
    });
    this.anims.create({
        key: 'batdie',
        frames: this.anims.generateFrameNumbers('batdie', { start: 0, end: 4 }),
        frameRate: 8,
        repeat: 0
    });

}


function updatePlayer() {
    player.sprite.setSize(14, 32);
    player.sprite.setOffset(18, 4)

    if (player.state != player.States.ATTACKING && player.attack.hit) {
        player.attack.hit = false
    }

    if (player.state == player.States.CLIMBING) {
        if (cursors.up.isDown && this.physics.overlap(player.sprite, ladders)) {
            player.equipped.movement.climb()
        } else {
            player.state = player.States.IDLE
            player.sprite.setVelocityX(0)
        }
    } else {
        if (player.sprite.body.velocity.y < 0) {
            player.sprite.play('jumped', true);
            player.state = player.States.JUMPED
        } else if (player.sprite.body.velocity.y > 0) {
            player.sprite.play('fall', true);
            player.state = player.States.JUMPED
            if (Phaser.Input.Keyboard.JustDown(cursors.space) && player.jumps < player.maxJumps) {
                player.equipped.movement.jump()
            }
        }
    }
    
    
    if (player.state == player.States.IDLE) {

        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            player.equipped.movement.jump()
        } else if (cursors.up.isDown && this.physics.overlap(player.sprite, ladders)) {
            player.equipped.movement.climb()
        } else if (Phaser.Input.Keyboard.JustDown(QKey)) {
            player.equipped.attack.normal.run()
        } else if (Phaser.Input.Keyboard.JustDown(EKey)) {
            player.equipped.attack.alternative.run()
        } else if (Phaser.Input.Keyboard.JustDown(RKey)) {
            equipment.Swap.call(this)
        } else if (cursors.right.isDown) {
            player.equipped.movement.running(false, 150)
        } else if (cursors.left.isDown) {
            player.equipped.movement.running(true, -150)
        } else {
            player.equipped.movement.idle()
        }



    } else if (player.state == player.States.JUMPED) {
        console.log(player.sprite.body.touching.down)

        if (cursors.right.isDown) {
            player.sprite.setVelocityX(100)
            player.sprite.setFlipX(false)
        } else if (cursors.left.isDown) {
            player.sprite.setVelocityX(-100)
            player.sprite.setFlipX(true)
        }
        if (player.sprite.body.blocked.down) {
            player.jumps = 0
        }
        if (player.sprite.body.velocity.y == 0) {
            player.state = player.States.IDLE

        }
    } 
}

function updateHitbox() {
    if (player.sprite.flipX) {
        player.hitbox.x = player.sprite.x - 16
    } else {
        player.hitbox.x = player.sprite.x + 16
    }
    player.hitbox.y = player.sprite.y
    
}

function playerAttack() {
    player.attack.hit = true;
}

function playerHurt() {

    player.state = player.States.HURT
}
var dead = false
function playerDie(char, enemy) {
    if (enemy.alive) {
        player.state = player.States.DYING
        player.sprite.play('die', true)

        player.sprite.on('animationupdate', function (animation, frame, gameObject) {
            if (animation.frames.length - frame.index <= 1) {
                console.log("finished")
                player.sprite.disableBody(true, true)
                player.sprite.off('animationupdate')
                dead = true
            }
        })
    }

}

function enemyHit(char, enemy) {
    if (player.attack.hit && enemy.alive) {
        enemy.alive = false
        enemy.stopFollow()
        enemy.play('batdie', true)
        enemy.once('animationcomplete', function () {
            enemy.visible = false
        })
        console.log("hit")
        
        enemy.disableBody(true, true);
    }

}

function gemPickup(char, gem) {
    gem.disableBody(true, true);
    score++
}

function powerPickup(char, powerup) {
    player.maxJumps++
    console.log("Picked up powerup")
    powerup.disableBody(true, true);
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
    this.anims.create({
        key: 'jumping',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 2, zeroPad: 2,
            prefix: 'adventurer-jump-', suffix: ''
        }),
        frameRate: 60,
        repeat: 0
    }); //jumping
    this.anims.create({
        key: 'jumped',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 3, end: 3, zeroPad: 2,
            prefix: 'adventurer-jump-', suffix: ''
        }),
        frameRate: 10,
        repeat: 0
    }); //jumped
    this.anims.create({
        key: 'fall',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 1, zeroPad: 2,
            prefix: 'adventurer-fall-', suffix: ''
        }),
        frameRate: 10,
        repeat: 0
    }); //fall
    this.anims.create({
        key: 'climb',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 3, zeroPad: 2,
            prefix: 'adventurer-ladder-climb-', suffix: ''
        }),
        frameRate: 10,
        repeat: 0
    }); //cilmb
    this.anims.create({
        key: 'die',
        frames: this.anims.generateFrameNames('adventurer', {
            start: 0, end: 6, zeroPad: 2,
            prefix: 'adventurer-die-', suffix: ''
        }),
        frameRate: 10,
        repeat: 0
    }); //die
}

function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;

    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
