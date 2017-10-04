//---------------------------------------------- Bubble Shooter

class BubbleShooter extends Game {
    constructor() {
        super(60);
        this.bubbles = null;
        this.shooter = null;
    }

    init() {
        super.init();
        this.bubbles = new Array();
        //Test Code
        this.bubbles.push(new Bubble(100, 100, 30, 255, 0, 0, 255));
        this.shooter = new Shooter(0, 0, 100);
    }

    update() {
        if (this.bubbles)
            for (var i = 0; i < this.bubbles.length; i++)
                this.bubbles[i].update();
        if (this.shooter)
            this.shooter.update();
    }

    draw() {
        this.canvas.width = this.canvas.width;
        if (this.bubbles)
            for (var i = 0; i < this.bubbles.length; i++)
                this.bubbles[i].draw();
        if (this.shooter)
            this.shooter.draw();
    }
}

//---------------------------------------------- Bubble Sprite

const bubble_radius = 25;
const bubble_speed = 50;
const sqrt_of_3 = Math.sqrt(3);
const upper_left_bubble_coord = new Coordinate(bubble_radius, bubble_radius);
const max_col_0 = Math.floor(canvas.width / (2 * radius));
const max_col_1 = Math.floor((canvas.width - bubble_radius) / (2 * radius));
const max_row = Math.floor(canvas.height / (sqrt_of_3 * radius));
class Bubble extends Sprite {
    constructor(x, y, radius, r, g, b, a) {//Center coord, radius. color
        super(x - radius, y - radius, 2 * radius, 2 * radius);
        this.coord.x += radius;
        this.coord.y += radius;
        this.radius = radius;
        this.root_bounding_volume = new CircleBoundingVolume(0, 0, radius);
        this.root_bounding_volume.GObj = this;
        this.color = null;
        this.assign_color(r, g, b, a);
        this.row = null;
        this.col = null;
    }

    distance_to(bubble) {
        if (!bubble instanceof Bubble)
            throw "Non-Bubble parameter error";
        var delta = bubble.coord.subtract(this.coord);
        var distance = Math.sqrt(delta.dot(delta)) - this.radius - bubble.radius;
    }

    fix_location(rc) {
        this.coord = Bubble.row_and_col_to_coord(rc);
        this.row = rc.row;
        this.col = rc.col;
        this.movable = false;
        this.moveVect = null;
    }

    static row_and_col(coord) {
        var row = Math.floor((coord.y - upper_left_bubble_coord.y) / (sqrt_of_3 * bubble_radius));
        var col;
        if (row % 2 == 0) {
            col = Math.ceil((coord.x - upper_left_bubble_coord.x) / (2 * bubble_radius));
            col = col < 0 ? 0 : (col > max_col_0 ? max_col_0 : col);
        }
        else {
            col = Math.ceil((coord.x - bubble_radius - upper_left_bubble_coord.x) / (2 * bubble_radius));
            col = col < 0 ? 0 : (col > max_col_1 ? max_col_0 : col);
        }
        row = row < 0 ? 0 : (row > max_row ? max_row : row);
        return { 'row': row, 'col': col };
    }

    static row_and_col_to_coord(rc) {
        if (rc.row % 2 == 0)
            return upper_left_bubble_coord.add(new Coordinate(rc.col * 2 * bubble_radius, rc.row * sqrt_of_3 * bubble_radius));
        else
            return upper_left_bubble_coord.add(new Coordinate((rc.col * 2 + 1) * bubble_radius, rc.row * sqrt_of_3 * bubble_radius));
    }

    static allowed_coord(coord) {
        return this.row_and_col_to_coord(this.row_and_col(coord));
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
        super.update();
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

//---------------------------------------------- Shooter

const shooter_base_color = { 'r': 191, 'g': 191, 'b': 191, 'a': 255 };
class ShooterBase extends Sprite {
    constructor(w, h) {
        super(0, 0, w, h);
        this.movable = false;
        this.root_bounding_volume = null;
    }

    actual_draw() {
        context.beginPath();
        context.fillStyle = "rgba(" + shooter_base_color.r + "," + shooter_base_color.g + "," + shooter_base_color.b + "," + shooter_base_color.a + ")";
        context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
    }
}

const shooter_barrel_color = shooter_base_color;
const min_angle = -45;
const max_angle = 45;
class ShooterBarrel extends Sprite {
    constructor(w, h) {
        super(0, 0, w, h);
        this.movable = false;
        this.root_bounding_volume = null;
        this.angle = 0;
    }

    update() {
        super.update();
        this.angle = this.angle < min_angle ? min_angle : (this.angle > max_angle ? max_angle : this.angle);
    }

    actual_draw() {
        context.beginPath();
        context.fillStyle = "rgba(" + shooter_base_color.r + "," + shooter_base_color.g + "," + shooter_base_color.b + "," + shooter_base_color.a + ")";
        context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
    }
}

class Shooter extends SceneGraph {
    constructor(x, y, w) {//Upper left corner of base, width of base
        super(x, y, w, w);
        this.movable = false;
        this.root.assign_name("shooter");
        var base = new SceneGraphNode();
        base.attach_content(new ShooterBase(w, 0.618 * w));
        base.assign_name("base");
        this.root.attach_child(base);
        var barrel = new SceneGraphNode();
        barrel.attach_content(new ShooterBarrel(0.618 * w, w));
        barrel.assign_name("barrel");
        this.root.attach_child(barrel);
    }

    shoot() {
        //Ganerate a moving bubble from barrel end
    }

    actual_draw() {
        var base = this.get_node_by_name("base").content;
        var barrel = this.get_node_by_name("barrel").content;
        //Base
        context.save();
        context.translate(this.coord.x, this.coord.y);
        base.actual_draw();
        context.restore();
        //Barrel
        context.save();
        context.translate(this.coord.x + Math.round((this.w - barrel.w) / 2), this.coord.y - barrel.h + Math.round(base.h / 2));
        context.translate(Math.round(barrel.w / 2), barrel.h);
        context.rotate(barrel.angle < 0 ? -1 : barrel.angle / 180 * Math.PI);
        context.translate(-Math.round(barrel.w / 2), -barrel.h);
        barrel.actual_draw();
        context.restore();
    }
}

//---------------------------------------------- Run

var game = new BubbleShooter();
game.init();
game.start_loop();