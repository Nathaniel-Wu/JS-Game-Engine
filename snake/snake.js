//---------------------------------------------- Game Specific Grid
var playgrid;
class PlayGrid extends Grid {
    constructor() {
        super(15, 15);
        this.visble = true;
    }

    move_prediction() {
        return new PlayGrid();
    }

    actual_draw() {
        for (var i = 0; i <= this.row; i++) {
            context.beginPath();
            context.lineWidth = "1";
            context.strokeStyle = "grey";
            context.moveTo(0, i * this.cell_h);
            context.lineTo(this.w, i * this.cell_h);
            context.stroke();
        }
        for (var i = 0; i <= this.col; i++) {
            context.beginPath();
            context.lineWidth = "1";
            context.strokeStyle = "grey";
            context.moveTo(i * this.cell_w, 0);
            context.lineTo(i * this.cell_w, this.h);
            context.stroke();
        }
    }
}

class PlaySprite extends GridSprite {
    constructor(row, col) {
        super(row, col, playgrid);
    }
}

//---------------------------------------------- Food
var foods;
const food_color = { r: 255, g: 0, b: 0, a: 255 };
class FoodSprite extends PlaySprite {
    constructor(row, col) {
        super(row, col);
        if (game.game_mode == 0 && game.multiplayer_role == 1)
            this.movable = true;
        else
            this.movable = false;
        this.fi = -1;
    }

    move_prediction() {
        return new FoodSprite(this.row, this.col);
    }

    resolve(collision) {
        if (collision.into instanceof SnakeSprite) {
            if (collision.into.collides(this))
                collision.into.resolve(new Collision(null, this, CPType.PASSIVE));
        }
    }

    actual_draw() {
        context.fillStyle = "rgba(" + food_color.r + "," + food_color.g + "," + food_color.b + "," + food_color.a + ")";
        context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
        context.beginPath();
        context.lineWidth = "1";
        context.strokeStyle = "black";
        context.rect(this.coord.x, this.coord.y, this.w, this.h);
        context.stroke();
    }

    eat_by(s) {
        if (!s instanceof Snake)
            throw "Non-Snake parameter error";
        for (var i = 0; i < foods.length; i++)
            if (foods[i] === this) {
                foods.splice(i, 1);
                break;
            }
        s.add_tail();
        CollidableGObject.rm_CollidableGObject_instance_ref(this.CollidableGObject_id);
        FoodSprite.create_ramdom_food();
    }

    assign_random_index() {
        var index = this.random_index();
        var coord = this.grid.index_to_coord(index.row, index.col);
        this.row = index.row;
        this.col = index.col;
        this.coord.x = coord.x;
        this.coord.y = coord.y;
    }

    random_index() {
        var row, col;
        do {
            row = Utilities.getRandomInt(0, this.grid.row);
            col = Utilities.getRandomInt(0, this.grid.col);
            if (!foods)
                break;
            var repeat = false;
            for (var j = 0; j < snakes.length; j++) {
                for (var i = 0; i < snakes[j].snake_sprites.length; i++)
                    if (((row == snakes[j].snake_sprites[i].row + snakes[j].snake_sprites[i].delta_row) && (col == snakes[j].snake_sprites[i].col + snakes[j].snake_sprites[i].delta_col))) {
                        repeat = true;
                        break;
                    }
            }
            if (repeat)
                continue;
            for (var i = 0; i < foods.length; i++)
                if ((row == foods[i].row) && (col == foods[i].col)) {
                    repeat = true;
                    break;
                }
            if (!repeat)
                break;
        } while (true);
        return { 'row': row, 'col': col };
    }

    static create_ramdom_food() {
        var f = new FoodSprite(0, 0);
        f.assign_random_index();
        foods.push(f);
    }

    static draw() {
        if (foods)
            for (var i = 0; i < foods.length; i++)
                foods[i].draw();
    }
}

const spoiled_food_color = { r: 0, g: 0, b: 255, a: 255 };
class SpoiledFoodSprite extends FoodSprite {
    constructor(row, col) {
        super(row, col);
        this.cycle = 15;
        this.draw_count = -1;
    }

    move_prediction() {
        return new FoodSprite(this.row, this.col);
    }

    resolve(collision) {
        if (collision.into instanceof SnakeSprite) {
            if (collision.into.collides(this))
                collision.into.resolve(new Collision(null, this, CPType.PASSIVE));
        }
    }

    actual_draw() {
        this.draw_count++;
        var draw = false;
        if (this.cycle < 5) {
            if (this.draw_count % 30 < 24)
                draw = true;
        } else
            draw = true;
        if (draw) {
            context.fillStyle = "rgba(" + spoiled_food_color.r + "," + spoiled_food_color.g + "," + spoiled_food_color.b + "," + spoiled_food_color.a + ")";
            context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
            context.beginPath();
            context.lineWidth = "1";
            context.strokeStyle = "black";
            context.rect(this.coord.x, this.coord.y, this.w, this.h);
            context.stroke();
        }
    }

    eat_by(s) {
        if (!s instanceof Snake)
            throw "Non-Snake parameter error";
        for (var i = 0; i < foods.length; i++)
            if (foods[i] === this) {
                foods.splice(i, 1);
                break;
            }
        s.delete_tail();
        CollidableGObject.rm_CollidableGObject_instance_ref(this.CollidableGObject_id);
    }

    update() {
        super.update();
        if (game.game_mode == 0 && game.multiplayer_role == 1)
            return;
        this.cycle--;
        if (this.cycle < 0) {
            for (var i = 0; i < foods.length; i++)
                if (foods[i] === this) {
                    foods.splice(i, 1);
                    break;
                }
            CollidableGObject.rm_CollidableGObject_instance_ref(this.CollidableGObject_id);
        }
    }

    static create_ramdom_food() {
        var f = new SpoiledFoodSprite(0, 0);
        f.assign_random_index();
        foods.push(f);
    }
}

//---------------------------------------------- Snake Sprite

const DIR = { U: 0, D: 1, L: 2, R: 3 };
class SnakeSprite extends PlaySprite {
    constructor(row, col, snake_instance, color) {
        super(row, col);
        this.snake = snake_instance;
        this.color = color;
    }

    move_prediction() {
        if (this.moveVect) {
            var index = this.grid.coord_to_index(new Coordinate(this.coord.x + this.moveVect.x, this.coord.y + this.moveVect.y));
            return new SnakeSprite(index.row, index.col, this.grid, null);
        }
        return new SnakeSprite(this.row, this.col, this.grid, null);
    }

    cancel_moving() {
        this.delta_row = 0;
        this.delta_col = 0;
        this.moveVect = null;
    }

    is_snake_head() {
        if (this.row == this.snake.snake_sprites[0].row && this.col == this.snake.snake_sprites[0].col)
            return true;
        return false;
    }

    resolve(collision) {
        if (collision.into instanceof SnakeSprite)
            if (this.row + this.delta_row == collision.into.row + collision.into.delta_row && this.col + this.delta_col == collision.into.col + collision.into.delta_col) {
                this.snake.cancel_moving();
                if (this.is_snake_head()) {
                    if (this.snake instanceof Snake_2)
                        game.end_game_snake_2_hit = true;
                    else
                        game.end_game_snake_hit = true;
                }
                if (collision.into.is_snake_head()) {
                    if (collision.into.snake instanceof Snake_2)
                        game.end_game_snake_2_hit = true;
                    else
                        game.end_game_snake_hit = true;
                }
            }
        if (collision.into instanceof PlayGrid)
            if (this.snake.really_hiting_wall()) {
                this.snake.cancel_moving();
                if (this.snake instanceof Snake_2)
                    game.end_game_snake_2_hit = true;
                else
                    game.end_game_snake_hit = true;
            }
        if (collision.into instanceof FoodSprite)
            if (this.is_snake_head())
                if (this.row + this.delta_row == collision.into.row && this.col + this.delta_col == collision.into.col)
                    if (!this.snake.already_eat) {
                        collision.into.eat_by(this.snake);
                        this.snake.score++;
                        this.snake.already_eat = true;
                    }
    }

    move(dir) {
        switch (dir) {
            case DIR.U: {
                super.move({ row: -1, col: 0 });
                break;
            }
            case DIR.D: {
                super.move({ row: 1, col: 0 });
                break;
            }
            case DIR.L: {
                super.move({ row: 0, col: -1 });
                break;
            }
            case DIR.R: {
                super.move({ row: 0, col: 1 });
                break;
            }
            default:
                throw "Invalid direction error";
        }
    }

    actual_draw() {
        var imagedata = context.createImageData(this.w, this.h);
        if (this.color) {
            if (this.is_snake_head()) {
                context.fillStyle = "rgba(63,63,0," + this.color.a + ")";
                context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
            } else {
                context.fillStyle = "rgba(" + this.color.r + "," + this.color.g + "," + this.color.b + "," + this.color.a + ")";
                context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
            }
            context.beginPath();
            context.lineWidth = "1";
            context.strokeStyle = "black";
            context.rect(this.coord.x, this.coord.y, this.w, this.h);
            context.stroke();
        }
    }
}

//---------------------------------------------- Snake

class SPArray {
    constructor() {
        this.array = new Array();
    }

    length() {
        return this.array.length;
    }

    push(n) {
        if (!Utilities.isInteger(n))
            throw "Non-integer parameter error";
        var insert_before = 0;
        while (insert_before < this.length() && n > this.peek(insert_before))
            insert_before++;
        if (insert_before == this.length())
            this.array.push(n);
        else
            this.array.splice(insert_before, 0, n);

    }

    validate_index(i) {
        if (!Utilities.isInteger(i))
            throw "Non-integer parameter error";
        if (i < 0 || this.length() <= i)
            throw "Index out of bounds error";
    }

    delete(i) {
        this.validate_index(i);
        return this.array.splice(i, 1)[0];
    }

    peek(i) {
        this.validate_index(i);
        return this.array[i];
    }

    all_increase() {
        for (var i = this.length() - 1; i >= 0; i--)
            this.array[i]++;
    }
}

var snakes = new Array();
const snake_color = { 'r': 255, 'g': 255, 'b': 0, 'a': 255 };
class Snake {
    constructor(name) {
        this.snake_sprites = new Array();
        this.segmentations = new SPArray();
        this.directions = new Array();
        this.snake_sprites.push(new SnakeSprite(0, 4, this, snake_color));
        this.snake_sprites.push(new SnakeSprite(0, 3, this, snake_color));
        this.snake_sprites.push(new SnakeSprite(0, 2, this, snake_color));
        this.snake_sprites.push(new SnakeSprite(0, 1, this, snake_color));
        this.snake_sprites.push(new SnakeSprite(0, 0, this, snake_color));
        this.directions.push(DIR.R);
        this.latest_direction = null;
        this.input_event_subscription_manager = input_event_subscription_manager;
        this.si = this.input_event_subscription_manager.add_subscriber(this);
        this.latest_drag = null;
        this.latest_element = -1;
        this.stop = false;
        this.already_eat = false;
        this.score = 0;
    }

    add_tail() {
        var current_tail = this.snake_sprites[this.snake_sprites.length - 1];
        this.snake_sprites.push(new SnakeSprite(current_tail.row, current_tail.col, this, snake_color));
    }

    delete_tail() {
        var tail = this.snake_sprites.splice(this.snake_sprites.length - 1, 1)[0];
        CollidableGObject.rm_CollidableGObject_instance_ref(tail.CollidableGObject_id);
    }

    really_hiting_wall() {
        if ((this.snake_sprites[0].row == 0 && this.directions[0] == DIR.U) || (this.snake_sprites[0].row == this.row - 1 && this.directions[0] == DIR.D) || (this.snake_sprites[0].col == 0 && this.directions[0] == DIR.L) || (this.snake_sprites[0].col == this.col - 1 && this.directions[0] == DIR.R))
            return true;
        return false;
    }

    change_direction(dir) {
        switch (dir) {
            case DIR.U: {
                if (this.directions[0] != DIR.U && this.directions[0] != DIR.D)
                    this.latest_direction = DIR.U;
                break;
            }
            case DIR.D: {
                if (this.directions[0] != DIR.U && this.directions[0] != DIR.D)
                    this.latest_direction = DIR.D;
                break;
            }
            case DIR.L: {
                if (this.directions[0] != DIR.L && this.directions[0] != DIR.R)
                    this.latest_direction = DIR.L;
                break;
            }
            case DIR.R: {
                if (this.directions[0] != DIR.L && this.directions[0] != DIR.R)
                    this.latest_direction = DIR.R;
                break;
            }
            default:
                throw "Invalid direction error";
        }
    }

    segmentate(dir) {
        if (!(dir == DIR.U || dir == DIR.D || dir == DIR.L || dir == DIR.R))
            throw "Invalid direction error";
        this.directions.unshift(dir);
        this.segmentations.push(0);
    }

    cancel_moving() {
        this.stop = true;
    }

    stop_moving() {
        for (var i = 0; i < this.snake_sprites.length; i++)
            this.snake_sprites[i].cancel_moving();
    }

    move() {
        if (!this.stop) {
            var first_segmentation;
            if (this.segmentations.length() > 0)
                first_segmentation = this.segmentations.peek(0);
            else
                first_segmentation = this.snake_sprites.length;
            for (var i = 0; i < first_segmentation; i++)
                this.snake_sprites[i].move(this.directions[0]);
            for (var i = 0; i < this.segmentations.length(); i++) {
                var next_segmentation;
                if (i != this.segmentations.length() - 1)
                    next_segmentation = this.segmentations.peek(i + 1);
                else
                    next_segmentation = this.snake_sprites.length;
                for (var j = this.segmentations.peek(i); j < next_segmentation; j++)
                    this.snake_sprites[j].move(this.directions[i + 1]);
            }
        }
    }

    pre_update() {
        if (!this.stop) {
            this.already_eat = false;
            if (this.latest_direction != null) {
                this.segmentate(this.latest_direction);
                this.latest_direction = null;
            }
            if (this.segmentations.length() > 0) {
                this.segmentations.all_increase();
                if (this.segmentations.peek(this.segmentations.length() - 1) >= this.snake_sprites.length) {
                    this.segmentations.delete(this.segmentations.length() - 1);
                    this.directions.splice(this.directions.length - 1, 1)[0];
                }
            }
            try {
                this.move();
            } catch (e) {
                if (Utilities.string_compare(e, "Moving out of bounds error")) {
                    this.cancel_moving();
                    if (this instanceof Snake_2)
                        game.end_game_snake_2_hit = true;
                    else
                        game.end_game_snake_hit = true;
                }
            }
        } else
            game.restart_flag = true;
    }

    update() {
        if (!this.stop) {
            for (var i = 0; i < this.snake_sprites.length; i++)
                this.snake_sprites[i].update();
        }
    }

    draw() {
        for (var i = 0; i < this.snake_sprites.length; i++)
            this.snake_sprites[i].draw();
    }

    handle_input_event(event) {
        if (!(game.game_mode == 0 && game.multiplayer_role == 1)) {
            this.input_event_subscription_manager.set_exclusive(this.si, event.type);
            switch (event.type) {
                case IEType.UP: {
                    this.change_direction(DIR.U);
                    break;
                }
                case IEType.DOWN: {
                    this.change_direction(DIR.D);
                    break;
                }
                case IEType.LEFT: {
                    this.change_direction(DIR.L);
                    break;
                }
                case IEType.RIGHT: {
                    this.change_direction(DIR.R);
                    break;
                }
            }
            this.input_event_subscription_manager.release_exclusive(this.si, event.type);
        }
    }

    destroy() {
        for (var i = this.snake_sprites.length - 1; i >= 0; i--)
            this.snake_sprites.splice(0, 1)[0].destroy();
        this.input_event_subscription_manager.remove_subscriber(this.si);
    }
}

const snake_2_color = { 'r': 0, 'g': 255, 'b': 255, 'a': 255 };
class Snake_2 extends Snake {
    constructor(name) {
        super(name);
        for (var i = this.snake_sprites.length - 1; i >= 0; i--)
            this.snake_sprites.splice(0, 1)[0].destroy();
        this.snake_sprites.push(new SnakeSprite(playgrid.row - 1, playgrid.col - 5, this, snake_2_color));
        this.snake_sprites.push(new SnakeSprite(playgrid.row - 1, playgrid.col - 4, this, snake_2_color));
        this.snake_sprites.push(new SnakeSprite(playgrid.row - 1, playgrid.col - 3, this, snake_2_color));
        this.snake_sprites.push(new SnakeSprite(playgrid.row - 1, playgrid.col - 2, this, snake_2_color));
        this.snake_sprites.push(new SnakeSprite(playgrid.row - 1, playgrid.col - 1, this, snake_2_color));
        this.directions[0] = DIR.L;
    }

    add_tail() {
        var current_tail = this.snake_sprites[this.snake_sprites.length - 1];
        this.snake_sprites.push(new SnakeSprite(current_tail.row, current_tail.col, this, snake_2_color));
    }

    handle_input_event(event) {
        if (game.game_mode == 0 && game.multiplayer_role == 1) {
            this.input_event_subscription_manager.set_exclusive(this.si, event.type);
            switch (event.type) {
                case IEType.UP: {
                    game.guest_to_host_connection.send({ 'class': "DIR", 'D': DIR.U });
                    break;
                }
                case IEType.DOWN: {
                    game.guest_to_host_connection.send({ 'class': "DIR", 'D': DIR.D });
                    break;
                }
                case IEType.LEFT: {
                    game.guest_to_host_connection.send({ 'class': "DIR", 'D': DIR.L });
                    break;
                }
                case IEType.RIGHT: {
                    game.guest_to_host_connection.send({ 'class': "DIR", 'D': DIR.R });
                    break;
                }
            }
            this.input_event_subscription_manager.release_exclusive(this.si, event.type);
        } else if (game.game_mode == 2) {
            this.input_event_subscription_manager.set_exclusive(this.si, event.type);
            switch (event.type) {
                case IEType.W: {
                    this.change_direction(DIR.U);
                    break;
                }
                case IEType.S: {
                    this.change_direction(DIR.D);
                    break;
                }
                case IEType.A: {
                    this.change_direction(DIR.L);
                    break;
                }
                case IEType.D: {
                    this.change_direction(DIR.R);
                    break;
                }
            }
            this.input_event_subscription_manager.release_exclusive(this.si, event.type);
        }
    }
}

//---------------------------------------------- Game UI

class SnakeGame_ModeSelection extends UI {
    constructor(game_) {
        if (!game_ instanceof SnakeGame)
            throw "Non-SnakeGame parameter error";
        super(game_, 1.0, true);
        this.si = this.game.input_event_subscription_manager.add_subscriber(this);
        this.game_mode = -1;
        this.selection_made = false;
        this.mpn = new Colored_Sprite(0, 0, this.game.canvas.width, this.game.canvas.height / 3, snake_2_color.r, snake_2_color.g, snake_2_color.b, snake_2_color.a);
        this.mpn.attach_text(new Text_specs("Multiplayer (network)", 60, "Helvetica"));
        this.sp = new Colored_Sprite(0, this.game.canvas.height / 3, this.game.canvas.width, this.game.canvas.height / 3, snake_color.r, snake_color.g, snake_color.b, snake_color.a);
        this.sp.attach_text(new Text_specs("Single Player", 60, "Helvetica"));
        this.mpl = new Colored_Sprite(0, 2 * this.game.canvas.height / 3, this.game.canvas.width, this.game.canvas.height / 3, snake_2_color.r, snake_2_color.g, snake_2_color.b, snake_2_color.a);
        this.mpl.attach_text(new Text_specs("Multiplayer (local)", 60, "Helvetica"));
    }

    draw() {
        this.mpn.draw();
        this.sp.draw();
        this.mpl.draw();
    }

    handle_input_event(event) {
        if (event.type == IEType.SELECT) {
            this.game.input_event_subscription_manager.set_exclusive(this.si, event.type);
            if (0 <= event.coord.x && event.coord.x <= this.game.canvas.width && 0 <= event.coord.y && event.coord.y <= this.game.canvas.height) {
                if (event.coord.y < this.game.canvas.height / 3)
                    this.game_mode = 0;
                else if (event.coord.y < 2 * this.game.canvas.height / 3)
                    this.game_mode = 1;
                else
                    this.game_mode = 2;
                this.selection_made = true;
            }
            this.game.input_event_subscription_manager.release_exclusive(this.si, event.type);
        }
    }

    destroy() {
        this.game.input_event_subscription_manager.remove_subscriber(this.si);
        this.mpn.destroy();
        this.sp.destroy();
        this.mpl.destroy();
    }
}

class SnakeGame_Multiplayer_Role_Select extends UI {
    constructor(game_) {
        if (!game_ instanceof SnakeGame)
            throw "Non-SnakeGame parameter error";
        super(game_, 1.0, true);
        this.si = this.game.input_event_subscription_manager.add_subscriber(this);
        this.role = -1;
        this.selection_made = false;
        this.host = new Colored_Sprite(0, 0, this.game.canvas.width, this.game.canvas.height / 2, snake_color.r, snake_color.g, snake_color.b, snake_color.a);
        this.host.attach_text(new Text_specs("Play as Host", 60, "Helvetica"));
        this.guest = new Colored_Sprite(0, this.game.canvas.height / 2, this.game.canvas.width, this.game.canvas.height / 2, snake_2_color.r, snake_2_color.g, snake_2_color.b, snake_2_color.a);
        this.guest.attach_text(new Text_specs("Play as Guest", 60, "Helvetica"));
    }

    draw() {
        this.host.draw();
        this.guest.draw();
    }

    handle_input_event(event) {
        if (event.type == IEType.SELECT) {
            this.game.input_event_subscription_manager.set_exclusive(this.si, event.type);
            if (0 <= event.coord.x && event.coord.x <= this.game.canvas.width && 0 <= event.coord.y && event.coord.y <= this.game.canvas.height) {
                if (event.coord.y < this.game.canvas.height / 2)
                    this.role = 0;
                else
                    this.role = 1;
                this.selection_made = true;
            }
            this.game.input_event_subscription_manager.release_exclusive(this.si, event.type);
        }
    }

    destroy() {
        this.game.input_event_subscription_manager.remove_subscriber(this.si);
        this.host.destroy();
        this.guest.destroy();
    }
}

class SnakeGame_Multiplayer_Wait extends UI {
    constructor(game_) {
        if (!game_ instanceof SnakeGame)
            throw "Non-SnakeGame parameter error";
        super(game_, 1.0, true);
        var color;
        if (this.game.multiplayer_role == 0)
            color = snake_color;
        else
            color = snake_2_color;
        this.message = new Colored_Sprite(0, 0, this.game.canvas.width, this.game.canvas.height, color.r, color.g, color.b, color.a);
        this.message.attach_text(new Text_specs("Waiting for connection…", 60, "Helvetica"));
        this.wait_complete = false;
    }

    draw() {
        this.message.draw();
    }

    destroy() {
        this.message.destroy();
    }
}

class ScoreBoard extends Sprite {
    constructor(name) {
        super(0, 0, 200, 50);
        this.name = name;
        this.collidable = false;
        this.score = 0;
    }

    draw() {
        this.attach_text(new Text_specs(this.name + ": " + this.score, 35, "Helvetica"));
        super.draw();
    }
}

class SnakeGame_Scoreboards extends UI {
    constructor(game_, single_player) {
        if (!game_ instanceof SnakeGame)
            throw "Non-SnakeGame parameter error";
        super(game_, 1.0, true);
        this.single_player = single_player;
        this.scoreboards = new Array();
        this.scoreboards.push(new ScoreBoard("Player 1"));
        if (!this.single_player) {
            this.scoreboards.push(new ScoreBoard("Player 2"));
            this.scoreboards[1].move_to(new Coordinate(canvas.width - this.scoreboards[1].w, 0));
        }
    }

    update() {
        this.scoreboards[0].score = this.game.scores[0];
        this.scoreboards[0].update();
        if (!this.single_player) {
            this.scoreboards[1].score = this.game.scores[1];
            this.scoreboards[1].update();
        }
    }

    actual_draw() {
        this.scoreboards[0].draw();
        if (!this.single_player)
            this.scoreboards[1].draw();
    }

    destroy() {
        this.scoreboards[0].destroy();
        if (!this.single_player)
            this.scoreboards[1].destroy();
    }
}

//---------------------------------------------- Game Design

class SnakeGame extends Game {
    constructor() {
        super(60);
        this.scores = [0, 0];
        this.refresh_count = 0;
        this.end_game_snake_hit = false;
        this.end_game_snake_2_hit = false;
        this.game_mode = -1;
        this.multiplayer_role = -1;
        this.host_player_peer = null;
        this.guest_player_peer = null;
        this.host_to_guest_connection = null;
        this.guest_to_host_connection = null;
        this.host_data_queue = null;
        this.guest_data_queue = null;
    }

    init() {
        super.init();
        this.ui_stack.push(new SnakeGame_ModeSelection(this));
    }

    load() {
        this.ui_stack.push(new SnakeGame_Scoreboards(this, this.game_mode == 1));
        playgrid = new PlayGrid();
        foods = new Array();
        snakes.push(new Snake("Player 1"));
        if (this.game_mode != 1)
            snakes.push(new Snake_2("Player 2"));
        if (!(this.game_mode == 0 && this.multiplayer_role == 1))
            for (var i = 0; i < 10; i++)
                FoodSprite.create_ramdom_food();
        this.refresh_count = 0;
        if (this.game_mode == 0 && this.multiplayer_role == 0)
            this.send_host_status();
    }

    deload() {
        super.deload();
        if (this.game_mode == 1) {
            alert("Game over, your final score is " + this.scores[0] + ".");
        } else {
            if (this.end_game_snake_hit && this.end_game_snake_2_hit) {
                if (this.scores[0] < this.scores[1])
                    alert("Player 2 wins.");
                else if (this.scores[0] == this.scores[1])
                    alert("Tie.");
                else
                    alert("Player 1 wins.");
            } else if (this.end_game_snake_hit)
                alert("Player 2 wins");
            else
                alert("Player 1 wins");
        }
        playgrid.destroy();
        for (var i = foods.length - 1; i >= 0; i--)
            foods.splice(0, 1)[0].destroy();
        for (var i = snakes.length - 1; i >= 0; i--)
            snakes.splice(0, 1)[0].destroy();
        this.end_game_snake_hit = false;
        this.end_game_snake_2_hit = false;
    }

    send_host_status() {
        if (this.game_mode == 0 && this.multiplayer_role == 0) {
            this.host_to_guest_connection.send({ 'class': "FSL", 'L': foods.length });
            for (var i = 0; i < foods.length; i++) {
                if (foods[i] instanceof SpoiledFoodSprite)
                    this.host_to_guest_connection.send({ 'class': "SFS", 'I': i, 'R': foods[i].row, 'C': foods[i].col });
                else
                    this.host_to_guest_connection.send({ 'class': "FS", 'I': i, 'R': foods[i].row, 'C': foods[i].col });
            }
            for (var i = 0; i < snakes.length; i++) {
                this.host_to_guest_connection.send({ 'class': "SNL", 'I': i, 'L': snakes[i].snake_sprites.length });
                for (var j = 0; j < snakes[i].snake_sprites.length; j++)
                    this.host_to_guest_connection.send({ 'class': "SN", 'I': i, 'J': j, 'R': snakes[i].snake_sprites[j].row, 'C': snakes[i].snake_sprites[j].col });
                this.host_to_guest_connection.send({ 'class': "SNS", 'I': i, 'S': snakes[i].score });
            }
        }
        this.host_to_guest_connection.send({ 'class': "end" });
    }

    handle_data_queue() {
        if (this.game_mode == 0 && this.multiplayer_role == 0) {
            for (var i = this.host_data_queue.length - 1; i >= 0; i--) {
                var data = this.host_data_queue.splice(0, 1)[0];
                switch (data.class) {
                    case "DIR": {
                        snakes[1].change_direction(data.D);
                        break;
                    } default:
                        console.log("Unknown class");
                }
            }
        } else if (this.game_mode == 0 && this.multiplayer_role == 1) {
            var length = 0;
            for (var i = 0; i < this.guest_data_queue.length; i++) {
                length++;
                if (this.guest_data_queue[i].class == "end")
                    break;
            }
            var stop_flag = false;
            for (var i = this.guest_data_queue.length - 1; i >= 0; i--) {
                if (stop_flag)
                    break;
                var data = this.guest_data_queue.splice(0, 1)[0];
                switch (data.class) {
                    case "FSL": {
                        while (foods.length < data.L)
                            foods.push(new FoodSprite(0, 0));
                        while (foods.length > data.L)
                            foods.splice(foods.length - 1, 1)[0].destroy();
                        break;
                    } case "SFS": {
                        if (!(foods[data.I] instanceof SpoiledFoodSprite)) {
                            var cache = foods[data.I];
                            foods[data.I] = new SpoiledFoodSprite(data.R, data.C);
                            cache.destroy();
                        }
                        foods[data.I].move_to({ 'row': data.R, 'col': data.C });
                        break;
                    } case "FS": {
                        if (foods[data.I] instanceof SpoiledFoodSprite) {
                            var cache = foods[data.I];
                            foods[data.I] = new FoodSprite(data.R, data.C);
                            cache.destroy();
                        }
                        foods[data.I].move_to({ 'row': data.R, 'col': data.C });
                        break;
                    } case "SNL": {
                        while (snakes[data.I].snake_sprites.length < data.L)
                            snakes[data.I].add_tail();
                        while (snakes[data.I].snake_sprites.length > data.L)
                            snakes[data.I].delete_tail();
                        break;
                    } case "SN": {
                        snakes[data.I].snake_sprites[data.J].move_to({ 'row': data.R, 'col': data.C });
                        break;
                    } case "SNS": {
                        snakes[data.I].score = data.S;
                        this.scores[data.I] = data.S;
                        break;
                    } case "end": {
                        stop_flag = true;
                        break;
                    } default:
                        console.log("Unknown class");
                }
            }
        }
    }

    update() {
        if (!(this.game_mode == 0 && this.multiplayer_role == 1)) {
            if (this.game_mode == 0 && this.multiplayer_role == 0)
                this.handle_data_queue();
            super.update();
            this.refresh_count++;
            if (this.refresh_count % 30 == 0) {
                for (var i = 0; i < snakes.length; i++)
                    snakes[i].pre_update();
                CollidableGObject.CGO_update();
                var stop = false;
                for (var i = 0; i < snakes.length; i++)
                    if (snakes[i].stop) {
                        stop = true;
                        break;
                    } if (stop) for (var i = 0; i < snakes.length; i++) snakes[i].stop_moving();
                for (var i = 0; i < snakes.length; i++)
                    snakes[i].update();
                for (var i = 0; i < foods.length; i++)
                    foods[i].update();
                if (this.refresh_count % 600 == 0)
                    SpoiledFoodSprite.create_ramdom_food();
                this.scores[0] = snakes[0].score;
                if (this.game_mode != 1)
                    this.scores[1] = snakes[1].score;
                if (this.game_mode == 0 && this.multiplayer_role == 0)
                    this.send_host_status();
            }
        } else {
            this.handle_data_queue();
            for (var i = 0; i < snakes.length; i++)
                snakes[i].update();
            for (var i = 0; i < foods.length; i++)
                foods[i].update();
        }
    }

    draw() {
        super.draw();
        playgrid.draw();
        for (var i = 0; i < foods.length; i++)
            foods[i].draw();
        for (var i = 0; i < snakes.length; i++)
            snakes[i].draw();
        FoodSprite.draw();
    }

    ui_loop() {
        if (this.ui_stack.stack[0] instanceof SnakeGame_ModeSelection) {
            if (this.ui_stack.stack[0].selection_made) {
                this.game_mode = this.ui_stack.stack[0].game_mode;
                this.ui_stack.deload();
                if (this.game_mode == 0)
                    this.ui_stack.push(new SnakeGame_Multiplayer_Role_Select(this));
                else {
                    var t = this;
                    var restart_ = function () {
                        t.stop_ui_loop();
                        t.load();
                        t.start_loop();
                        t.start_ui_loop();
                    }; restart_();
                }
            }
        }
        if (this.ui_stack.stack[0] instanceof SnakeGame_Multiplayer_Role_Select) {
            if (this.ui_stack.stack[0].selection_made) {
                this.multiplayer_role = this.ui_stack.stack[0].role;
                this.ui_stack.deload();
                this.ui_stack.push(new SnakeGame_Multiplayer_Wait(this));
                if (this.multiplayer_role == 0) {
                    this.host_data_queue = new Array();
                    this.host_player_peer = new Peer('SNAKE_HOST', { key: 'dxw1vi0imcth85mi' });
                    this.host_to_guest_connection = this.host_player_peer.connect('SNAKE_GUEST');
                    var t = this;
                    this.host_to_guest_connection.on('data', function (data) {
                        t.host_to_guest_connection.send('Acknowledgement received');
                        if (!t.ui_stack.stack[0].wait_complete)
                            t.ui_stack.stack[0].wait_complete = true;
                        if (data.class)
                            t.host_data_queue.push(data);
                    });
                }
                else {
                    this.guest_data_queue = new Array();
                    this.guest_player_peer = new Peer('SNAKE_GUEST', { key: 'dxw1vi0imcth85mi' });
                    var t = this;
                    this.guest_player_peer.on('connection', function (conn) {
                        t.guest_to_host_connection = conn;
                        conn.on('open', function () { conn.send("Request received"); });
                        conn.on('data', function (data) {
                            if (!t.ui_stack.stack[0].wait_complete)
                                t.ui_stack.stack[0].wait_complete = true;
                            if (data.class)
                                t.guest_data_queue.push(data);
                        });
                    });
                }
            }
        }
        if (this.ui_stack.stack[0] instanceof SnakeGame_Multiplayer_Wait) {
            if (this.ui_stack.stack[0].wait_complete) {
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

//---------------------------------------------- Run

var game = new SnakeGame();
game.start_ui_only();