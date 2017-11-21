class A_Star_Test extends Game {
    constructor() {
        super(60);
        this.grid = null;
        this.obstacles = null;
        this.start_sprite = null;
        this.end_sprite = null;
        this.step_sprites = null;
    }

    load() {
        this.grid = new Test_Grid();
        this.obstacles = new Array();
        for (var i = 0; i < 20; i++)
            this.obstacles.push(Obstacle_Sprite.createRandom());
        this.start_sprite = new Path_Sprite(0, 0); this.start_sprite.visble = false;
        this.end_sprite = new Path_Sprite(0, 0); this.end_sprite.visble = false;
        this.step_sprites = new Array();
    }

    update() {
        super.update();
        for (var i = 0; i < this.obstacles.length; i++)
            this.obstacles[i].update();
        this.grid.update();
        this.start_sprite.update();
        this.end_sprite.update();
        for (var i = 0; i < this.step_sprites.length; i++)
            this.step_sprites[i].update();
    }

    draw() {
        super.draw();
        for (var i = 0; i < this.obstacles.length; i++)
            this.obstacles[i].draw();
        this.start_sprite.draw();
        this.end_sprite.draw();
        for (var i = 0; i < this.step_sprites.length; i++)
            this.step_sprites[i].draw();
        this.grid.draw();
    }
}

class Test_Grid extends Grid {
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
}

class Path_Sprite extends ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, 0, 255, 255, 255);
    }
}

class Obstacle_Sprite extends ColoredGridSprite {
    constructor(row, col) {
        super(row, col, game.grid, 255, 0, 0, 255);
    }
    static getObstacleBitmap() {
        if (!this.obstacle_bitmap)
            this.obstacle_bitmap = new bitmap_2d(game.grid.row, game.grid.col);
        return this.obstacle_bitmap;
    }
    static createRandom() {
        while (true) {
            var rand = Utilities.getRandomInt(0, game.grid.row * game.grid.col);
            var row = Math.floor(rand / game.grid.col);
            var col = rand - row * game.grid.col;
            if (!this.getObstacleBitmap().get_2d(row, col)) {
                this.getObstacleBitmap().flip_2d(row, col);
                return new Obstacle_Sprite(row, col);
            }
        }
    }
}

/*************************************************/
var game = new A_Star_Test();
game.start();