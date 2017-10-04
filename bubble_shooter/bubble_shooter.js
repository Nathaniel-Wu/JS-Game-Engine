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
    constructor(x, y, radius, r, g, b, a) {//Center coord, radius. color
        super(x - radius, y - radius, 2 * radius, 2 * radius);
        this.coord.x += radius;
        this.coord.y += radius;
        this.root_bounding_volume = new CircleBoundingVolume(0, 0, radius);
        this.root_bounding_volume.GObj = this;
        this.color = null;
        this.assign_color(r, g, b, a);
    }

    attach_decorator(sub_sprite, x_offset, y_offset) {
        //Do nothing, disabling this function
    }

    assign_color(r, g, b, a) {
        var validate = function (n) {
            if (!Utilities.isInteger(n))
                throw "Non-integer parameter error";
            return (n < 0 ? 0 : (n > 255 ? 255 : n))
        };
        this.color = "rgba(" + validate(r) + ", " + validate(g) + ", " + validate(b) + ", " + validate(a) + ")";
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
        //Base color
        context.beginPath();
        context.arc(this.coord.x, this.coord.y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = this.color;
        context.fill();
        //Specular simulation
        context.beginPath();
        context.lineWidth = 0.16 * this.radius;
        context.arc(this.coord.x, this.coord.y, 0.67 * this.radius, 1.05 * Math.PI, 1.25 * Math.PI);
        context.strokeStyle = "white";
        context.stroke();
        context.beginPath();
        context.lineWidth = 0.16 * this.radius;
        context.arc(this.coord.x, this.coord.y, 0.67 * this.radius, 1.3 * Math.PI, 1.37 * Math.PI);
        context.strokeStyle = "white";
        context.stroke();
    }
}

//---------------------------------------------- Run

var game = new BubbleShooter();
game.init();
game.start_loop();