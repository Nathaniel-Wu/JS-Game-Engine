var game;
class CaR extends Game {
    constructor(framerate, refresh_rate) {
        super(framerate);
        this.refresh_rate = refresh_rate;
        this.refresh_interval = Math.round(1000 / this.refresh_rate / this.inter_frame);
        this.update_count = 0;
        this.grid = null;
        this.obstacles = null;
        this.cops = null;
        this.robbers = null;
        this.set_cop_targets = true;
        this.cop_target_robbers = null;
        this.restart_flag_delay_set = false;
        this.start_time = null;
        this.first_dir = null;
        this.second_dir = null;
        this.level_index = 0;
        this.turn_limit = 20;
        this.turn_count = 0;
        this.game_mode = null;
        this.real_time = true;
    }

    init() {
        super.init();
        this.ui_stack.push(new Role_Select());
    }

    load() {
        this.obstacles = new Array();
        this.cops = new Array();
        this.robbers = new Array();
        this.load_level(this.level_index % this.level_load_functions.length);
        this.si = this.input_event_subscription_manager.add_subscriber(this);
        this.set_cop_targets = true;
        this.cop_target_robbers = null;
        this.restart_flag_delay_set = false;
        this.start_time = new Date().getTime();
        this.first_dir = null;
        this.second_dir = null;
        this.turn_count = 0;
    }

    deload() {
        super.deload();
        this.grid.destroy; this.grid = null;
        Obstacle_Sprite.destroy_all(); this.obstacles = null;
        Cop_Sprite.destroy_all(); this.cops = null;
        Robber_Sprite.destroy_all(); this.robbers = null;
        this.input_event_subscription_manager.remove_subscriber(this.si); this.si = null;
    }

    handle_input_event(event) {
        this.input_event_subscription_manager.set_exclusive(this.si, event.type);
        var dir = null;
        switch (event.type) {
            case IEType.UP:
                dir = DIR.U;
                break;
            case IEType.DOWN:
                dir = DIR.D;
                break;
            case IEType.LEFT:
                dir = DIR.L;
                break;
            case IEType.RIGHT:
                dir = DIR.R;
                break;
        }
        if (dir != null) {
            if (this.first_dir == null)
                this.first_dir = dir;
            else if (this.second_dir == null && this.first_dir != dir)
                this.second_dir = dir;
            else if (this.first_dir != dir && this.second_dir != dir) {
                this.first_dir = this.second_dir;
                this.second_dir = dir;
            }
        }
        this.input_event_subscription_manager.release_exclusive(this.si, event.type);
    }

    update() {
        super.update();
        if (this.restart_flag_delay_set)
            return;
        if (!game.real_time) {
            if (this.first_dir != null)
                this.update_count = 0;
            else
                this.update_count = 1;
        }
        if (this.update_count == 0) {
            var player_direction = null;
            if (this.first_dir != null || this.second_dir != null) {
                if (this.second_dir != null) {
                    if ((this.first_dir == DIR.U && this.second_dir == DIR.L) || (this.first_dir == DIR.L && this.second_dir == DIR.U))
                        player_direction = DIR.UL;
                    else if ((this.first_dir == DIR.U && this.second_dir == DIR.R) || (this.first_dir == DIR.R && this.second_dir == DIR.U))
                        player_direction = DIR.UR;
                    else if ((this.first_dir == DIR.D && this.second_dir == DIR.L) || (this.first_dir == DIR.L && this.second_dir == DIR.D))
                        player_direction = DIR.DL;
                    else if ((this.first_dir == DIR.D && this.second_dir == DIR.R) || (this.first_dir == DIR.R && this.second_dir == DIR.D))
                        player_direction = DIR.DR;
                    else
                        player_direction = this.second_dir;
                } else if (this.first_dir != null)
                    player_direction = this.first_dir;
                if (this.game_mode == 0)
                    this.robbers[this.robbers.length - 1].player_intended_direction = player_direction;
                else
                    this.cops[this.cops.length - 1].player_intended_direction = player_direction;
            }
            this.first_dir = null;
            this.second_dir = null;
            this.grid.update();
            Obstacle_Sprite.update_all();
            Robber_Sprite.update_all();
            Cop_Sprite.update_all();
            CollidableGObject.CGO_update();
            var uncaught_robbers_count = 0;
            for (var i = 0; i < this.robbers.length; i++)
                if (this.robbers[i].caught) {
                    if (this.robbers[i].movable) {
                        this.robbers[i].movable = false;
                        this.robbers[i].attach_text(new Text_specs("X", this.robbers[i].h * 0.9, "Helvetica"));
                    }
                } else
                    uncaught_robbers_count++;
            if (uncaught_robbers_count == 0) {
                if (!this.restart_flag_delay_set) {
                    this.restart_flag_delay_set = true;
                    if (this.game_mode == 1)
                        this.level_index++;
                    var t = this;
                    setTimeout(function () {
                        t.ui_stack.push(new Cops_Win_Message());
                        setTimeout(function () { t.restart_flag = true }, 2500);
                    }, 500);
                }
            }
            this.turn_count++;
            if (this.turn_count >= this.turn_limit)
                if (!this.restart_flag_delay_set) {
                    this.ui_stack.push(new Robbers_Win_Message());
                    if (this.game_mode == 0)
                        this.level_index++;
                    var t = this; setTimeout(function () { t.restart_flag = true }, 3000); this.restart_flag_delay_set = true;
                }
        }
        if (game.real_time)
            this.update_count = (this.update_count + 1) % this.refresh_interval;
    }

    draw() {
        super.draw();
        this.grid.draw();
        Obstacle_Sprite.draw_all();
        Robber_Sprite.draw_all();
        Cop_Sprite.draw_all();
    }

    ui_loop() {
        if (this.ui_stack.stack[0] instanceof Role_Select) {
            if (this.ui_stack.stack[0].selection_made) {
                this.game_mode = this.ui_stack.stack[0].selection;
                this.ui_stack.pop().destroy();
                this.ui_stack.push(new RealTime_Select());
            }
        } else if (this.ui_stack.stack[0] instanceof RealTime_Select) {
            if (this.ui_stack.stack[0].selection_made) {
                this.real_time = this.ui_stack.stack[0].selection;
                this.ui_stack.deload();
                var t = this;
                var restart_ = function () {
                    t.stop_ui_loop();
                    t.load();
                    t.start_loop();
                    t.start_ui_loop();
                }; restart_();
            }
        }
        super.ui_loop();
    }
}

class Role_Select extends UI {
    constructor() {
        super(game, 1.0, true);
        this.selection_made = false;
        this.selection = null;
        this.input_event_subscription_manager = this.game.input_event_subscription_manager;
        this.si = this.input_event_subscription_manager.add_subscriber(this);
        this.robber = new Colored_Sprite(0, 0, canvas.width, canvas.height / 2, 255, 255, 0, 255);
        this.robber.attach_text(new Text_specs("Play as Robber", 60, "Helvetica"));
        this.cop = new Colored_Sprite(0, canvas.height / 2, canvas.width, canvas.height / 2, 0, 0, 255, 255);
        this.cop.attach_text(new Text_specs("Play as Cop", 60, "Helvetica"));
    }

    update() {
        this.robber.update();
        this.cop.update();
    }

    actual_draw() {
        this.robber.draw();
        this.cop.draw();
    }

    destroy() {
        this.robber.destroy();
        this.cop.destroy();
        this.input_event_subscription_manager.remove_subscriber(this.si);
    }

    handle_input_event(event) {
        this.input_event_subscription_manager.set_exclusive(this.si, event.type);
        switch (event.type) {
            case IEType.SELECT:
                if (0 <= event.coord.x && event.coord.x < canvas.width && 0 <= event.coord.y && event.coord.y <= canvas.height) {
                    if (event.coord.y < canvas.height / 2)
                        this.selection = 0;
                    else
                        this.selection = 1;
                    this.selection_made = true;
                }
                break;
        }
        this.input_event_subscription_manager.release_exclusive(this.si, event.type);
    }
}

class RealTime_Select extends UI {
    constructor() {
        super(game, 1.0, true);
        this.selection_made = false;
        this.selection = null;
        this.input_event_subscription_manager = this.game.input_event_subscription_manager;
        this.si = this.input_event_subscription_manager.add_subscriber(this);
        this.real_time_yes = new Colored_Sprite(0, 0, canvas.width, canvas.height / 2, 255, 255, 0, 255);
        this.real_time_yes.attach_text(new Text_specs("Take Turn Regardless of Player", 60, "Helvetica"));
        this.real_time_no = new Colored_Sprite(0, canvas.height / 2, canvas.width, canvas.height / 2, 255, 0, 0, 255);
        this.real_time_no.attach_text(new Text_specs("Take Turn on Player Movement", 60, "Helvetica"));
    }

    update() {
        this.real_time_yes.update();
        this.real_time_no.update();
    }

    actual_draw() {
        this.real_time_yes.draw();
        this.real_time_no.draw();
    }

    destroy() {
        this.real_time_yes.destroy();
        this.real_time_no.destroy();
        this.input_event_subscription_manager.remove_subscriber(this.si);
    }

    handle_input_event(event) {
        this.input_event_subscription_manager.set_exclusive(this.si, event.type);
        switch (event.type) {
            case IEType.SELECT:
                if (0 <= event.coord.x && event.coord.x < canvas.width && 0 <= event.coord.y && event.coord.y <= canvas.height) {
                    if (event.coord.y < canvas.height / 2)
                        this.selection = true;
                    else
                        this.selection = false;
                    this.selection_made = true;
                }
                break;
        }
        this.input_event_subscription_manager.release_exclusive(this.si, event.type);
    }
}

class Cops_Win_Message extends UI {
    constructor() {
        super(game, 1, true);
        this.message = new Colored_Sprite(0, 0, canvas.width, canvas.height, 0, 0, 255, 255); this.message.collidable = false;
        this.message.attach_text(new Text_specs("Cops Win!", 60, "Helvetica"));
    }

    update() { this.message.update(); }
    actual_draw() { this.message.draw(); }
    destroy() { this.message.destroy(); }
}

class Robbers_Win_Message extends Cops_Win_Message {
    constructor() {
        super();
        this.message.attach_color(0, 255, 255, 255);
        this.message.attach_text(new Text_specs("Robbers Win!", 60, "Helvetica"));
    }
}

class CaR_Grid extends Grid {
    constructor(row, col) {
        super(row, col);
        this.visble = true;
    }

    static get_unavailable_position_bitmap() {
        var unavailable_position_bitmap = new bitmap_2d(game.grid.row, game.grid.col);
        for (var i = 0; i < game.obstacles.length; i++)
            unavailable_position_bitmap.set_2d(game.obstacles[i].row, game.obstacles[i].col, true);
        for (var i = 0; i < game.robbers.length; i++)
            unavailable_position_bitmap.set_2d(game.robbers[i].row, game.robbers[i].col, true);
        for (var i = 0; i < game.cops.length; i++)
            unavailable_position_bitmap.set_2d(game.cops[i].row, game.cops[i].col, true);
        return unavailable_position_bitmap;
    }
}

function position_in_direction(grid_sprite, dir) {
    var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
    var position = null; switch (dir) {
        case DIR.U:
            if (grid_sprite.row > 0 && !unavailable_position_bitmap.get_2d(grid_sprite.row - 1, grid_sprite.col))
                position = { 'row': grid_sprite.row - 1, 'col': grid_sprite.col };
            break;
        case DIR.D:
            if (grid_sprite.row < game.grid.row - 1 && !unavailable_position_bitmap.get_2d(grid_sprite.row + 1, grid_sprite.col))
                position = { 'row': grid_sprite.row + 1, 'col': grid_sprite.col };
            break;
        case DIR.L:
            if (grid_sprite.col > 0 && !unavailable_position_bitmap.get_2d(grid_sprite.row, grid_sprite.col - 1))
                position = { 'row': grid_sprite.row, 'col': grid_sprite.col - 1 };
            break;
        case DIR.R:
            if (grid_sprite.col < game.grid.col - 1 && !unavailable_position_bitmap.get_2d(grid_sprite.row, grid_sprite.col + 1))
                position = { 'row': grid_sprite.row, 'col': grid_sprite.col + 1 };
            break;
        case DIR.UL:
            if (grid_sprite.row > 0 && grid_sprite.col > 0 && !(unavailable_position_bitmap.get_2d(grid_sprite.row - 1, grid_sprite.col) && unavailable_position_bitmap.get_2d(grid_sprite.row, grid_sprite.col - 1)))
                position = { 'row': grid_sprite.row - 1, 'col': grid_sprite.col - 1 };
            break;
        case DIR.UR:
            if (grid_sprite.row > 0 && grid_sprite.col < game.grid.col - 1 && !(unavailable_position_bitmap.get_2d(grid_sprite.row - 1, grid_sprite.col) && unavailable_position_bitmap.get_2d(grid_sprite.row, grid_sprite.col + 1)))
                position = { 'row': grid_sprite.row - 1, 'col': grid_sprite.col + 1 };
            break;
        case DIR.DL:
            if (grid_sprite.row < game.grid.row - 1 && grid_sprite.col > 0 && !(unavailable_position_bitmap.get_2d(grid_sprite.row + 1, grid_sprite.col) && unavailable_position_bitmap.get_2d(grid_sprite.row, grid_sprite.col - 1)))
                position = { 'row': grid_sprite.row + 1, 'col': grid_sprite.col - 1 };
            break;
        case DIR.DR:
            if (grid_sprite.row < game.grid.row - 1 && grid_sprite.col < game.grid.col - 1 && !(unavailable_position_bitmap.get_2d(grid_sprite.row + 1, grid_sprite.col) && unavailable_position_bitmap.get_2d(grid_sprite.row, grid_sprite.col + 1)))
                position = { 'row': grid_sprite.row + 1, 'col': grid_sprite.col + 1 };
            break;
    } return position;
}

class Cop_Sprite extends Flashing_ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, Math.floor(game.framerate * 0.333));
        this.attach_color(0, 0, 0, 255);
        this.attach_color(0, 0, 255, 255);
        this.attach_color(223, 223, 223, 255);
        this.player_intended_direction = null;
    }

    move_prediction() {
        return new Cop_Sprite(this.row, this.col);
    }

    move_in_direction(dir) {
        if (this.movable) {
            var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
            var intended_position = position_in_direction(this, dir);
            if (intended_position)
                if (!unavailable_position_bitmap.get_2d(intended_position.row, intended_position.col))
                    this.move_to(intended_position);
        }
    }

    resolve(collision) {
        super.resolve(collision);
        if (collision.into instanceof Robber_Sprite)
            collision.into.resolve(new Collision(null, this, CPType.PASSIVE));
    }

    static update_all() {
        var cop_positions = new Array(); for (var i = 0; i < game.cops.length; i++) cop_positions.push({ 'row': game.cops[i].row, 'col': game.cops[i].col });
        var robber_positions = new Array(); for (var i = 0; i < game.robbers.length; i++) robber_positions.push({ 'row': game.robbers[i].row, 'col': game.robbers[i].col });
        if (game.set_cop_targets) {
            var uncaught_robber_indices = new Array();
            for (var i = 0; i < game.robbers.length; i++)
                if (!game.robbers[i].caught)
                    uncaught_robber_indices.push(i);
            var available_cop_indices = new Array();
            var cop_idle_bitmap = new bitmap(game.cops.length); cop_idle_bitmap.fill();
            if (game.game_mode != 1)
                for (var i = 0; i < game.cops.length; i++)
                    available_cop_indices.push(i);
            else
                for (var i = 0; i < game.cops.length - 1; i++)
                    available_cop_indices.push(i);
            var cops_per_robber = new Array(uncaught_robber_indices.length); cops_per_robber.fill(0);
            if (available_cop_indices.length >= 2 * uncaught_robber_indices.length) {
                const min_cops_per_robber = Math.floor(available_cop_indices.length / uncaught_robber_indices.length);
                cops_per_robber.fill(min_cops_per_robber);
                var idle_cops_count = available_cop_indices.length - min_cops_per_robber * uncaught_robber_indices.length;
                for (var i = 0; i < idle_cops_count; i++)
                    cops_per_robber[i]++;
            } else
                for (var i = 0; i < available_cop_indices.length; i++) {
                    if ((i + 1) * 2 <= available_cop_indices.length)
                        cops_per_robber[i] = 2;
                    else if (i * 2 + 1 <= available_cop_indices.length)
                        cops_per_robber[i] = 1;
                    else
                        break;
                }
            game.cop_target_robbers = new Array(game.cops.length); game.cop_target_robbers.fill(-1);
            var get_grid_distance = function (position_1, position_2) { return Math.abs(position_2.row - position_1.row) + Math.abs(position_2.col - position_1.col); }
            for (var i = 0; i < cops_per_robber.length; i++) {
                for (var j = 0; j < cops_per_robber[i]; j++) {
                    var min_distance = null, min_distance_cop_index = null;
                    for (var k = 0; k < available_cop_indices.length; k++)
                        if (cop_idle_bitmap.get(available_cop_indices[k])) {
                            var distance = get_grid_distance(robber_positions[i], cop_positions[available_cop_indices[k]]);
                            if ((!min_distance) || distance < min_distance) {
                                min_distance = distance;
                                min_distance_cop_index = available_cop_indices[k];
                            }
                        }
                    if (min_distance_cop_index == null)
                        throw "Unknown Error";
                    game.cop_target_robbers[min_distance_cop_index] = uncaught_robber_indices[i];
                    cop_idle_bitmap.set(min_distance_cop_index, false);
                }
            }
            game.set_cop_targets = false;
        }
        if (game.game_mode == 1) {
            if (game.cops[game.cops.length - 1].player_intended_direction != null) {
                game.cops[game.cops.length - 1].move_in_direction(game.cops[game.cops.length - 1].player_intended_direction);
                game.cops[game.cops.length - 1].player_intended_direction = null;
            }
            game.cops[game.cops.length - 1].update();
        }
        var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
        for (var i = 0; i < game.cops.length; i++) {
            if (i == game.cops.length - 1 && game.game_mode == 1)
                continue;
            var target_position_index = 0;
            var target_position = null;
            var clone_position_object = function (position_) { return { 'row': position_.row, 'col': position_.col }; }
            var compare_two_position_objects = function (position_1, position_2) { return position_1.row == position_2.row && position_1.col == position_2.col }
            var target_position_index_to_real_position = function () {
                target_position = clone_position_object(robber_positions[game.cop_target_robbers[i]]);
                switch (target_position_index) {
                    case 0://UP
                        target_position.row--;
                        break;
                    case 1://RIGHT
                        target_position.col++;
                        break;
                    case 2://DOWN
                        target_position.row++;
                        break;
                    case 3://LEFT
                        target_position.col--;
                        break;
                    case 4://UP-RIGHT
                        target_position.row--;
                        target_position.col++;
                        break;
                    case 5://DOWN-RIGHT
                        target_position.row++;
                        target_position.col++;
                        break;
                    case 6://DOWN-LEFT
                        target_position.row++;
                        target_position.col--;
                        break;
                    case 7://UP-LEFT
                        target_position.row--;
                        target_position.col--;
                        break;
                }
            }
            var no_need_to_move = false;
            while (target_position_index < 4) {
                target_position_index_to_real_position();
                if (compare_two_position_objects(cop_positions[i], target_position)) {
                    no_need_to_move = true;
                    break;
                } target_position_index++;
            }
            if (no_need_to_move) {
                game.cops[i].update();
                continue;
            }
            target_position_index = 0;
            while (target_position_index < 8) {
                target_position_index_to_real_position();
                if (game.grid.validate_index(target_position.row, target_position.col))
                    if (!unavailable_position_bitmap.get_2d(target_position.row, target_position.col))
                        break;
                target_position_index++;
            }
            if (target_position_index >= 8) {
                game.cops[i].update();
                continue;
            }
            unavailable_position_bitmap.set_2d(cop_positions[i].row, cop_positions[i].col, false);
            var steps = game.grid.findPath(cop_positions[i], target_position, unavailable_position_bitmap);
            unavailable_position_bitmap.set_2d(cop_positions[i].row, cop_positions[i].col, true);
            if (steps != null) {
                unavailable_position_bitmap.set_2d(cop_positions[i].row, cop_positions[i].col, false);
                if (steps.length > 0) {
                    unavailable_position_bitmap.set_2d(steps[0].row, steps[0].col, true);
                    game.cops[i].move_to(steps[0]);
                } else {
                    unavailable_position_bitmap.set_2d(target_position.row, target_position.col, true);
                    game.cops[i].move_to(target_position);
                }
            }
            game.cops[i].update();
        }
    }

    static draw_all() {
        for (var i = 0; i < game.cops.length; i++)
            game.cops[i].draw();
    }

    static destroy_all() {
        for (var i = game.cops.length - 1; i >= 0; i--)
            game.cops.splice(i, 1)[0].destroy();
    }

    static create_random_cop(number) {
        for (var i = 0; i < number; i++)
            while (true) {
                var rand = Utilities.getRandomInt(0, game.grid.row * game.grid.col);
                var row = Math.floor(rand / game.grid.col);
                var col = rand - row * game.grid.col;
                var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
                if (!unavailable_position_bitmap.get_2d(row, col)) {
                    unavailable_position_bitmap.flip_2d(row, col);
                    var cop = new Cop_Sprite(row, col);
                    if (game.game_mode == 1 && i == number - 1) {
                        cop.colors = new Array();
                        cop.attach_color(223, 223, 223, 255);
                    };
                    game.cops.push(cop);
                    break;
                }
            }
    }
}

const DIR = { 'U': 0, 'D': 1, 'L': 2, 'R': 3, 'UL': 4, 'UR': 5, 'DL': 6, 'DR': 7 };
class Robber_Sprite extends ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, 0, 255, 255, 255);
        this.hit_by_cop_1 = false;
        this.hit_by_cop_2 = false;
        this.caught = false;
        this.player_intended_direction = null;
    }

    move_prediction() {
        return new Robber_Sprite(this.row, this.col);
    }

    resolve(collision) {
        super.resolve(collision);
        if (collision.into instanceof Cop_Sprite)
            if (this.row == collision.into.row || this.col == collision.into.col) {
                if (!this.hit_by_cop_1)
                    this.hit_by_cop_1 = true;
                else if (!this.hit_by_cop_2)
                    this.hit_by_cop_2 = true;
                if (this.hit_by_cop_1 && this.hit_by_cop_2) {
                    this.caught = true;
                    game.set_cop_targets = true;
                } else if (this.hit_by_cop_1 && (!this.hit_by_cop_2)) {
                    var cannot_move = true;
                    for (var j = 0; j < 8; j++)
                        if (position_in_direction(this, j) != null) {
                            cannot_move = false;
                            break;
                        }
                    if (cannot_move) {
                        this.caught = true;
                        game.set_cop_targets = true;
                    }
                }
            }
    }

    update() {
        super.update();
        if (!this.caught) {
            this.hit_by_cop_1 = false;
            this.hit_by_cop_2 = false;
        }
    }

    move_in_direction(dir) {
        if (this.movable) {
            var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
            var intended_position = position_in_direction(this, dir);
            if (intended_position)
                if (!unavailable_position_bitmap.get_2d(intended_position.row, intended_position.col))
                    this.move_to(intended_position);
        }
    }

    static update_all() {
        if (game.game_mode == 0) {
            if (game.robbers[game.robbers.length - 1].player_intended_direction != null) {
                game.robbers[game.robbers.length - 1].move_in_direction(game.robbers[game.robbers.length - 1].player_intended_direction);
                game.robbers[game.robbers.length - 1].player_intended_direction = null;
            }
            game.robbers[game.robbers.length - 1].update();
        }
        var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
        for (var i = 0; i < game.robbers.length; i++) {
            if (i == game.robbers.length - 1 && game.game_mode == 0)
                continue;
            var min_threat_of_cops = null;
            var min_threat_of_cops_dir = null;
            for (var j = 0; j < 9; j++) {
                var p;
                if (j < 8)
                    p = position_in_direction(game.robbers[i], j);
                else
                    p = { 'row': this.row, 'col': this.col };
                if (p == null || (j != 8 && unavailable_position_bitmap.get_2d(p.row, p.col)))
                    continue;
                var distance_to_cops = 0;
                for (var k = 0; k < game.cops.length; k++) {
                    var d = Math.abs(game.cops[k].row - p.row) + Math.abs(game.cops[k].col - p.col);
                    distance_to_cops += d * Math.pow(2, 20 - d);
                }
                if (min_threat_of_cops == null || distance_to_cops < min_threat_of_cops) {
                    min_threat_of_cops = distance_to_cops;
                    min_threat_of_cops_dir = j;
                }
            }
            if (min_threat_of_cops_dir < 8)
                game.robbers[i].move_in_direction(min_threat_of_cops_dir);
            game.robbers[i].update();
        }
    }

    static draw_all() {
        for (var i = 0; i < game.robbers.length; i++)
            game.robbers[i].draw();
    }

    static destroy_all() {
        for (var i = game.robbers.length - 1; i >= 0; i--)
            game.robbers.splice(i, 1)[0].destroy();
    }

    static create_random_robber(number) {
        for (var i = 0; i < number; i++)
            while (true) {
                var rand = Utilities.getRandomInt(0, game.grid.row * game.grid.col);
                var row = Math.floor(rand / game.grid.col);
                var col = rand - row * game.grid.col;
                var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
                if (!unavailable_position_bitmap.get_2d(row, col)) {
                    unavailable_position_bitmap.flip_2d(row, col);
                    var robber = new Robber_Sprite(row, col);
                    if (game.game_mode == 0 && i == number - 1) robber.attach_color(255, 255, 0, 255);
                    game.robbers.push(robber);
                    break;
                }
            }
    }
}

class Obstacle_Sprite extends ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, 255, 0, 0, 255);
        this.collidable = false;
    }

    static update_all() {
        for (var i = 0; i < game.obstacles.length; i++)
            game.obstacles[i].update();
    }

    static draw_all() {
        for (var i = 0; i < game.obstacles.length; i++)
            game.obstacles[i].draw();
    }

    static destroy_all() {
        for (var i = game.obstacles.length - 1; i >= 0; i--)
            game.obstacles.splice(i, 1)[0].destroy();
    }

    static create_obstacle(row, col) {
        var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
        if (unavailable_position_bitmap.get_2d(row, col))
            throw "Position already occupied error.";
        game.obstacles.push(new Obstacle_Sprite(row, col));
    }

    static create_random_obstacle(number) {
        for (var i = 0; i < number; i++)
            while (true) {
                var rand = Utilities.getRandomInt(0, game.grid.row * game.grid.col);
                var row = Math.floor(rand / game.grid.col);
                var col = rand - row * game.grid.col;
                var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
                if (!unavailable_position_bitmap.get_2d(row, col)) {
                    game.obstacles.push(new Obstacle_Sprite(row, col));
                    break;
                }
            }
    }
}

//---------------------------------------------- Run
game = new CaR(60, 2);
// game.push_level(level_0_loader);
game.push_level(level_1_loader);
game.push_level(level_2_loader);
game.start_ui_only();

function level_0_loader() {
    game.grid = new CaR_Grid(20, 20);
    Obstacle_Sprite.create_random_obstacle(10);
}

function level_fence_loader() {
    for (var i = 0; i < game.grid.col; i++)
        Obstacle_Sprite.create_obstacle(0, i);
    for (var i = 1; i < game.grid.row - 1; i++) {
        Obstacle_Sprite.create_obstacle(i, 0);
        Obstacle_Sprite.create_obstacle(i, game.grid.col - 1);
    }
    for (var i = 0; i < game.grid.col; i++)
        Obstacle_Sprite.create_obstacle(game.grid.row - 1, i);
}

function level_wall_loader(position_1, position_2) {
    var row = position_1.row, col = position_1.col;
    var get_position = function (index) {
        var position = null;
        switch (index) {
            case 0:
                if (row > 0)
                    position = { 'row': row - 1, 'col': col };
                else
                    position = null;
                break;
            case 1:
                if (row > 0 && col < game.grid.col - 1)
                    position = { 'row': row - 1, 'col': col + 1 };
                else
                    position = null;
                break;
            case 2:
                if (col < game.grid.col - 1)
                    position = { 'row': row, 'col': col + 1 };
                else
                    position = null;
                break;
            case 3:
                if (row < game.grid.row - 1 && col < game.grid.col - 1)
                    position = { 'row': row + 1, 'col': col + 1 };
                else
                    position = null;
                break;
            case 4:
                if (row < game.grid.row - 1)
                    position = { 'row': row + 1, 'col': col };
                else
                    position = null;
                break;
            case 5:
                if (row < game.grid.row - 1 && col > 0)
                    position = { 'row': row + 1, 'col': col - 1 };
                else
                    position = null;
                break;
            case 6:
                if (col > 0)
                    position = { 'row': row, 'col': col - 1 };
                else
                    position = null;
                break;
            case 7:
                if (row > 0 && col > 0)
                    position = { 'row': row - 1, 'col': col - 1 };
                else
                    position = null;
                break;
        }
        if (CaR_Grid.get_unavailable_position_bitmap().get_2d(position.row, position.col))
            position = null;
        return position;
    }
    while (row != position_2.row || col != position_2.col) {
        Obstacle_Sprite.create_obstacle(row, col);
        var min_d = null, min_p;
        for (var i = 0; i < 8; i++) {
            var p = get_position(i);
            if (p == null)
                continue;
            var d = Math.sqrt(Math.pow(p.row - position_2.row, 2) + Math.pow(p.col - position_2.col, 2));
            if (min_d == null || d < min_d) {
                min_d = d;
                min_p = p;
            }
        }
        row = min_p.row;
        col = min_p.col;
    } Obstacle_Sprite.create_obstacle(row, col);
}

function level_1_loader() {
    game.grid = new CaR_Grid(10, 10);
    if (game.real_time)
        game.turn_limit = 20;
    else
        game.turn_limit = 30;
    level_fence_loader();
    level_wall_loader({ 'row': 3, 'col': 1 }, { 'row': 3, 'col': 5 });
    level_wall_loader({ 'row': 6, 'col': 4 }, { 'row': 6, 'col': 8 });
    Cop_Sprite.create_random_cop(2);
    Robber_Sprite.create_random_robber(2);
}

function level_2_loader() {
    game.grid = new CaR_Grid(20, 20);
    if (game.real_time)
        game.turn_limit = 30;
    else
        game.turn_limit = 45;
    level_fence_loader();
    level_wall_loader({ 'row': 1, 'col': 4 }, { 'row': 6, 'col': 4 });
    level_wall_loader({ 'row': 4, 'col': 5 }, { 'row': 4, 'col': 8 });
    level_wall_loader({ 'row': 1, 'col': 12 }, { 'row': 10, 'col': 12 });
    level_wall_loader({ 'row': 5, 'col': 16 }, { 'row': 5, 'col': 18 });
    level_wall_loader({ 'row': 9, 'col': 1 }, { 'row': 9, 'col': 6 });
    level_wall_loader({ 'row': 18, 'col': 4 }, { 'row': 13, 'col': 9 });
    level_wall_loader({ 'row': 13, 'col': 13 }, { 'row': 18, 'col': 18 });
    Cop_Sprite.create_random_cop(5);
    Robber_Sprite.create_random_robber(3);
}