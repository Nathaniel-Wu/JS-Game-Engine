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
    }

    load() {
        this.grid = new CaR_Grid();
        this.obstacles = new Array();
        this.cops = new Array();
        this.robbers = new Array();
        Obstacle_Sprite.create_random_obstacle(10);
        Cop_Sprite.create_random_cop(2);
        Robber_Sprite.create_random_robber(1);
    }

    update() {
        super.update();
        if (this.update_count == 0) {
            this.grid.update();
            Obstacle_Sprite.update_all();
            Robber_Sprite.update_all();
            Cop_Sprite.update_all();
        } this.update_count = (this.update_count + 1) % this.refresh_interval;
    }

    draw() {
        super.draw();
        this.grid.draw();
        Obstacle_Sprite.draw_all();
        Robber_Sprite.draw_all();
        Cop_Sprite.draw_all();
    }
}

class CaR_Grid extends Grid {
    constructor() {
        super(15, 15);
        this.visble = true;
        this.input_event_subscription_manager = input_event_subscription_manager;
        this.input_event_subscription_manager.add_subscriber(this);
        this.selected_position = null;
        this.start_position = null;
        this.end_position = null;
    }

    update() {
        if (this.selected_position) {
            if (!this.start_position) {
                this.start_position = this.selected_position;
                game.start_sprite.move_to(this.start_position);
                game.start_sprite.visble = true;
                for (var i = 0; i < game.step_sprites.length; i++)
                    game.step_sprites[i].visble = false;
                game.end_sprite.visble = false;
            }
            else if (!this.end_position) {
                this.end_position = this.selected_position;
                game.end_sprite.move_to(this.end_position);
                game.end_sprite.visble = true;
            }
            else
                throw "Error";
            this.selected_position = null;
        }
        if (this.start_position && this.end_position) {
            var closed_list = new bitmap_2d(this.row, this.col);
            for (var i = 0; i < game.obstacles.length; i++)
                closed_list.set_2d(game.obstacles[i].row, game.obstacles[i].col, true);
            var steps; try { steps = this.findPath(this.start_position, this.end_position, closed_list); } catch (e) { console.log(e); }
            if (!steps) {
                this.end_position = null;
                game.end_sprite.visble = false;
                return;
            }
            while (steps.length > game.step_sprites.length) {
                var cache = new Path_Sprite(0, 0);
                cache.attach_text(new Text_specs("" + (game.step_sprites.length + 1), game.grid.cell_w * 0.618, "Helvetica"));
                game.step_sprites.push(cache);
            }
            for (var i = 0; i < steps.length; i++) {
                game.step_sprites[i].move_to(steps[i]);
                game.step_sprites[i].visble = true;
            }
            var i = steps.length;
            while (i < game.step_sprites.length) {
                game.step_sprites[i].visble = false;
                i++;
            }
            this.start_position = null;
            this.end_position = null;
        }
    }

    handle_input_event(event) {
        switch (event.type) {
            case IEType.SELECT: {
                try {
                    this.input_event_subscription_manager.set_exclusive(this.si, IEType.SELECT);
                    var row = Math.floor(event.coord.y / this.cell_h);
                    var col = Math.floor(event.coord.x / this.cell_w);
                    this.selected_position = { 'row': row, 'col': col };
                } catch (e) {
                    console.log(e);
                } this.input_event_subscription_manager.release_exclusive(this.si, IEType.SELECT);
                break;
            }
        }
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

class Cop_Sprite extends Flashing_ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, Math.floor(game.framerate * 0.333));
        this.attach_color(0, 0, 0, 255);
        this.attach_color(0, 0, 255, 255);
        this.attach_color(223, 223, 223, 255);
    }

    static update_all() {
        for (var i = 0; i < game.cops.length; i++)
            game.cops[i].update();
    }

    static draw_all() {
        for (var i = 0; i < game.cops.length; i++)
            game.cops[i].draw();
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
                    game.cops.push(new Cop_Sprite(row, col));
                    break;
                }
            }
    }
}

class Robber_Sprite extends ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, 0, 255, 255, 255);
    }

    static update_all() {
        for (var i = 0; i < game.robbers.length; i++)
            game.robbers[i].update();
    }

    static draw_all() {
        for (var i = 0; i < game.robbers.length; i++)
            game.robbers[i].draw();
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
                    game.robbers.push(new Robber_Sprite(row, col));
                    break;
                }
            }
    }
}

class Obstacle_Sprite extends ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, 255, 0, 0, 255);
    }

    static update_all() {
        for (var i = 0; i < game.obstacles.length; i++)
            game.obstacles[i].update();
    }

    static draw_all() {
        for (var i = 0; i < game.obstacles.length; i++)
            game.obstacles[i].draw();
    }

    static create_random_obstacle(number) {
        for (var i = 0; i < number; i++)
            while (true) {
                var rand = Utilities.getRandomInt(0, game.grid.row * game.grid.col);
                var row = Math.floor(rand / game.grid.col);
                var col = rand - row * game.grid.col;
                var unavailable_position_bitmap = CaR_Grid.get_unavailable_position_bitmap();
                if (!unavailable_position_bitmap.get_2d(row, col)) {
                    unavailable_position_bitmap.flip_2d(row, col);
                    game.obstacles.push(new Obstacle_Sprite(row, col));
                    break;
                }
            }
    }
}

/*************************************************/
var game = new CaR(60, 2);
game.start();