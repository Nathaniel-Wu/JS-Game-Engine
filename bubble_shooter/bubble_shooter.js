//---------------------------------------------- Bubble Shooter

const shooter_width = 100;
const bubble_colors = [
    { 'r': 255, 'g': 0, 'b': 0 },
    { 'r': 0, 'g': 255, 'b': 0 },
    { 'r': 0, 'g': 0, 'b': 255 }
];
class BubbleShooter extends Game {
    constructor() {
        super(60);
        this.fixed_bubbles = null;
        this.moving_bubbles = null;
        this.shooter = null;
    }

    init() {
        super.init();
        max_col_0 = Math.floor(canvas.width / (2 * bubble_radius));
        max_col_1 = Math.floor((canvas.width - bubble_radius) / (2 * bubble_radius));
        max_row = Math.floor(canvas.height / (sqrt_of_3 * bubble_radius));
        this.fixed_bubbles = new Array();
        this.moving_bubbles = new Array();
        this.shooter = new Shooter(Math.round((this.canvas.width - shooter_width) / 2), 0, shooter_width);
        this.shooter.coord.y = this.canvas.height - this.shooter.get_node_by_name("base").content.h;
        for (var i = 0; i < 3; i++)
            this.generate_row_of_fixed_bubbles(i);
    }

    update() {
        if (this.fixed_bubbles)
            for (var i = 0; i < this.fixed_bubbles.length; i++)
                this.fixed_bubbles[i].update();
        if (this.moving_bubbles)
            for (var i = 0; i < this.moving_bubbles.length; i++)
                this.moving_bubbles[i].update();
        if (this.shooter)
            this.shooter.update();
    }

    draw() {
        this.canvas.width = this.canvas.width;
        if (this.fixed_bubbles)
            for (var i = 0; i < this.fixed_bubbles.length; i++)
                this.fixed_bubbles[i].draw();
        if (this.moving_bubbles)
            for (var i = 0; i < this.moving_bubbles.length; i++)
                this.moving_bubbles[i].draw();
        if (this.shooter)
            this.shooter.draw();
        context.beginPath();
        context.strokeStyle = "grey";
        context.lineWidth = 1;
        context.rect(0, 0, canvas.width, canvas.height);
        context.stroke();
    }

    add_more_bubble() {
        this.move_fixed_bubbles_down();
        this.generate_row_of_fixed_bubbles(0);
    }

    move_fixed_bubbles_down() {
        upper_left_bubble_coord.x = upper_left_bubble_coord.x == bubble_radius ? 2 * bubble_radius : bubble_radius;
        for (var i = 0; i < this.fixed_bubbles.length; i++) {
            this.fixed_bubbles[i].row++;
            this.fixed_bubbles[i].coord = Bubble.row_and_col_to_coord({ 'row': this.fixed_bubbles[i].row, 'col': this.fixed_bubbles[i].col });
        }
    }

    generate_row_of_fixed_bubbles(row) {
        var max_col = ((upper_left_bubble_coord.x == bubble_radius && row % 2 == 0) || (upper_left_bubble_coord.x != bubble_radius && row % 2 != 0)) ? max_col_0 : max_col_1;
        for (var i = 0; i < max_col; i++) {
            var rc = { 'row': row, 'col': i };
            var coord = Bubble.row_and_col_to_coord(rc);
            var color = bubble_colors[Utilities.getRandomInt(0, bubble_colors.length)];
            var bubble = new Bubble(coord.x, coord.y, bubble_radius, color.r, color.g, color.b, 255);
            bubble.fix_location(rc);
            this.fixed_bubbles.push(bubble);
        }
    }
}

//---------------------------------------------- Bubble Sprite

const bubble_radius = 25;
const bubble_speed = 1;
const min_distance = bubble_speed / bubble_radius;
const sqrt_of_3 = Math.sqrt(3);
var max_col_0 = Math.floor(canvas.width / (2 * bubble_radius));
var max_col_1 = Math.floor((canvas.width - bubble_radius) / (2 * bubble_radius));
var max_row = Math.floor(canvas.height / (sqrt_of_3 * bubble_radius));
var upper_left_bubble_coord = new Coordinate(bubble_radius, bubble_radius);
class Bubble extends Sprite {
    constructor(x, y, radius, r, g, b, a) {//Center coord, radius. color
        super(x - radius, y - radius, 2 * radius, 2 * radius);
        this.coord.x += radius;
        this.coord.y += radius;
        this.radius = radius;
        this.root_bounding_volume = new CircleBoundingVolume(0, 0, radius);
        this.root_bounding_volume.GObj = this;
        this.color = null;
        this.direction = null;
        this.assign_color(r, g, b, a);
        this.row = null;
        this.col = null;
    }

    distance_to(bubble) {
        if (!bubble instanceof Bubble)
            throw "Non-Bubble parameter error";
        var delta = bubble.coord.subtract(this.coord);
        return Math.sqrt(delta.dot(delta)) - this.radius - bubble.radius;
    }

    fix_location(rc) {
        this.coord = Bubble.row_and_col_to_coord(rc);
        this.row = rc.row;
        this.col = rc.col;
        this.movable = false;
        this.moveVect = null;
        this.direction = null;
    }

    static row_and_col(coord) {
        var row = Math.floor((coord.y - upper_left_bubble_coord.y) / (sqrt_of_3 * bubble_radius));
        var col;
        if ((upper_left_bubble_coord.x == bubble_radius && row % 2 == 0) || (upper_left_bubble_coord.x != bubble_radius && row % 2 != 0)) {
            col = Math.round((coord.x - upper_left_bubble_coord.x) / (2 * bubble_radius));
            col = col < 0 ? 0 : (col > max_col_0 ? max_col_0 : col);
        } else {
            col = Math.round((coord.x - bubble_radius - upper_left_bubble_coord.x) / (2 * bubble_radius));
            col = col < 0 ? 0 : (col > max_col_1 ? max_col_0 : col);
        }
        row = row < 0 ? 0 : (row > max_row ? max_row : row);
        return { 'row': row, 'col': col };
    }

    static row_and_col_to_coord(rc) {
        if ((upper_left_bubble_coord.x == bubble_radius && rc.row % 2 == 0) || (upper_left_bubble_coord.x != bubble_radius && rc.row % 2 != 0))
            return new Coordinate((rc.col * 2 + 1) * bubble_radius, (rc.row * sqrt_of_3 + 1) * bubble_radius);
        else
            return new Coordinate((rc.col * 2 + 2) * bubble_radius, (rc.row * sqrt_of_3 + 1) * bubble_radius);
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
            return new Bubble(Math.round(this.coord.x + this.moveVect.x), Math.round(this.coord.y + this.moveVect.y), this.radius, 0, 0, 0, 0);
        return new Bubble(this.coord.x, this.coord.y, this.radius, 0, 0, 0, 0);
    }

    update() {
        if (this.movable && this.direction) {
            this.moveVect = this.direction.scale(bubble_speed / Math.sqrt(this.direction.dot(this.direction)));
            var prediction = this.move_prediction();
            for (var i = 0; i < game.fixed_bubbles.length; i++) {
                var distance = prediction.distance_to(game.fixed_bubbles[i]);
                if (distance < min_distance) {
                    this.fix_location(Bubble.row_and_col(this.coord));
                    var index;
                    for (var j = 0; j < game.moving_bubbles.length; j++)
                        if (game.moving_bubbles[j] === this) {
                            index = j;
                            return;
                        }
                    game.fixed_bubbles(game.moving_bubbles.splice(index, 1)[0]);
                    break;
                }
            }
            CollidableGObject.rm_CollidableGObject_instance_ref(prediction.CollidableGObject_id);
        }
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

const shooter_barrel_color = { 'r': 63, 'g': 63, 'b': 63, 'a': 255 };
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
        context.fillStyle = "rgba(" + shooter_barrel_color.r + "," + shooter_barrel_color.g + "," + shooter_barrel_color.b + "," + shooter_barrel_color.a + ")";
        context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
    }
}

class Shooter extends SceneGraph {
    constructor(x, y, w) {//Upper left corner of base, width of base
        super();
        this.coord = new Coordinate(x, y);
        this.w = w;
        this.movable = false;
        this.root.assign_name("shooter");
        var base = new SceneGraphNode();
        base.attach_content(new ShooterBase(w, Math.round(0.618 * w)));
        base.assign_name("base");
        this.root.attach_child(base);
        var barrel = new SceneGraphNode();
        barrel.attach_content(new ShooterBarrel(Math.round(0.382 * w), Math.round(1.1 * w)));
        barrel.assign_name("barrel");
        this.root.attach_child(barrel);
        this.si = game.input_event_subscription_manager.add_subscriber(this);
        this.last_shoot = -1;
    }

    handle_input_event(event) {
        game.input_event_subscription_manager.set_exclusive(this.si, event.type);
        var barrel = this.get_node_by_name("barrel").content;
        switch (event.type) {
            case IEType.LEFT: {
                barrel.angle--;
                break;
            }
            case IEType.RIGHT: {
                barrel.angle++;
                break;
            }
            case IEType.SPACE: {
                this.shoot();
                break;
            }
        }
        game.input_event_subscription_manager.release_exclusive(this.si, event.type);
    }

    shoot() {
        if (this.last_shoot != -1)
            return;
        var base = this.get_node_by_name("base").content;
        var barrel = this.get_node_by_name("barrel").content;
        var direction = new Vector(barrel.h * Math.sin(barrel.angle / 180 * Math.PI), -barrel.h * Math.cos(barrel.angle / 180 * Math.PI));
        var coord = new Coordinate(this.coord.x + Math.round(base.w / 2), this.coord.y + Math.round(base.h / 2));
        coord.x = Math.round(coord.x + direction.x);
        coord.y = Math.round(coord.y + direction.y);
        var color = bubble_colors[Utilities.getRandomInt(0, bubble_colors.length)];
        var bubble = new Bubble(coord.x, coord.y, bubble_radius, color.r, color.g, color.b, 255);
        bubble.direction = direction;
        game.moving_bubbles.push(bubble);
        this.last_shoot = 0;
    }

    update() {
        super.update();
        if (this.last_shoot != -1) {
            this.last_shoot++;
            if (this.last_shoot == 2 * bubble_radius / bubble_speed)
                this.last_shoot = -1;
        }
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
        context.rotate(barrel.angle / 180 * Math.PI);
        context.translate(-Math.round(barrel.w / 2), -barrel.h);
        barrel.actual_draw();
        context.restore();
    }
}

//---------------------------------------------- Run

var game = new BubbleShooter();
game.init();
game.start_loop();