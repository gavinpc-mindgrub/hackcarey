// Initialize Phaser, and create a 700x500px game
var game = new Phaser.Game(700, 500, Phaser.AUTO, 'gameDiv');

// Create our 'main' state that will contain the game
var mainState = {

    preload: function() {
        //Change the background color to something more sky-like
        game.stage.backgroundColor = "#6495ED";

        //Load the game sprites
        game.load.spritesheet('mario', 'assets/marioSpriteSheet.png', 51, 51);
        game.load.image('brick', 'assets/brick.png');
        game.load.image('pipe', 'assets/pipe.png');
        game.load.image('cloud', 'assets/cloud.png');
    },

    create: function() {
        //Set the physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);


        //Adds two clouds, one on screen and one off screen
        this.cloud1 = game.add.sprite(570, this.randomCloudY(), 'cloud');
        this.cloud2 = game.add.sprite(920, this.randomCloudY(), 'cloud');
        game.physics.arcade.enable(this.cloud1);
        game.physics.arcade.enable(this.cloud2);

        //Display Mario on the screen
        this.mario = this.game.add.sprite(100,320,'mario');
        //Sets mario's sprite frame to the 0th one
        this.mario.frame = 0;

        //Creates an animation for mario using the first, second, and third frames at 10fps
        //true turns looping on
        this.mario.animations.add('moving', [1,2,3], 15, true);

        //Makes sure Mario flips around his x-axis
        this.mario.anchor.setTo(0.5, 1);

        //Add gravity to Mario to make him fall
        game.physics.arcade.enable(this.mario);
        this.mario.body.gravity.y = 2500;

        //Create a new TileSprite that can hold the bricks for Mario to stand on

        //Creates blocks for mario to jump on
        this.blocks = game.add.group(); //Creates a group
        this.blocks.enableBody = true; //Adds physics to the group
        this.blocks.createMultiple(21, 'brick'); //Creates 21 blocks

        //Creates pipes for mario to go down
        this.pipes = game.add.group();
        this.pipes.enableBody = true;
        this.pipes.createMultiple(21, 'pipe');

        //Call the 'jump' function when the space bar is hit
        this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.spaceKey.onDown.add(this.jump, this);

        //Adds the left key to the program
        this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);

        //Adds the right key to the program
        this.rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

        //Adds the down key to the program, which calls the goDownPipe method when pressed
        this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.downKey.onDown.add(this.goDownPipe, this);

        //Create a variable to see whether Mario is on the ground
        this.isOnGround = false;

        //Create a variable to check if mario is on a pipe
        this.isOnPipe = false;

        //Create a variable to check if mario is inside a pipe
        game.isInPipe = false;

        //Adds the two starting platforms
        this.addPlatform(0, 500-34);
        this.addPlatform(34*3, 500-34);


        //Creates 5 starting blocks
        for (var i = 0; i < 5; i++) {
            this.addPlatformToGame();
        }

    },

    update: function() {

        //If Mario falls, the game will restart
        if(this.mario.y >= 500) {
            this.restartGame();
        }

        //If neither keys are pressed
        if(this.leftKey.isUp && this.rightKey.isUp || (this.leftKey.isDown && this.rightKey.isDown) || game.isInPipe) {


            //Stops all game objects from moving
            for (var i = 0; i < this.blocks.children.length; i++){
                this.blocks.children[i].body.velocity.x = 0;

                if (this.pipes.children[i].body != null)
                    this.pipes.children[i].body.velocity.x = 0;
            }
            this.cloud1.body.velocity.x = 0;
            this.cloud2.body.velocity.x = 0;

            //Stops mario from moving
            this.mario.body.velocity.x = 0;

            //Sets mario's frame to the one where he stands
            if(game.isOnGround) {
                this.mario.frame = 0;
            }
        }

        //If the a key is pressed, mario starts running

        //Left key
        else if(this.leftKey.isDown && this.rightKey.isUp && !game.isInPipe){

            //Stops all blocks from moving

            for (var i = 0; i < this.blocks.children.length; i++){
                this.blocks.children[i].body.velocity.x = 0;
                this.pipes.children[i].body.velocity.x = 0;
            }
            this.cloud1.body.velocity.x = 0;
            this.cloud2.body.velocity.x = 0;

            //Makes mario face to the left
            this.mario.scale.x = -1;

            //Gives mario his leftward speed
            this.mario.body.velocity.x = -200;

            //Prevents mario from going off screen to the left
            if(this.mario.x < 21){
                this.mario.body.velocity.x = 0;
            }

            //Plays the moving animation if moving and on ground
            if (game.isOnGround) {
                this.mario.animations.play('moving');

            }
        }

        //Right key
        else if(this.rightKey.isDown && this.leftKey.isUp && !game.isInPipe){

            //Makes mario face to the right
            this.mario.scale.x = 1;

            //Gives mario his rightward speed
            this.mario.body.velocity.x = 200;

            //If mario reaches a certain point, he stops and the floor scrolls
            //All game movement code will go here

            if (this.mario.x >= 250){

                this.mario.body.velocity.x = 0;

                //Makes all the blocks move to the left
                for (var i = 0; i < this.blocks.children.length; i++){
                    this.blocks.children[i].body.velocity.x = -175;
                    this.pipes.children[i].body.velocity.x = -175;
                }

                this.cloud1.body.velocity.x = -80;
                this.cloud2.body.velocity.x = -80;

            }

            //Plays the moving animation if moving and on ground
            if (game.isOnGround) {
                this.mario.animations.play('moving');

            }
        }

        this.killBlocksOffFrame();

        this.addNewPlatforms();

        //If a cloud goes off screen to the left, it will be moved off screen to the right
        //It will also be given a new, random y value
        if (this.cloud1.x <= -64) {
            this.cloud1.x += 800;
            this.cloud1.y = this.randomCloudY();
        }
        if (this.cloud2.x <= -64) {
            this.cloud2.x += 800;
            this.cloud2.y = this.randomCloudY();
        }
        //If mario collides with the any member of the 'blocks' group, he will stop falling
        //This will also set 'isOnGround' to true
        game.physics.arcade.collide(this.mario, this.blocks, this.marioIsOnGround);

        game.physics.arcade.collide(this.mario, this.pipes, this.marioIsOnPipe);

    },

    marioIsOnGround: function() {
        game.isOnGround = true;
    },

    marioIsOnPipe: function(mario, pipe) {
        game.isOnGround = true;

        //Creates a variable to store the current pipe;
        game.currentPipe = pipe;

        //Checks if mario is situated on top of the pipe and is in the center of it
        if (mario.y === pipe.y && mario.x >= pipe.x+25 && mario.x <= pipe.x+40)
            game.isOnPipe = true;
        else
            game.isOnPipe = false;
    },

    jump: function() {
        //Give Mario a vertical velocity if isOnGround == true
        if (game.isOnGround && this.mario.body.velocity.y == 0) {
            this.mario.body.velocity.y = -900;

            //No longer on the ground
            game.isOnGround = false;
            game.isOnPipe = false;

            //Set mario's frame to jumping
            this.mario.animations.stop();
            this.mario.frame = 4;
        }
    },

    addPipe: function(x, y) {

        var pipe = this.pipes.getFirstDead();

        pipe.reset(x, y);

        pipe.body.immovable = true;

    },

    addBlock: function(x, y) {
        //Get the first dead block in our group
        var block = this.blocks.getFirstDead();
        //Set the new position of the block
        block.reset(x, y);

        //Makes sure mario can't push blocks around
        block.body.immovable = true;

    },

    //Adds three blocks in a row
    addPlatform: function(x, y) {
        //block sprite is 34x34
        this.addBlock(x, y);
        this.addBlock(x+34, y);
        this.addBlock(x+(34*2), y);

        //1/5 chance of spawning a pipe
       if (Math.floor(Math.random() * 5) === 0) {
            this.addPipe(x+19, y-64);
        }
    },

    //Adds a platform at a random but jumpable height after the given hole vaule
    addPlatformToGame: function() {
        var yRandHeight = Math.floor(Math.random() * 500) + 1;

        var holeSize = 150;

        //Loop through all blocks and find the highest x value
        var x = this.getLastAddedBlock().x;

        //if yRandHeight is not jumpable, it will keep resetting it until it works
        while (this.checkJumpable(yRandHeight) === false) {
            yRandHeight = Math.floor(Math.random() * 500) + 1;
        }

        //Adds a new platform at the new position
        this.addPlatform(x + holeSize, yRandHeight);
    },

    //If block or a pipe goes off the screen, it will be killed
    killBlocksOffFrame: function() {
        for (var i = 0; i < this.blocks.children.length; i++){
            if (this.blocks.children[i].x < -34){
                this.blocks.children[i].kill();
            }
            if (this.pipes.children[i].x < -64){
                this.pipes.children[i].kill();
            }
        }

    },

    //If there are three dead blocks, a new platform will be added to the game
    addNewPlatforms: function() {
        if (this.blocks.countDead() >= 3){
            this.addPlatformToGame();
        }
    },

    //Loops through all blocks, finds the one with the highest x value, and returns it
    getLastAddedBlock: function() {
        var x = 0;
        var lastAddedBlock;
        for (var i = 0; i < this.blocks.length; i++){
            if (this.blocks.children[i].x > x){
                x = this.blocks.children[i].x;
                lastAddedBlock = this.blocks.children[i];
            }
        }
        return lastAddedBlock;
    },

    //Checks if a block with a given y value can be jumped to from the last created block
    checkJumpable: function(y) {

        var lastAdded = this.getLastAddedBlock();

        if (lastAdded.y - y < 130 && y < 466)
            return true;

        return false;
    },

    //Generates a random value to be used in cloud positioning
    randomCloudY: function() {
        return Math.floor(Math.random() * 310);
    },

    //If mario is in the correct spot, he goes down a pipe
    goDownPipe: function() {
        if (game.isOnPipe && !game.isInPipe) { //Can't be in the pipe

            game.isInPipe = true;

            //Mario moves down the pipe steadily
            this.mario.body.velocity.y = 50;
            this.mario.body.gravity.y = 0;
            game.currentPipe.body.enable = false; //We need to turn physics collisions off between mario and the current pipe

            //Starts a timer that will call the 'fallFromPipe' method after 1200 milliseconds
            var timer = game.time.create(true);
            timer.add(1200, this.fallFromPipe, this);
            timer.start();
        }
    },

    //Makes mario fall from the ceiling – can definitely be customized
    fallFromPipe: function() {
        //Resetting all the variables
        this.mario.body.gravity.y = 2500; //Moves mario off screen
        this.mario.y = -50;
        game.isInPipe = false;
        game.currentPipe.body.enable = true; //Make sure to re-enable the physics for the pipe
    },

    restartGame: function() {
        //Starts the 'main' state, which returns to the game
        game.state.start('main');
    }
};

// AAdd and start the 'main' state to start the game
game.state.add('main', mainState);
game.state.start('main');
