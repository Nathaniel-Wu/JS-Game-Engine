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
        scoreboard.score++;
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
            for (var i = 0; i < snake.snake_sprites.length; i++)
                if (((row == snake.snake_sprites[i].row + snake.snake_sprites[i].delta_row) && (col == snake.snake_sprites[i].col + snake.snake_sprites[i].delta_col))) {
                    repeat = true;
                    break;
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
        return { row: row, col: col };
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

var snake;
const snake_color = { r: 255, g: 255, b: 0, a: 255 };
const DIR = { U: 0, D: 1, L: 2, R: 3 };
class SnakeSprite extends PlaySprite {
    constructor(row, col, snake) {
        super(row, col);
        this.snake = snake;
    }

    move_prediction() {
        if (this.moveVect) {
            var index = this.grid.coord_to_index(new Coordinate(this.coord.x + this.moveVect.x, this.coord.y + this.moveVect.y));
            return new SnakeSprite(index.row, index.col, this.grid);
        }
        return new SnakeSprite(this.row, this.col, this.grid);
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
            if (this.row + this.delta_row == collision.into.row + collision.into.delta_row && this.col + this.delta_col == collision.into.col + collision.into.delta_col)
                this.snake.cancel_moving();
        if (collision.into instanceof PlayGrid)
            if (this.snake.really_hiting_wall())
                this.snake.cancel_moving();
        if (collision.into instanceof FoodSprite)
            if (this.is_snake_head())
                if (this.row + this.delta_row == collision.into.row && this.col + this.delta_col == collision.into.col)
                    if (!this.snake.already_eat) {
                        collision.into.eat_by(this.snake);
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
        if (this.is_snake_head()) {
            context.fillStyle = "rgba(63,63,0," + snake_color.a + ")";
            context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
        }
        else {
            context.fillStyle = "rgba(" + snake_color.r + "," + snake_color.g + "," + snake_color.b + "," + snake_color.a + ")";
            context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
        }
        context.beginPath();
        context.lineWidth = "1";
        context.strokeStyle = "black";
        context.rect(this.coord.x, this.coord.y, this.w, this.h);
        context.stroke();
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

class Snake {
    constructor() {
        this.snake_sprites = new Array();
        this.segmentations = new SPArray();
        this.directions = new Array();
        this.snake_sprites.push(new SnakeSprite(0, 4, this));
        this.snake_sprites.push(new SnakeSprite(0, 3, this));
        this.snake_sprites.push(new SnakeSprite(0, 2, this));
        this.snake_sprites.push(new SnakeSprite(0, 1, this));
        this.snake_sprites.push(new SnakeSprite(0, 0, this));
        this.directions.push(DIR.R);
        this.latest_direction = null;
        this.refresh_count = 0;
        this.input_event_subscription_manager = input_event_subscription_manager;
        this.si = this.input_event_subscription_manager.add_subscriber(this);
        this.latest_drag = null;
        this.latest_element = -1;
        this.stop = false;
        this.already_eat = false;
    }

    add_tail() {
        var current_tail = this.snake_sprites[this.snake_sprites.length - 1];
        this.snake_sprites.push(new SnakeSprite(current_tail.row, current_tail.col, this));
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

    stop_moving() {
        if (!this.stop)
            alert("Your final score is " + scoreboard.score + ", refresh to restart the game.");;
        this.stop = true;
    }

    cancel_moving() {
        for (var i = 0; i < this.snake_sprites.length; i++)
            this.snake_sprites[i].cancel_moving();
        this.stop_moving();
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

    update() {
        if (!this.stop) {
            this.refresh_count++;
            if (this.refresh_count % 30 == 0) {
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
                    console.log(e);
                    if (Utilities.string_compare(e, "Moving out of bounds error"))
                        this.cancel_moving();
                }
                CollidableGObject.CGO_update();
                for (var i = 0; i < this.snake_sprites.length; i++)
                    this.snake_sprites[i].update();
                for (var i = 0; i < foods.length; i++)
                    foods[i].update();
            }
            if (this.refresh_count % 600 == 0)
                SpoiledFoodSprite.create_ramdom_food();
        }
    }

    draw() {
        for (var i = 0; i < this.snake_sprites.length; i++)
            this.snake_sprites[i].draw();
    }

    handle_input_event(event) {
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

//---------------------------------------------- Score Board

var scoreboard;
class ScoreBoard extends Sprite {
    constructor() {
        super(canvas.width - 85, 0, 85, 40);
        this.collidable = false;
        this.score = 0;
    }

    draw() {
        this.attach_text(new Text_specs("" + this.score, 35, "Helvetica"));
        super.draw();
    }
}

//---------------------------------------------- Game Design

class SnakeGame extends Game {
    constructor() {
        super(60);
    }

    init() {
        super.init();
        playgrid = new PlayGrid();
        foods = new Array();
        snake = new Snake();
        for (var i = 0; i < 10; i++)
            FoodSprite.create_ramdom_food();
        scoreboard = new ScoreBoard();
    }

    update() {
        snake.update();
    }

    draw() {
        canvas.width = canvas.width;
        playgrid.draw();
        for (var i = 0; i < foods.length; i++)
            foods[i].draw();
        snake.draw();
        FoodSprite.draw();
        scoreboard.draw();
    }
}

//---------------------------------------------- Run

var game = new SnakeGame();
game.init();
game.start_loop();