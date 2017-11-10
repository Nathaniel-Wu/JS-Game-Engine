//---------------------------------------------- Bubble Shooter

const shooter_width = 100;
const bubble_colors = [
    { 'r': 255, 'g': 0, 'b': 0 },
    { 'r': 0, 'g': 255, 'b': 0 },
    { 'r': 0, 'g': 0, 'b': 255 },
    { 'r': 255, 'g': 255, 'b': 0 },
    { 'r': 0, 'g': 255, 'b': 255 },
    { 'r': 255, 'g': 0, 'b': 255 }
];
const interval_between_bubble_generation = 20;
var bubble_pool;
class BubbleShooter extends Game {
    constructor() {
        super(60);
        this.fixed_bubbles = null;
        this.moving_bubbles = null;
        this.shooter = null;
        this.current_max_row = null;
        this.max_allowed_row = null;
        this.previous_loop = null;
        this.score = 0;
    }

    load() {
        if (!bubble_pool)
            bubble_pool = new BubbleManager();
        bubble_pool.init();
        max_col_0 = Math.floor(canvas.width / (2 * bubble_radius));
        max_col_1 = Math.floor((canvas.width - bubble_radius) / (2 * bubble_radius));
        max_row = Math.floor(canvas.height / (sqrt_of_3 * bubble_radius));
        this.current_max_row = 0;
        this.max_allowed_row = Math.round(this.canvas.height * 0.8 / (2 * bubble_radius));
        this.fixed_bubbles = new Array();
        this.moving_bubbles = new Array();
        this.shooter = new Shooter(Math.round((this.canvas.width - shooter_width) / 2), 0, shooter_width);
        this.shooter.coord.y = this.canvas.height - this.shooter.get_node_by_name("base").content.h;
        for (var i = 0; i < 3; i++)
            this.generate_row_of_fixed_bubbles(i);
        this.previous_loop = 0;
        this.ui_stack.push(new ScoreBoard(this, 0, canvas.height - 62, 100, 62));
    }

    deload() {
        super.deload();
        // for (var i = this.fixed_bubbles.length - 1; i >= 0; i--)
        //     this.fixed_bubbles.splice(i, 1)[0].destroy();
        // this.fixed_bubbles = null;
        // for (var i = this.moving_bubbles.length - 1; i >= 0; i--)
        //     this.moving_bubbles.splice(i, 1)[0].destroy();
        // this.moving_bubbles = null;
        this.fixed_bubbles = null;
        this.moving_bubbles = null;
        bubble_pool.destroy();
        this.shooter.destroy();
        this.shooter = null;
        this.current_max_row = null;
        this.max_allowed_row = null;
        this.previous_loop = null;
        this.score = 0;
    }

    update() {
        super.update();
        if (this.fixed_bubbles)
            for (var i = 0; i < this.fixed_bubbles.length; i++)
                this.fixed_bubbles[i].update();
        if (this.moving_bubbles)
            for (var i = 0; i < this.moving_bubbles.length; i++)
                this.moving_bubbles[i].update();
        bubble_pool.update();
        if (this.shooter)
            this.shooter.update();
        if (this.previous_loop > this.framerate * interval_between_bubble_generation) {
            this.move_fixed_bubbles_down();
            this.generate_row_of_fixed_bubbles(0);
            this.previous_loop = 0;
        }
        this.ui_stack.update();
    }

    draw() {
        super.draw();
        //Frame
        context.beginPath();
        context.strokeStyle = "grey";
        context.lineWidth = 1;
        context.rect(0, 0, this.canvas.width, this.canvas.height);
        context.stroke();
        //Line
        context.beginPath();
        context.strokeStyle = "grey";
        context.lineWidth = 1;
        context.moveTo(0, this.max_allowed_row * 2 * bubble_radius);
        context.lineTo(this.canvas.width, this.max_allowed_row * 2 * bubble_radius);
        context.stroke();
        //Shooter
        if (this.shooter)
            this.shooter.draw();
        //Bubbles
        if (this.fixed_bubbles)
            for (var i = 0; i < this.fixed_bubbles.length; i++)
                this.fixed_bubbles[i].draw();
        if (this.moving_bubbles)
            for (var i = 0; i < this.moving_bubbles.length; i++)
                this.moving_bubbles[i].draw();
        this.ui_stack.draw();
    }

    loop() {
        super.loop();
        this.previous_loop++;
        if (this.current_max_row > this.max_allowed_row + 1) {
            this.restart_flag = true;
            alert("Game Over!");
        } else
            this.current_max_row = 0;
    }

    add_more_bubble() {
        this.move_fixed_bubbles_down();
        this.generate_row_of_fixed_bubbles(0);
    }

    move_fixed_bubbles_down() {/*
        var no_move = new Array();
        for (var i = 0; i < this.fixed_bubbles.length; i++) {
            if (this.fixed_bubbles[i].row == 0)
                continue;
            var higher_rcs;
            if ((upper_left_bubble_coord.x == bubble_radius && this.fixed_bubbles[i].row % 2 == 0) || (upper_left_bubble_coord.x != bubble_radius && this.fixed_bubbles[i].row % 2 != 0))
                higher_rcs = [{ 'row': this.fixed_bubbles[i].row - 1, 'col': this.fixed_bubbles[i].col - 1 }, { 'row': this.fixed_bubbles[i].row - 1, 'col': this.fixed_bubbles[i].col }];
            else
                higher_rcs = [{ 'row': this.fixed_bubbles[i].row - 1, 'col': this.fixed_bubbles[i].col }, { 'row': this.fixed_bubbles[i].row - 1, 'col': this.fixed_bubbles[i].col + 1 }];
            var move = false;
            for (var j = 0; j < higher_rcs.length; j++) {
                var res = game.fixed_bubble_at(higher_rcs[j]);
                if (res != null) {
                    move = true;
                    for (var k = 0; k < no_move.length; k++)
                        if (no_move[k] == res) {
                            move = false;
                            break;
                        }
                    break;
                }
            }
            if (!move)
                no_move.push(i);
        }*/
        upper_left_bubble_coord.x = upper_left_bubble_coord.x == bubble_radius ? 2 * bubble_radius : bubble_radius;
        for (var i = 0; i < this.fixed_bubbles.length; i++) {/*
            var skip = false;
            for (var j = 0; j < no_move.length; j++)
                if (i == no_move[j]) {
                    skip = true;
                    break;
                }
            if (skip)
                continue;*/
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
            // var bubble = new Bubble(coord.x, coord.y, bubble_radius, color.r, color.g, color.b, 255);
            var bubble = bubble_pool.utilize_bubble(coord.x, coord.y, 0, 0, color.r, color.g, color.b, 255);
            bubble.fix_location(rc);
            this.fixed_bubbles.push(bubble);
        }
    }

    stop_keeping_fixed_bubble(bubble) {
        for (var i = 0; i < this.fixed_bubbles.length; i++)
            if (this.fixed_bubbles[i] === bubble)
                return this.fixed_bubbles.splice(i, 1)[0];
        return null;
    }

    stop_keeping_moving_bubble(bubble) {
        for (var i = 0; i < this.moving_bubbles.length; i++)
            if (this.moving_bubbles[i] === bubble)
                return this.moving_bubbles.splice(i, 1)[0];
        return null;
    }

    fixed_bubble_at(rc) {
        for (var i = 0; i < this.fixed_bubbles.length; i++)
            if (this.fixed_bubbles[i].row == rc.row && this.fixed_bubbles[i].col == rc.col)
                return i;
        return null;
    }
}

//---------------------------------------------- UI

class ScoreBoard extends UI {
    constructor(game, x, y, w, h) {
        if (!game instanceof BubbleShooter)
            throw "Non-BubbleShooter parameter error";
        super(game, 1.0, false);
        this.score = this.game.score;
        this.coord = new Coordinate(x, y);
        this.w = w;
        this.h = h;
        this.text = new Text_specs("Score: " + this.score, 30, "Helvetica");
    }

    update() {
        if (this.score != this.game.score) {
            this.score = this.game.score;
            this.text = new Text_specs("Score: " + this.score, 30, "Helvetica");
        }
    }

    actual_draw() {
        context.font = this.text.font;
        context.fillStyle = 'black';
        context.fillText(this.text.text, this.coord.x, this.coord.y + Math.round(this.h - (this.h - this.text.size) / 2), this.w);
        context.beginPath();
    }
}

//---------------------------------------------- Bubble Sprite

const bubble_radius = 25;
const bubble_speed = 3;
const min_distance = bubble_speed / bubble_radius;
const sqrt_of_3 = Math.sqrt(3);
var max_col_0;
var max_col_1;
var max_row;
var upper_left_bubble_coord = new Coordinate(bubble_radius, bubble_radius);
class Bubble extends Particle {
    constructor(x, y, radius, r, g, b, a) {//Center coord, radius. color
        super(x - radius, y - radius, 2 * radius, 2 * radius, bubble_pool);
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

    recyclable() {
        if (0 > this.coord.x + this.radius || this.coord.x - this.radius > canvas.width || 0 > this.coord.y + this.radius || this.coord.y - this.radius > canvas.height)
            return true;
        return false;
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

    remove(force) {
        var surrounding_rcs;
        if ((upper_left_bubble_coord.x == bubble_radius && this.row % 2 == 0) || (upper_left_bubble_coord.x != bubble_radius && this.row % 2 != 0))
            surrounding_rcs = [{ 'row': this.row - 1, 'col': this.col - 1 }, { 'row': this.row - 1, 'col': this.col }, { 'row': this.row, 'col': this.col - 1 }, { 'row': this.row, 'col': this.col + 1 }, { 'row': this.row + 1, 'col': this.col - 1 }, { 'row': this.row + 1, 'col': this.col }];
        else
            surrounding_rcs = [{ 'row': this.row - 1, 'col': this.col }, { 'row': this.row - 1, 'col': this.col + 1 }, { 'row': this.row, 'col': this.col - 1 }, { 'row': this.row, 'col': this.col + 1 }, { 'row': this.row + 1, 'col': this.col }, { 'row': this.row + 1, 'col': this.col + 1 }];
        var same_color_surrounding_bubbles = new Array();
        for (var i = 0; i < game.fixed_bubbles.length; i++)
            for (var j = 0; j < surrounding_rcs.length; j++)
                if (game.fixed_bubbles[i].row == surrounding_rcs[j].row && game.fixed_bubbles[i].col == surrounding_rcs[j].col)
                    if (Utilities.string_compare(this.color, game.fixed_bubbles[i].color))
                        same_color_surrounding_bubbles.push(game.fixed_bubbles[i]);
        if (force && game.stop_keeping_fixed_bubble(this)) {
            // this.destroy();
            this.recycle = true;
            game.score++;
        }
        if (same_color_surrounding_bubbles.length > 0) {
            if (!force)
                // game.stop_keeping_fixed_bubble(this).destroy();
                game.stop_keeping_fixed_bubble(this).recycle = true;
            for (var i = 0; i < same_color_surrounding_bubbles.length; i++)
                same_color_surrounding_bubbles[i].remove(true);
        }
    }

    update() {
        if (this.movable && this.direction) {
            this.moveVect = this.direction.scale(bubble_speed / Math.sqrt(this.direction.dot(this.direction)));
            //Touching any bubble?
            var fixed = false;
            var prediction = this.move_prediction();
            for (var i = 0; i < game.fixed_bubbles.length; i++) {
                var distance = prediction.distance_to(game.fixed_bubbles[i]);
                if (distance < min_distance) {
                    var target_rc = Bubble.row_and_col(this.coord);
                    while (game.fixed_bubble_at(target_rc) != null)
                        target_rc.row++;
                    this.fix_location(target_rc);
                    game.fixed_bubbles.push(game.stop_keeping_moving_bubble(this));
                    this.remove(false);
                    fixed = true;
                    break;
                }
            }
            if (!fixed) {
                //Reaching either side or ceiling?
                var left = false, right = false, ceil = false;
                if (prediction.coord.x < bubble_radius)
                    left = true;
                else if (prediction.coord.x > canvas.width - bubble_radius)
                    right = true;
                if (prediction.coord.y < bubble_radius)
                    ceil = true;
                if (ceil) {
                    this.fix_location(Bubble.row_and_col(prediction.coord));
                    game.fixed_bubbles.push(game.stop_keeping_moving_bubble(this));
                } else if (right || left)
                    this.direction.x = -this.direction.x;
            }
            CollidableGObject.rm_CollidableGObject_instance_ref(prediction.CollidableGObject_id);
        } else if (this.row > game.current_max_row)
            game.current_max_row = this.row;
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

//---------------------------------------------- Bubble Manager

class BubbleManager extends ParticleManager {
    constructor() {
        super(1000, 2 * bubble_radius, 2 * bubble_radius);
    }

    init() {
        for (var i = 0; i < this.total; i++) {
            var b = new Bubble(0, 0, bubble_radius, 0, 0, 0, 0);
            b.visble = false;
            b.collidable = false;
            b.recycle = true;
            this.passive_particles.push(b);
        }
    }

    utilize_bubble(x, y, v_x, v_y, r, g, b, a) {
        if (this.passive_particles.length == 0)
            throw "Particle pool dry out error";
        var bubble = this.passive_particles.splice(0, 1)[0];
        bubble.assign_properties(x, y, v_x, v_y);
        bubble.assign_color(r, g, b, a);
        this.active_particles.push(bubble);
        return bubble;
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

class SceneGraphNode_ extends SceneGraphNode {
    destroy() {
        if (this.content && (!this.content instanceof Bubble)) {
            this.content.destroy();
            this.content = null;
        }
        if (this.children) {
            for (var i = this.children.length - 1; i >= 0; i--) {
                var c = this.children.splice(i, 1)[0];
                c.destroy();
            }
            this.children = null;
        }
        super.destroy();
    }
}

class Shooter extends SceneGraph {
    constructor(x, y, w) {//Upper left corner of base, width of base
        super();
        this.root.destroy();
        this.root = new SceneGraphNode_();
        this.coord = new Coordinate(x, y);
        this.w = w;
        this.movable = false;
        this.root.assign_name("shooter");
        var base = new SceneGraphNode_();
        base.attach_content(new ShooterBase(w, Math.round(0.618 * w)));
        base.assign_name("base");
        this.root.attach_child(base);
        var barrel = new SceneGraphNode_();
        barrel.attach_content(new ShooterBarrel(Math.round(0.382 * w), Math.round(1.1 * w)));
        barrel.assign_name("barrel");
        this.root.attach_child(barrel);
        var bubble = new SceneGraphNode_();
        var color = bubble_colors[Utilities.getRandomInt(0, bubble_colors.length)];
        // bubble.attach_content(new Bubble(0, 0, bubble_radius, color.r, color.g, color.b, 255));
        bubble.attach_content(bubble_pool.utilize_bubble(0, 0, 0, 0, color.r, color.g, color.b, 255));
        bubble.assign_name("bubble");
        this.root.attach_child(bubble);
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
        var bubble = this.get_node_by_name("bubble").content;
        var direction = new Vector(barrel.h * Math.sin(barrel.angle / 180 * Math.PI), -barrel.h * Math.cos(barrel.angle / 180 * Math.PI));
        var coord = new Coordinate(this.coord.x + Math.round(base.w / 2), this.coord.y + Math.round(base.h / 2));
        coord.x = Math.round(coord.x + direction.x);
        coord.y = Math.round(coord.y + direction.y);
        var color = bubble_colors[Utilities.getRandomInt(0, bubble_colors.length)];
        // this.get_node_by_name("bubble").content = new Bubble(0, 0, bubble_radius, color.r, color.g, color.b, 255);
        this.get_node_by_name("bubble").content = bubble_pool.utilize_bubble(0, 0, 0, 0, color.r, color.g, color.b, 255);
        bubble.coord = coord;
        bubble.direction = direction;
        game.moving_bubbles.push(bubble);
        this.last_shoot = 0;
    }

    update() {
        super.update();
        if (this.last_shoot != -1) {
            this.last_shoot++;
            if (this.last_shoot >= 2 * bubble_radius / bubble_speed)
                this.last_shoot = -1;
        }
    }

    actual_draw() {
        var base = this.get_node_by_name("base").content;
        var barrel = this.get_node_by_name("barrel").content;
        var bubble = this.get_node_by_name("bubble").content;
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
        //Aim
        var direction = new Vector(barrel.h * Math.sin(barrel.angle / 180 * Math.PI), -barrel.h * Math.cos(barrel.angle / 180 * Math.PI));
        var coord = new Coordinate(this.coord.x + Math.round(base.w / 2), this.coord.y + Math.round(base.h / 2));
        coord.x = Math.round(coord.x + direction.x);
        coord.y = Math.round(coord.y + direction.y);
        if (barrel.angle > 0) {
            var y = coord.y - (canvas.width - bubble_radius - coord.x) / Math.tan(barrel.angle / 180 * Math.PI);
            var x = canvas.width - bubble_radius - y * Math.tan(barrel.angle / 180 * Math.PI);
            context.beginPath();
            context.strokeStyle = "grey";
            context.lineWidth = 1;
            context.moveTo(coord.x, coord.y);
            context.lineTo(canvas.width - bubble_radius, y);
            context.lineTo(x, 0);
            context.stroke();
        } else if (barrel.angle < 0) {
            var y = coord.y - (coord.x - bubble_radius) / Math.tan(-barrel.angle / 180 * Math.PI);
            var x = bubble_radius + y * Math.tan(-barrel.angle / 180 * Math.PI);
            context.beginPath();
            context.strokeStyle = "grey";
            context.lineWidth = 1;
            context.moveTo(coord.x, coord.y);
            context.lineTo(bubble_radius, y);
            context.lineTo(x, 0);
            context.stroke();
        } else {
            context.beginPath();
            context.strokeStyle = "grey";
            context.lineWidth = 1;
            context.moveTo(coord.x, coord.y);
            context.lineTo(coord.x, 0);
            context.stroke();
        }
        //Bubble
        context.save();
        context.translate(this.coord.x + base.w / 2, this.coord.y + base.h / 2);
        bubble.actual_draw();
        context.restore();
    }
}

//---------------------------------------------- Run

var game = new BubbleShooter();
game.start();