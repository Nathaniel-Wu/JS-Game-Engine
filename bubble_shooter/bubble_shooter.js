//---------------------------------------------- Bubble Shooter

class BubbleShooter extends Game {
    constructor() {
        super(60);
        this.bubbles = null;
        this.shooter = null;
    }

    init() {
        super.init();
        //Do something
    }

    update() {
        //Do something
    }

    draw() {
        //Do something
    }
}

//---------------------------------------------- Bubble Sprite

class Bubble extends Sprite {
    constructor(x, y, r) {//Center coord and radius
        super(x - r, y - r, 2 * r, 2 * r);
        this.coord.x += r;
        this.coord.y += r;
        this.root_bounding_volume = new CircleBoundingVolume(0, 0, r);
    }

    attach_decorator(sub_sprite, x_offset, y_offset) {
        //Do nothing, disabling this function
    }

    move_prediction() {
        if (this.moveVect)
            return new Bubble(this.coord.x + this.moveVect.x, this.coord.y + this.moveVect.y, this.r);
        return new Bubble(this.coord.x, this.coord.y, this.r);
    }

    update() {
        //Do something
    }

    actual_draw() {
        //Do something
    }
}

//---------------------------------------------- Run

var game = new BubbleShooter();
game.init();
game.start_loop();