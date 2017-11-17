var canvas;
var canvas_x;
var canvas_y;
var context;
var ui_canvas;
var ui_context;
var input_event_subscription_manager;

//---------------------------------------------- Game
/*var loop_count = 0;
var frame_time_sum = 0;
var frame_time_max = -1;
var frame_time_min = 1000;*/
class Game {
    constructor(framerate) {
        this.canvas = null;
        this.canvas_x = 0;
        this.canvas_y = 0;
        this.context = null;
        this.ui_canvas = null;
        this.ui_context = null;
        this.input_event_subscription_manager = null;
        this.loop_handle = null;
        this.framerate = framerate;
        this.inter_frame = 1000 / this.framerate;
        this.restart_flag = false;
        this.ui_stack = new UIStack(this);
        this.ui_loop_handle = null;
        this.ui_framerate = framerate;
        this.ui_inter_frame = 1000 / this.ui_framerate;
        this.drawing = false;
    }

    start_ui_only() {
        this.init();
        this.start_ui_loop();
    }

    start() {
        this.init();
        this.load();
        this.start_loop();
        this.start_ui_loop();
    }

    pause() {
        this.stop_loop();
    }

    resume() {
        this.start_loop();
    }

    stop() {
        this.stop_loop();
        this.stop_ui_loop();
        this.deload();
    }

    restart() {
        this.stop();
        this.load();
        this.start_loop();
        this.start_ui_loop();
    }

    init() {
        this.canvas = document.getElementById("canvas");
        this.canvas.setAttribute("style", "z-index: 0;");
        this.canvas_x = this.canvas.getBoundingClientRect().left;
        this.canvas_y = this.canvas.getBoundingClientRect().top;
        this.canvas.setAttribute("style", "position: absolute; left: " + this.canvas_x + "px; top: " + this.canvas_y + "px; z-index: 0;");
        this.context = this.canvas.getContext("2d");
        this.ui_canvas = document.createElement("canvas");
        this.ui_canvas.setAttribute("width", this.canvas.width);
        this.ui_canvas.setAttribute("height", this.canvas.height);
        this.ui_canvas.setAttribute("style", "position: absolute; left: " + this.canvas_x + "px; top: " + this.canvas_y + "px; z-index: 1;");
        document.getElementById("game").appendChild(this.ui_canvas);
        this.ui_context = this.ui_canvas.getContext("2d");
        this.input_event_subscription_manager = new Input_Event_Subscription_Manager();
        this.ui_canvas.addEventListener("mousedown", onMouseDown);
        this.ui_canvas.addEventListener("mousemove", onMouseMove);
        this.ui_canvas.addEventListener("mouseup", onMouseUp);
        document.addEventListener("keydown", onKeyDown);
        this.switch_context();
    }

    switch_context() {
        canvas = this.canvas;
        canvas_x = this.canvas_x;
        canvas_y = this.canvas_y;
        context = this.context;
        ui_canvas = this.ui_canvas;
        ui_context == this.ui_context;
        input_event_subscription_manager = this.input_event_subscription_manager;
    }

    load() { }

    deload() {
        for (var i = this.input_event_subscription_manager.subscribers.length - 1; i >= 0; i--)
            this.input_event_subscription_manager.remove_subscriber(i);
        this.ui_stack.deload();
    }

    update() {
        if (this.restart_flag) {
            this.restart_flag = false;
            this.restart();
        }
    }

    draw() { this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); }

    loop() {/*
        loop_count++;
        var frame_time = (new Date()).getTime();*/
        this.update();
        this.drawing = true;
        this.draw();
        this.drawing = false;/*
        frame_time = (new Date()).getTime() - frame_time;
        if (frame_time < frame_time_min)
            frame_time_min = frame_time;
        if (frame_time > frame_time_max)
            frame_time_max = frame_time;
        frame_time_sum += frame_time;
        if (loop_count == 60) {
            console.info("max frame time: " + frame_time_max + "ms; min frame time: " + frame_time_min + "ms; average: " + frame_time_sum / 60 + "ms");
            loop_count = 0;
            frame_time_sum = 0;
            frame_time_max = -1;
            frame_time_min = 1000;
        }*/
    }

    start_loop() {
        if (this.loop_handle)
            throw "Already in loop error";
        var t = this;
        this.loop_handle = setInterval(function () { t.loop(); }, this.inter_frame);
    }

    stop_loop() {
        if (!this.loop_handle)
            throw "Not in loop error";
        clearInterval(this.loop_handle);
        this.loop_handle = null;
    }

    ui_loop() {
        this.ui_stack.update();
        var t = this;
        Utilities.wait(function () { return t.drawing; }, false, 1, function () { t.ui_context.clearRect(0, 0, t.ui_canvas.width, t.ui_canvas.height); t.ui_stack.draw(); });
    }

    start_ui_loop() {
        if (this.ui_loop_handle)
            throw "Already in ui loop error";
        var t = this;
        this.ui_loop_handle = setInterval(function () { t.ui_loop(); }, this.ui_inter_frame);
    }

    stop_ui_loop() {
        if (!this.ui_loop_handle)
            throw "Not in ui loop error";
        clearInterval(this.ui_loop_handle);
        this.ui_loop_handle = null;
    }

    set_ui_frame_rate(ui_framerate) {
        var in_ui_loop = (this.ui_loop_handle) ? true : false;
        if (in_ui_loop)
            this.stop_ui_loop();
        this.ui_framerate = ui_framerate;
        this.ui_inter_frame = 1000 / this.ui_framerate;
        if (in_ui_loop)
            this.start_ui_loop();
    }
}

//---------------------------------------------- UI

class UI {
    constructor(game, alpha, block) {
        if (!game instanceof Game)
            throw "Non-Game parameter error";
        if (typeof alpha !== 'number')
            throw "Non-number alpha parameter error";
        if (0.0 > alpha || alpha > 1.0)
            throw "Alpha parameter range error";
        if (typeof block !== 'boolean')
            throw "Non-boolean parameter error";
        this.game = game;
        this.alpha = alpha;
        this.block = block;
    }

    update() { }
    draw() {
        context = this.game.ui_context;
        context.globalAlpha = this.alpha;
        this.actual_draw();
        context.globalAlpha = 1.0;
        context = this.game.context;
    }
    actual_draw() { }
    destroy() { }
}

class UIStack {
    constructor(game) {
        if (!game instanceof Game)
            throw "Non-Game parameter error";
        this.game = game;
        this.stack = new Array();
    }

    push(ui) {
        if (!ui instanceof UI)
            throw "Non-UI parameter error";
        this.stack.push(ui);
    }

    pop() {
        return this.stack.splice(this.stack.length - 1, 1)[0];
    }

    deload() {
        for (var i = this.stack.length - 1; i >= 0; i--)
            this.pop().destroy();
    }

    update() {
        for (var i = 0; i < this.stack.length; i++)
            this.stack[i].update();
    }

    draw() {
        for (var i = this.stack.length - 1; i >= 0; i--) {
            this.stack[i].draw();
            if (this.stack[i].block) break;
        }
        this.game.context.stroke();
        this.game.ui_context.stroke();
    }
}

//---------------------------------------------- Utilities

class Utilities {
    static string_compare(str_1, str_2) {
        return str_1 < str_2 ? false : (str_1 > str_2 ? false : true);
    }

    static isInteger(num) {
        if (num === parseInt(num, 10))
            return true;
        return false;
    }

    static getRandomInt(min, max) {//min ~ (max - 1)
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    static merge_array_no_repetition(array_0, array_1) {
        var result = new Array(); var length = array_0.length + array_1.length;
        for (var i = 0; i < length; i++) {
            var array_, i_; if (i < array_0.length) { array_ = array_0; i_ = i; } else { array_ = array_1; i_ = i - array_0.length; }
            var repeated = false;
            for (var j = 0; j < result.length; j++)
                if (array_[i_] === result[j]) {
                    repeated = true;
                    break;
                }
            if (!repeated)
                result.push(array_[i_]);
        }
        return result;
    }

    static get_JSON(url) {
        var httpReq = new XMLHttpRequest();
        httpReq.open("GET", url, false);
        httpReq.send(null);
        var startTime = Date.now();
        while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE))
            if ((Date.now() - startTime) > 3000)
                break;
        if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE)) {
            console.log * ("Unable to open input ellipses file!");
            return null;
        }
        return JSON.parse(httpReq.response);
    }

    static wait(trial, expected_value, check_interval, callback) {
        while (trial() !== expected_value) {
            setTimeout(function () { Utilities.wait(trial, expected_value, check_interval, callback); }, check_interval);
            return;
        } callback();
    }

    static sleep(time) {
        var start = new Date().getTime();
        while (new Date().getTime() - start < time) { }
    }
}

class bitmap {
    constructor(size) {
        this._cols = 8;
        this._shift = 3;
        this._rows = (size >> this._shift) + 1;
        this._buf = new ArrayBuffer(this._rows);
        this._bin = new Uint8Array(this._buf);
    }

    get(off) {
        var row = off >> this._shift;
        var col = off % this._cols;
        var bit = 1 << col;
        return (this._bin[row] & bit) > 0;
    }

    set(off, bool) {
        var row = off >> this._shift;
        var col = off % this._cols;
        var bit = 1 << col;
        if (bool) {
            this._bin[row] |= bit;
        } else {
            bit = 255 ^ bit;
            this._bin[row] &= bit;
        }
    }

    flip(off) {
        var row = Math.floor(off / this._cols);
        var col = off % this._cols;
        var bit = 1 << col;
        this._bin[row] ^= bit;
    }

    fill() {
        for (var i = 0; i < this._rows; i++)
            this._bin[i] = 255;
    }

    clear() {
        for (var i = 0; i < this._rows; i++)
            this._bin[i] = 0;
    }
}

//---------------------------------------------- Vector

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    copy(v) {
        if (v instanceof Vector)
            return new Vector(v.x, v.y);
        else
            throw "Non-Vector parameter error";
    }

    subtract(v) {
        if (v instanceof Vector)
            return new Vector(this.x - v.x, this.y - v.y);
        else
            throw "Non-Vector parameter error";
    }

    add(v) {
        if (v instanceof Vector)
            return new Vector(this.x + v.x, this.y + v.y);
        else
            throw "Non-Vector parameter error";
    }

    dot(v) {
        if (v instanceof Vector)
            return this.x * v.x + this.y * v.y;
        else
            throw "Non-Vector parameter error";
    }

    scale(scaler) {
        return new Vector(this.x * scaler, this.y * scaler);
    }

    normalize() {
        return this.scale(1 / this.norm());
    }

    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    mirror(normal) {
        if (normal instanceof Vector) {
            var T = this.normalize();
            var N = normal.normalize();
            return T.scale(2 * N.dot(T)).add(T);
        } else
            throw "Non-Vector parameter error";
    }
}

//---------------------------------------------- Coordinate

class Coordinate extends Vector {
    constructor(x, y) {
        super(x, y);
    }

    clone() {
        return new Coordinate(this.x, this.y);
    }

    copy(c) {
        if (c instanceof Coordinate)
            return new Coordinate(c.x, c.y);
        else
            throw "Non-Coordinate parameter error";
    }

    subtract(c) {
        if (c instanceof Coordinate)
            return super.subtract(c);
        else
            throw "Non-Coordinate parameter error";
    }

    add(v) {
        if (v instanceof Vector) {
            var res = super.add(v);
            return new Coordinate(res.x, res.y);
        } else
            throw "Non-Coordinate parameter error";
    }

    scale(scaler) {
        return new Coordinate(Math.round(this.x * scaler), Math.round(this.y * scaler));
    }
}

//---------------------------------------------- Ray

class Ray {
    constructor(origin, direction) {
        if (!(origin instanceof Coordinate || (origin instanceof Vector && Utilities.isInteger(origin.x) && Utilities.isInteger(origin.y))))
            throw "Non-Coordinate parameter error";
        if (!direction instanceof Vector)
            throw "Non-Vector parameter error";
        this.origin = new Coordinate(origin.x, origin.y);
        this.direction = new Vector(direction.x, direction.y);
    }

    ray_intersection(r) {
        if (!r instanceof Ray)
            throw "Non-Ray parameter error";
        var x1 = this.direction.x;
        var y1 = this.direction.y;
        var x2 = r.direction.x;
        var y2 = r.direction.y;
        var delta_r = r.origin.subtract(this.origin);
        var x = delta_r.x;
        var y = delta_r.y;
        if (y2 != 0)
            var ratio = x2 / y2;
        else
            return null;
        var tmp = x1 - y1 * ratio;
        if (tmp != 0)
            var t_1 = (x + y * ratio) / (tmp);
        else
            return null;
        var t_2 = (t_1 * y1 - y) / y2;
        var i = this.origin.add(this.direction.scale(t_1));
        return { intersect: i, t1: t_1, t2: t_2 };
    }
}

//---------------------------------------------- ID Generator

class IDGenerator {
    constructor(size) {
        this.max = size - 1;
        this.id_pool = new Array();
        for (var i = 0; i < size; i++)
            this.id_pool.push(i);
        this.assigned_ids = new Array();
    }

    get_id() {
        var res;
        if (this.max < 0)
            throw "ID pool dry out error."
        if (this.max == 0)
            res = this.id_pool[0];
        else {
            var i = Utilities.getRandomInt(0, this.max);
            res = this.id_pool[i];
            var buffer = this.id_pool[this.max];
            this.id_pool[this.max] = this.id_pool[i];
            this.id_pool[i] = buffer;
        }
        this.max--;
        this.assigned_ids.push(res);
        return res;
    }

    get_id_index(id) {
        for (var i = 0; i < this.assigned_ids.length; i++)
            if (this.assigned_ids[i] === id)
                return i;
        return -1;
    }

    validate_id(id) {
        if (this.get_id_index(id) == -1)
            return false;
        return true;
    }

    recycle_id(id) {
        var id_index = this.get_id_index(id);
        if (id_index == -1)
            throw "Invalid ID error";
        this.assigned_ids.splice(id_index, 1);
        this.max++;
        this.id_pool[this.max] = id;
    }
}

//---------------------------------------------- GameObject

class GObject {
    constructor(x, y, w, h) {
        if (!canvas)
            throw "Canvas existence error";
        if (typeof x != 'number' || typeof y != 'number' || typeof w != 'number' || typeof h != 'number')
            throw "Non-number parameter error";
        this.id = GObject.get_id_generator().get_id();
        GObject.get_instance_array()[this.id] = this;
        this.coord = new Coordinate(x, y);
        this.w = w;
        this.h = h;
        this.movable = true;
        this.visble = true;
        this.moveVect = null;
        this.rotate_offset_coord = null;
        this.rotate_rad = null;
    }

    move(vect) {
        if (!vect instanceof Vector)
            throw "Non-Vector parameter error";
        if (this.movable)
            if (!this.moveVect)
                this.moveVect = vect;
            else
                this.moveVect = this.moveVect.add(vect);
    }

    move_to(coord) {
        if (!coord instanceof Coordinate)
            throw "Non-Coordinate parameter error";
        if (this.movable) {
            if (this.moveVect)
                this.move(coord.subtract(this.coord.add(this.moveVect)));
            else
                this.move(coord.subtract(this.coord));
        }
    }

    update() {
        if (this.movable && this.moveVect) {
            this.coord = this.coord.add(this.moveVect);
            this.moveVect = null;
        }
    }

    rotate(offset_coord, rad) {
        if (offset_coord) {
            if (!offset_coord instanceof Coordinate)
                throw "Non-Coordinate parameter error";
            this.rotate_offset_coord = offset_coord;
        } else
            this.rotate_offset_coord = null;
        if (typeof rad !== 'number')
            throw "Non-number parameter";
        this.rotate_rad = rad;
    }

    rotate_cancel() {
        this.rotate_rad = null;
        this.rotate_offset_coord = null;
    }

    draw() {
        if (this.visble) {
            if (this.rotate_rad != null) {
                context.save();
                context.translate(this.coord.x, this.coord.y);
                if (this.rotate_offset_coord)
                    context.translate(this.rotate_offset_coord.x, this.rotate_offset_coord.y);
                context.rotate(this.rotate_rad);
                context.translate(-this.coord.x, -this.coord.y);
                if (this.rotate_offset_coord)
                    context.translate(-this.rotate_offset_coord.x, -this.rotate_offset_coord.y);
                this.actual_draw();
                context.restore();
            } else
                this.actual_draw();
        }
    }

    actual_draw() { }

    destroy() {
        GObject.rm_instance_ref(this.id);
    }

    static get_instance(id) {
        return this.get_instance_array()[id];
    }

    static rm_instance_ref(id) {
        this.get_instance_array()[id] = null;
        this.get_id_generator().recycle_id(id);
    }

    static get_instance_array() {
        if (!this.instance_array)
            this.instance_array = new Array();
        return this.instance_array;
    }

    static get_id_generator() {
        if (!this.id_generator)
            this.id_generator = new IDGenerator(10000);
        return this.id_generator;
    }
}

//---------------------------------------------- Bounding Volume

class BoundingVolume {
    constructor(x_offset, y_offset, w, h) {
        if (typeof x_offset != 'number' || typeof y_offset != 'number' || typeof w != 'number' || typeof h != 'number')
            throw "Non-number parameter error";
        this.coord_offset = new Coordinate(x_offset, y_offset);
        this.w = w;
        this.h = h;
        this.GObj = null;
        this.parent = null;
        this.children = null;
    }

    get_actual_coordinate() {
        if (!this.GObj)
            throw "GObject unset error";
        return this.GObj.coord.add(this.coord_offset);
    }

    get_center_coordinate() {
        return this.get_actual_coordinate().add(new Vector(Math.round(this.w / 2), Math.round(this.h / 2)));
    }

    attach_child_BoundingVolume(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        if (!this.children)
            this.children = new Array();
        for (var i = 0; i < this.children.length; i++)
            if (bv === this.children[i])
                throw "Child BoundingVolume already exists error";
        var ul = this.GObj.coord.add(bv.coord_offset);
        var lr = ul.add(new Vector(bv.w, bv.h));
        if (!this.check_coordinate_without_children(ul) || !this.check_coordinate_without_children(lr))
            throw "Child BoundingVolume out of parent BoundingVolume error";
        bv.GObj = this.GObj;
        bv.parent = this;
        this.children.push(bv);
    }

    check_coordinate_without_children(coord) {
        if (!coord instanceof Coordinate)
            throw "Non-Coordinate parameter error";
        var actual_coordinate = this.get_actual_coordinate();
        if (coord.x < actual_coordinate.x || (actual_coordinate.x + this.w) < coord.x || coord.y < actual_coordinate.y || (actual_coordinate.y + this.h) < coord.y)
            return false;
        return true;
    }

    check_coordinate(coord) {
        if (!coord instanceof Coordinate)
            throw "Non-Coordinate parameter error";
        if (!this.check_coordinate_without_children(coord))
            return false;
        if (this.children)
            for (var i = 0; i < this.children.length; i++)
                if (!this.children[i].check_coordinate(coord))
                    return false;
        return true;
    }

    Minkowski_add(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        var coord_offset = this.coord_offset.add(bv.get_actual_coordinate().add(this.get_center_coordinate().subtract(bv.get_center_coordinate())));
        var MS = new BoundingVolume(coord_offset.x, coord_offset.y, this.w + bv.w, this.h + bv.h);
        MS.GObj = this.GObj;
        return MS;
    }

    ray_intersection(r) {
        if (!r instanceof Ray)
            throw "Non-Ray parameter error";
        var a = this.actual_coordinate();
        var sides = new Array();
        sides.push(new Ray(a, new Vector(this.w, 0)));//Top
        sides.push(new Ray(a.add(new Vector(0, this.h)), new Vector(this.w, 0)));//Bottom
        sides.push(new Ray(a, new Vector(0, this.h)));//Left
        sides.push(new Ray(a.add(new Vector(this.w, 0)), new Vector(0, this.h)));//Right
        var intersections = new Array();
        for (var i = 0; i < sides.length; i++)
            intersections.push(sides[i].ray_intersection(r));
        var count = new Array();
        for (var i = 0; i < sides.length; i++)
            if (intersections[i] && (0 < intersections[i].t1 && intersections[i].t1 < 1) && (0 < intersections[i].t2 && intersections[i].t2 < 1))
                count.push(i);
        if (count.length == 0)
            return null;
        var index;
        if (count.length == 1)
            index = 0;
        else if (count[0].t2 < count[1].t2)
            index = 0;
        else
            index = 1;
        var N;
        if (count[index] == 0 || count[index] == 1)
            N = new Vector(0, 1);
        else
            N = new Vector(1, 0);
        var reflection = r.mirror(N).scale(-count[index].t2);
        return new Ray(count[index].intersect, reflection);
    }

    check_overlap_without_children(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        var this_ul = this.get_actual_coordinate();
        var this_lr = this_ul.add(new Coordinate(this.w, this.h));
        var bv_ul = bv.get_actual_coordinate();
        var bv_lr = bv_ul.add(new Coordinate(bv.w, bv.h));
        if ((this_ul.x > bv_lr.x || bv_ul.x > this_lr.x) || (this_ul.y > bv_lr.y || bv_ul.y > this_lr.y))
            return false;
        return true;
    }

    check_overlap_without_children_unstrict(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        var this_ul = this.get_actual_coordinate();
        var this_lr = this_ul.add(new Coordinate(this.w, this.h));
        var bv_ul = bv.get_actual_coordinate();
        var bv_lr = bv_ul.add(new Coordinate(bv.w, bv.h));
        if ((this_ul.x > bv_lr.x || bv_ul.x > this_lr.x) || (this_ul.y > bv_lr.y || bv_ul.y > this_lr.y))
            return false;
        if ((this_ul.x == bv_ul.x && this_ul.y == bv_ul.y) || (this_lr.x == bv_lr.x && this_lr.y == bv_lr.y))
            return true;
        if ((this_lr.x == bv_ul.x || this_ul.x == bv_lr.x || this_lr.y == bv_ul.y || this_ul.y == bv_lr.y))
            return false;
        return true;
    }

    get_children(depth) {
        switch (depth) {
            case 0: {
                var res = new Array();
                res.push(this);
                return res;
                break;
            }
            case 1: {
                if (this.children)
                    return this.children;
                else
                    return null;
                break;
            }
            default: {
                if (!Utilities.isInteger(depth))
                    throw "Non-integer parameter error";
                else if (depth < 0)
                    throw "Negative depth parameter error";
                var res = new Array();
                for (var i = 0; i < this.children.length; i++) {
                    var c = this.children[i].get_children(depth - 1);
                    if (c)
                        for (var j = 0; j < c.length; j++)
                            res.push(c[j]);
                }
                if (res.length != 0)
                    return res;
                else
                    return null;
            }
        }
    }

    check_overlap_with_children(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        var this_depth = 0, bv_depth = 0;
        var this_max = false, bv_max = false;
        do {
            var this_c, bv_c;
            if (!this_max) {
                this_c = this.get_children(this_depth);
                if (this_c == null) {
                    this_depth--;
                    this_max = true;
                    this_c = this.get_children(this_depth);
                } else
                    this_depth++;
            }
            if (!bv_max) {
                bv_c = bv.get_children(bv_depth);
                if (bv_c == null) {
                    bv_depth--;
                    bv_max = true;
                    bv_c = bv.get_children(bv_depth);
                } else
                    bv_depth++;
            }
            var all_false = true;
            for (var i = 0; i < this_c.length; i++) {
                for (var j = 0; j < bv_c.length; j++) {
                    if (this_c[i].check_overlap_without_children(bv_c[j]))
                        all_false = false;
                }
            }
            if (all_false)
                return false;
            else if (this_max && bv_max)
                return true;
        } while (true);
    }
}

//---------------------------------------------- Circle Bounding Volume

class CircleBoundingVolume extends BoundingVolume {
    constructor(x_offset, y_offset, radius) {
        if (typeof x_offset != 'number' || typeof y_offset != 'number' || typeof radius != 'number')
            throw "Non-number parameter error";
        super(x_offset, y_offset, 2 * radius, 2 * radius);
        this.coord_offset = new Coordinate(x_offset, y_offset);
        this.radius = radius;
        this.GObj = null;
        this.parent = null;
        this.children = null;
    }

    get_center_coordinate() {
        return this.get_actual_coordinate();
    }

    attach_child_BoundingVolume(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        if (!this.children)
            this.children = new Array();
        for (var i = 0; i < this.children.length; i++)
            if (bv === this.children[i])
                throw "Child BoundingVolume already exists error";
        if (bv instanceof CircleBoundingVolume) {
            var delta_v = this.coord_offset.subtract(bv.coord_offset);
            var delta_d = Math.sqrt(delta_v.dot(delta_v));
            if (delta_d + bv.radius > this.radius)
                throw "Child BoundingVolume out of parent BoundingVolume error";
        } else {
            var ul = this.GObj.coord.add(bv.coord_offset);
            var lr = ul.add(new Vector(bv.w, bv.h));
            if (!this.check_coordinate_without_children(ul) || !this.check_coordinate_without_children(lr))
                throw "Child BoundingVolume out of parent BoundingVolume error";
        }
        bv.GObj = this.GObj;
        bv.parent = this;
        this.children.push(bv);
    }

    check_coordinate_without_children(coord) {
        if (!coord instanceof Coordinate)
            throw "Non-Coordinate parameter error";
        var delta_v = this.get_actual_coordinate().subtract(coord);
        if (delta_v.dot(delta_v) >= this.radius * this.radius)
            return false;
        return true;
    }

    Minkowski_add(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        if (bv instanceof CircleBoundingVolume) {
            var MS = new CircleBoundingVolume(this.coord_offset.x, this.coord_offset.y, this.radius + bv.radius);
            MS.GObj = this.GObj;
            return MS;
        } else {
            //Add with box bounding volume, implementation pending.
            return null;
        }
    }

    ray_intersection(r) {
        if (!r instanceof Ray)
            throw "Non-Ray parameter error";
        var a = this.actual_coordinate();
        var delta_v = a.subtract(r.origin);
        if (delta_v.dot(r.direction) < 0)
            return null;
        else {
            var ao = r.origin.subtract(a);
            var t = -(ao.x * r.direction.x + ao.y * r.direction.y) / (r.direction.x * r.direction.x + r.direction.y * r.direction.y);
            var i = r.origin.add(r.direction.scale(t));
            var ia = a.subtract(i);
            if (ia.dot(ia) > this.radius * this.radius)
                return null;
            else {
                //Reflection ray, implementation pending.
                return null;
            }
        }
    }

    check_overlap_without_children(bv) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        if (bv instanceof CircleBoundingVolume) {
            var delta_v = bv.get_actual_coordinate().subtract(this.get_actual_coordinate());
            if (delta_v.dot(delta_v) >= (this.radius + bv.radius) * (this.radius + bv.radius))
                return false;
            return true;
        } else {
            var ul = bv.get_actual_coordinate();
            var lr = ul.add(new Vector(bv.w, bv.h));
            if (!this.check_coordinate_without_children(ul) && !this.check_coordinate_without_children(lr))
                return false;
            return true;
        }
    }

    check_overlap_without_children_unstrict(bv) {
        return this.check_overlap_without_children(bv);
    }
}

//---------------------------------------------- Collision

const CPType = { HARD: 0, PASSIVE: 1 };//Collision property type

class Collision {
    constructor(ray, into, type) {
        if (!ray instanceof Ray)
            throw "Non-Ray parameter error";
        if (!into instanceof CollidableGObject)
            throw "Non-CollidableGObject parameter error";
        if (type == CPType.HARD)
            this.ray = ray;
        if (type == CPType.PASSIVE)
            this.into = into;
    }
}

//---------------------------------------------- CollisionQuadtree

class QuadtreeNode {
    constructor() {
        this.values = new Array();
        this.parent = null;
        this.level = 0;
        this.children = { q1: null, q2: null, q3: null, q4: null };
    }

    attach_value(v) {
        for (var i = 0; i < this.values.length; i++)
            if (this.values[i] === v)
                throw "Duplicate value error";
        this.values.push(v);
    }

    attach_parent(node) {
        if (!node instanceof QuadtreeNode)
            throw "Non-QuadtreeNode parameter error";
        this.parent = node;
        this.level = node.level + 1;
    }

    attach_child(node, quadrant) {
        if (!node instanceof QuadtreeNode)
            throw "Non-QuadtreeNode parameter error";
        switch (quadrant) {
            case 1: {
                this.children.q1 = node;
                this.children.q1.attach_parent(this);
                break;
            }
            case 2: {
                this.children.q2 = node;
                this.children.q2.attach_parent(this);
                break;
            }
            case 3: {
                this.children.q3 = node;
                this.children.q3.attach_parent(this);
                break;
            }
            case 4: {
                this.children.q4 = node;
                this.children.q4.attach_parent(this);
                break;
            }
            default:
                throw "Invalid quadrant error";
        }
    }

    isLeaf() {
        if (this.values.length >= 0 && (!this.children.q1) && (!this.children.q2) && (!this.children.q3) && (!this.children.q4))
            return true;
        else if (this.values.length == 0 && this.children.q1 && this.children.q2 && this.children.q3 && this.children.q4)
            return false;
        else
            throw "Unexpected node state error";
    }

    get_child(quadrant) {
        switch (quadrant) {
            case 1:
                return this.children.q1;
                break;
            case 2:
                return this.children.q2;
                break;
            case 3:
                return this.children.q3;
                break;
            case 4:
                return this.children.q4;
                break;
            default:
                throw "Invalid quadrant error";
        }
    }

    get_valid_quadrants() {
        var quadrants = new Array();
        for (var i = 1; i <= 4; i++) {
            var child_i = this.get_child(i);
            if (child_i && child_i.values.length > 0)
                quadrants.push(i);
        }
        if (quadrants.length > 0)
            return quadrants;
        return null;
    }
}

class CollisionQuadtreeNode extends QuadtreeNode {
    constructor(x, y, w, h) {
        super();
        this.coord = new Coordinate(x, y);
        this.w = w; this.h = h;
        this.level = 0;
    }

    attach_value(v) {
        if (!v instanceof CollidableGObject)
            throw "Non-CollidableGObject parameter error";
        super.attach_value(v);
    }

    attach_parent(node) {
        if (!node instanceof CollisionQuadtreeNode)
            throw "Non-CollisionQuadtreeNode parameter error";
        super.attach_parent(node);
    }

    attach_child(node, quadrant) {
        if (!node instanceof CollisionQuadtreeNode)
            throw "Non-CollisionQuadtreeNode parameter error";
        super.attach_child(node, quadrant);
    }

    check_coord(coord) {
        if (((this.coord.x > coord.x) || (coord.x >= this.coord.x + this.w)) || ((this.coord.y > coord.y) || (coord.y >= this.coord.y + this.h)))
            return false;
        return true;
    }

    split() {
        var w = Math.round(this.w / 2); var h = Math.round(this.h / 2);
        this.attach_child(new CollisionQuadtreeNode(this.coord.x, this.coord.y, w, h), 1);//Upper-Left
        this.attach_child(new CollisionQuadtreeNode(this.coord.x + w, this.coord.y, this.w - w, h), 2);//Upper-Right
        this.attach_child(new CollisionQuadtreeNode(this.coord.x, this.coord.y + h, w, this.h - h), 3);//Bottom-left
        this.attach_child(new CollisionQuadtreeNode(this.coord.x + w, this.coord.y + h, this.w - w, this.h - h), 4);//Bottom-right
        for (var i = 1; i <= 4; i++) {
            var child_i = this.get_child(i);
            for (var j = this.values.length - 1; j >= 0; j--)
                if (child_i.check_coord(this.values[j].coord))
                    child_i.attach_value(this.values.splice(j, 1)[0]);
        }
    }
}

const max_node_capacity = 5;
const max_level = 4;
class CollisionQuadtree {
    constructor(w, h) {
        this.root = null;
        this.count = 0;
        this.w = w; this.h = h;
    }

    get_quadtree_node(coord) {
        if (!coord instanceof Coordinate)
            throw "Non-Coordinate parameter error";
        var cur_node = this.root;
        do {
            if (cur_node.isLeaf())
                break;
            else
                for (var i = 1; i <= 4; i++) {
                    var child_i = cur_node.get_child(i);
                    if (child_i && child_i.check_coord(coord)) {
                        cur_node = child_i;
                        break;
                    }
                }
        } while (true);
        return cur_node;
    }

    add_CGO(CGO) {
        if (!CGO instanceof CollidableGObject)
            throw "Non-CollidableGObject parameter error";
        if (!this.root) {
            this.root = new CollisionQuadtreeNode(0, 0, this.w, this.h);
            this.root.attach_value(CGO);
        } else {
            var target_node = this.get_quadtree_node(CGO.coord);
            target_node.attach_value(CGO);
            while (target_node.level < max_level - 1 && target_node.values.length > max_node_capacity) {
                target_node.split();
                var no_more_split = false;
                for (var i = 1; i <= 4; i++) {
                    var child_i = target_node.get_child(i);
                    if (child_i.values.length > max_node_capacity) {
                        target_node = child_i;
                        break;
                    } else if (i == 4)
                        no_more_split = true;
                }
                if (no_more_split)
                    break;
            }
        }
        this.count++;
    }

    traverse_and_get_nodes() {
        return CollisionQuadtree.traverse_and_get_nodes_(this.root);
    }

    traverse_and_get_values() {
        return CollisionQuadtree.traverse_and_get_values_(this.root);
    }

    static traverse_and_get_nodes_(node) {
        if (node) {
            if (node.isLeaf()) {
                var res = new Array();
                res.push(node);
                return res;
            } else {
                var nodes = new Array();
                for (var i = 1; i <= 4; i++) {
                    var nodes_i = this.traverse_and_get_nodes_(node.get_child(i));
                    if (nodes_i)
                        for (var j = 0; j < nodes_i.length; j++)
                            nodes.push(nodes_i[j]);
                }
                if (nodes.length > 0)
                    return nodes;
                else
                    return null;
            }
        } else
            return null;
    }

    static traverse_and_get_values_(node) {
        if (node) {
            if (node.isLeaf())
                return node.values;
            else {
                var values = new Array();
                for (var i = 1; i <= 4; i++) {
                    var values_i = this.traverse_and_get_values_(node.get_child(i));
                    if (values_i)
                        for (var j = 0; j < values_i.length; j++)
                            values.push(values_i[j]);
                }
                if (values.length > 0)
                    return values;
                else
                    return null;
            }
        } else
            return null;
    }
}

//---------------------------------------------- Collidable Game Object

class CollidableGObject extends GObject {
    constructor(x, y, w, h, bv, is_prediction) {
        if (!bv instanceof BoundingVolume)
            throw "Non-BoundingVolume parameter error";
        super(x, y, w, h);
        this.CollidableGObject_id = CollidableGObject.get_CollidableGObject_id_generator().get_id();
        CollidableGObject.get_CollidableGObject_instance_array()[this.CollidableGObject_id] = this;
        this.root_bounding_volume = bv;
        this.root_bounding_volume.GObj = this;
        this.root_bounding_volume.parent = null;
        this.CP = CPType.HARD;
        this.collidable = true;
    }

    destroy() {
        CollidableGObject.rm_CollidableGObject_instance_ref(this.CollidableGObject_id);
    }

    move_prediction() {
        if (this.moveVect)
            return new CollidableGObject(this.coord.x + this.moveVect.x, this.coord.y + this.moveVect.y, this.w, this.h, this.root_bounding_volume);
        return new CollidableGObject(this.coord.x, this.coord.y, this.w, this.h, this.root_bounding_volume);
    }

    collides(CGO) {
        if (!CGO instanceof CollidableGObject)
            throw "Non-CollidableGObject parameter error";
        if (this.CP == CPType.HARD && CGO.CP == CPType.HARD) {
            var range = this.root_bounding_volume.Minkowski_add(CGO.root_bounding_volume);
            var ray;
            if (!CGO.moveVect)
                ray = new Ray(CGO.root_bounding_volume.get_center_coordinate(), CGO.moveVect);
            else
                ray = new Ray(CGO.root_bounding_volume.get_center_coordinate(), new Vector(0, 0));
            return range.ray_intersection(ray);
        } else if (this.CP == CPType.PASSIVE || CGO.CP == CPType.PASSIVE)
            return this.root_bounding_volume.check_overlap_with_children(CGO.root_bounding_volume);
    }

    resolve(collision) {
        if (!collision instanceof Collision)
            throw "Non-Collision parameter error";
    }

    static CGO_update_hard_collision() {
        var collision_quad_tree = new CollisionQuadtree(canvas.width, canvas.height);
        var ids = this.get_CollidableGObject_instance_id_array();
        var hard_instances = new Array();
        var actual_length = ids.length;
        for (var i = 0; i < actual_length; i++) {
            var instance_i = this.get_CollidableGObject_instance(ids[i]);
            if (instance_i.collidable && instance_i.CP == CPType.HARD) {
                var next_i = instance_i.move_prediction();
                next_i.instance_index = hard_instances.length;
                collision_quad_tree.add_CGO(next_i);
                hard_instances.push(instance_i);
            }
        }
        var nodes = collision_quad_tree.traverse_and_get_nodes();
        if (nodes) {
            var checked_pairs = new bitmap(passive_instances.length * passive_instances.length);
            var is_checked = function (instance_index_0, instance_index_1) {
                return checked_pairs.get(instance_index_0 * passive_instances.length + instance_index_1);
            }
            var check = function (instance_index_0, instance_index_1) {
                checked_pairs.set(instance_index_0 * passive_instances.length + instance_index_1, true);
                checked_pairs.set(instance_index_1 * passive_instances.length + instance_index_0, true);
            }
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].isLeaf()) {
                    var hard_nexts;
                    if (nodes[i].parent && nodes[i].parent.parent)
                        hard_nexts = CollisionQuadtree.traverse_and_get_values_(nodes[i].parent.parent);
                    else if (nodes[i].parent)
                        hard_nexts = CollisionQuadtree.traverse_and_get_values_(nodes[i].parent);
                    else
                        hard_nexts = nodes[i].values;
                    for (var j = 0; j < hard_nexts.length; j++) {
                        var instance_index_j = hard_nexts[j].instance_index;
                        for (var k = j + 1; k < hard_nexts.length; k++) {
                            var instance_index_k = hard_nexts[k].instance_index;
                            if (!is_checked(instance_index_j, instance_index_k)) {
                                if (hard_nexts[j].collides(hard_nexts[k]))
                                    hard_instances[instance_index_j].resolve(new Collision(null, hard_instances[instance_index_k], CPType.PASSIVE));
                            }
                            check(instance_index_j, instance_index_k);
                        }
                    }
                }
            }
            var nexts = collision_quad_tree.traverse_and_get_values();
            for (var i = nexts.length - 1; i >= 0; i--)
                CollidableGObject.rm_CollidableGObject_instance_ref(nexts.splice(i, 1)[0].CollidableGObject_id);
        }
    }

    static CGO_update_passive_collision() {
        var collision_quad_tree = new CollisionQuadtree(canvas.width, canvas.height);
        var ids = this.get_CollidableGObject_instance_id_array();
        var passive_instances = new Array();
        var actual_length = ids.length;
        for (var i = 0; i < actual_length; i++) {
            var instance_i = this.get_CollidableGObject_instance(ids[i]);
            if (instance_i.collidable && instance_i.CP == CPType.PASSIVE) {
                var next_i = instance_i.move_prediction();
                next_i.instance_index = passive_instances.length;
                collision_quad_tree.add_CGO(next_i);
                passive_instances.push(instance_i);
            }
        }
        var nodes = collision_quad_tree.traverse_and_get_nodes();
        if (nodes) {
            var checked_pairs = new bitmap(passive_instances.length * passive_instances.length);
            var is_checked = function (instance_index_0, instance_index_1) {
                return checked_pairs.get(instance_index_0 * passive_instances.length + instance_index_1);
            }
            var check = function (instance_index_0, instance_index_1) {
                checked_pairs.set(instance_index_0 * passive_instances.length + instance_index_1, true);
                checked_pairs.set(instance_index_1 * passive_instances.length + instance_index_0, true);
            }
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].isLeaf()) {
                    var passive_nexts;
                    if (nodes[i].parent && nodes[i].parent.parent)
                        passive_nexts = CollisionQuadtree.traverse_and_get_values_(nodes[i].parent.parent);
                    else if (nodes[i].parent)
                        passive_nexts = CollisionQuadtree.traverse_and_get_values_(nodes[i].parent);
                    else
                        passive_nexts = nodes[i].values;
                    for (var j = 0; j < passive_nexts.length; j++) {
                        var instance_index_j = passive_nexts[j].instance_index;
                        for (var k = j + 1; k < passive_nexts.length; k++) {
                            var instance_index_k = passive_nexts[k].instance_index;
                            if (!is_checked(instance_index_j, instance_index_k)) {
                                if (passive_nexts[j].collides(passive_nexts[k]))
                                    passive_instances[instance_index_j].resolve(new Collision(null, passive_instances[instance_index_k], CPType.PASSIVE));
                            }
                            check(instance_index_j, instance_index_k);
                        }
                    }
                }
            }
            var nexts = collision_quad_tree.traverse_and_get_values();
            for (var i = nexts.length - 1; i >= 0; i--)
                CollidableGObject.rm_CollidableGObject_instance_ref(nexts.splice(i, 1)[0].CollidableGObject_id);
        }
        /* original naïve exhaustive algorithm 
        var ids = this.get_CollidableGObject_instance_id_array();
        var passive_instances = new Array();
        var passive_nexts = new Array();
        var actual_length = ids.length;
        for (var i = 0; i < actual_length; i++) {
            var instance_i = this.get_CollidableGObject_instance(ids[i]);
            if (instance_i.collidable && instance_i.CP == CPType.PASSIVE) {
                passive_instances.push(instance_i);
                passive_nexts.push(instance_i.move_prediction());
            }
        }
        for (var i = 0; i < passive_nexts.length; i++) {
            for (var j = i + 1; j < passive_nexts.length; j++) {
                if (passive_nexts[i].collides(passive_nexts[j]))
                    passive_instances[j].resolve(new Collision(null, passive_instances[i], CPType.PASSIVE));
            }
            CollidableGObject.rm_CollidableGObject_instance_ref(passive_nexts[i].CollidableGObject_id);
        }*/
    }

    static CGO_update() {
        // this.CGO_update_hard_collision();
        this.CGO_update_passive_collision();
    }

    static get_CollidableGObject_instance(CollidableGObject_id) {
        return this.get_CollidableGObject_instance_array()[CollidableGObject_id];
    }

    static rm_CollidableGObject_instance_ref(CollidableGObject_id) {
        var array = this.get_CollidableGObject_instance_array();
        try {
            super.rm_instance_ref(array[CollidableGObject_id].id);
            array[CollidableGObject_id] = null;
            this.get_CollidableGObject_id_generator().recycle_id(CollidableGObject_id);
        } catch (e) { console.log(e); }
    }

    static get_CollidableGObject_instance_array() {
        if (!this.CollidableGObject_instance_array)
            this.CollidableGObject_instance_array = new Array();
        return this.CollidableGObject_instance_array;
    }

    static get_CollidableGObject_instance_id_array() {
        return this.get_CollidableGObject_id_generator().assigned_ids;
    }

    static get_CollidableGObject_id_generator() {
        if (!this.CollidableGObject_id_generator)
            this.CollidableGObject_id_generator = new IDGenerator(10000);
        return this.CollidableGObject_id_generator;
    }
}

//---------------------------------------------- Asset Management

class Texture {
    constructor(src) {
        var ids = Texture.get_Texture_id_generator().assigned_ids;
        for (var i = 0; i < ids.length; i++) {
            if (Texture.get_Texture_instance(ids[i]).src === src)
                throw "Texture existence error";
        }
        this.Texture_id = Texture.get_Texture_id_generator().get_id();
        Texture.get_Texture_instance_array()[this.Texture_id] = this;
        this.src = src;
        this.image = new Image();
        this.image.src = src;
    }

    static validate_Texture_id(Texture_id) {
        return this.get_Texture_id_generator().validate_id(Texture_id);
    }

    static get_Texture_instance(Texture_id) {
        return this.get_Texture_instance_array()[Texture_id];
    }

    static rm_Texture_instance_ref(Texture_id) {
        this.get_Texture_instance_array()[Texture_id] = null;
        this.get_Texture_id_generator().recycle_id(Texture_id);
    }

    static get_Texture_instance_array() {
        if (!this.Texture_instance_array)
            this.Texture_instance_array = new Array();
        return this.Texture_instance_array;
    }

    static get_Texture_id_generator() {
        if (!this.Texture_id_generator)
            this.Texture_id_generator = new IDGenerator(1000);
        return this.Texture_id_generator;
    }
}

class Text_specs {
    constructor(text, size, font) {
        this.text = text;
        this.size = size;
        this.font = size + "px " + font;
    }
}

//---------------------------------------------- Sprite

class Sprite extends CollidableGObject {
    constructor(x, y, w, h) {
        var bv = new BoundingVolume(0, 0, w, h);
        super(x, y, w, h, bv);
        this.CP = CPType.PASSIVE;
        this.alpha = 1.0;
        this.texture_id = null;
        this.text = null;
        this.decorator = null;
    }

    attach_texture(texture_id) {
        if (!Texture.validate_Texture_id(texture_id))
            throw "Invalid Texture ID error";
        this.texture_id = texture_id;
    }

    attach_text(text) {
        if (!text instanceof Text_specs)
            throw "Non-Text parameter error";
        this.text = text;
    }

    attach_decorator(sub_sprite, x_offset, y_offset) {
        if (!this.decorator) {
            var actual_coord = this.coord.add(new Coordinate(x_offset, y_offset))
            sub_sprite.coord.x = actual_coord.x;
            sub_sprite.coord.y = actual_coord.y;
            this.decorator = sub_sprite;
        } else {
            offset_coord = this.coord.add(new Coordinate(x_offset, y_offset)).subtract(this.decorator.coord);
            this.decorator.attach_decorator(sub_sprite, offset_coord.x, offset_coord.y);
        }
    }

    check_coordinate_with_decorator(coord) {
        if (!coord instanceof Coordinate)
            throw "Non-Coordinate parameter error";
        var this_res = this.root_bounding_volume.check_coordinate(coord);
        if (!this.decorator)
            return this_res;
        else
            return this_res || this.decorator.check_coordinate_with_decorator(coord);
    }

    check_overlap_with_decorator(sprite) {
        if (!sprite instanceof Sprite)
            throw "Non-Sprite parameter error";
        var this_res = this.root_bounding_volume.check_overlap_without_children(sprite.root_bounding_volume);
        if (!this.decorator)
            return this_res;
        else
            return this_res || this.decorator.check_overlap_with_decorator(sprite);
    }

    check_overlap_with_decorator_mutually(sprite) {
        if (!sprite instanceof Sprite)
            throw "Non-Sprite parameter error";
        var this_res = sprite.check_overlap_with_decorator(this);
        if (!this.decorator)
            return this_res;
        else
            return this_res || this.decorator.check_overlap_with_decorator_mutually(sprite);
    }

    move_prediction() {
        if (this.moveVect)
            return new Sprite(this.coord.x + this.moveVect.x, this.coord.y + this.moveVect.y, this.w, this.h);
        return new Sprite(this.coord.x, this.coord.y, this.w, this.h);
    }

    move(vect) {
        super.move(vect);
        if (this.decorator)
            this.decorator.move(vect);
    }

    update() {
        super.update();
        if (this.decorator)
            this.decorator.update();
    }

    draw() {
        super.draw();
        if (this.decorator)
            this.decorator.draw();
    }

    actual_draw() {
        if (this.texture_id) {
            context.globalAlpha = this.alpha;
            context.drawImage(Texture.get_Texture_instance(this.texture_id).image, this.coord.x, this.coord.y, this.w, this.h);
        }
        if (this.text) {
            context.beginPath();
            context.font = this.text.font;
            context.fillStyle = 'black';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(this.text.text, this.coord.x + this.w / 2, this.coord.y + this.h / 2);
        }
    }

    destroy() {
        if (this.decorator)
            this.decorator.destroy();
        super.destroy();
    }

    rotate(offset_coord, rad) {
        super.rotate(offset_coord, rad);
        if (this.decorator)
            this.decorator.rotate(this.coord.subtract(this.decorator.coord).add(offset_coord), rad);
    }

    rotate_cancel() {
        super.rotate_cancel();
        if (this.decorator)
            this.decorator.rotate_cancel();
    }
}

class Colored_Sprite extends Sprite {
    constructor(x, y, w, h, r, g, b, a) {
        super(x, y, w, h);
        this.color = null;
        this.attach_color(r, g, b, a);
    }

    attach_texture(texture_id) { /*Disable texture*/ };

    attach_color(r, g, b, a) {
        if ((0 > r || r > 255) || (0 > g || g > 255) || (0 > b || b > 255) || (0 > a || a > 255))
            throw "Invalid color error";
        this.color = { 'r': r, 'g': g, 'b': b, 'a': a };
    }

    actual_draw() {
        if (this.color) {
            context.beginPath();
            context.fillStyle = "rgba(" + this.color.r + "," + this.color.g + "," + this.color.b + "," + this.color.a + ")";
            context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
        }
        super.actual_draw();
    }
}

//---------------------------------------------- Sprite Sheet

class SpriteSheet extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.rows = 0;
        this.cols = 0;
        this.row_h = 0;
        this.col_w = 0;
        this.row = -1;
        this.col = -1;
        this.update_gap = 1;
        this.last_update_gap = 0;
    }

    attach_texture_sheet(texture_id, width, height, rows, cols, update_gap) {
        if (height % rows != 0 || width % cols != 0)
            throw "Target texture not a sheet error";
        super.attach_texture(texture_id);
        this.rows = rows;
        this.cols = cols;
        this.row_h = height / rows;
        this.col_w = width / cols;
        this.row = 0;
        this.col = 0;
        this.update_gap = update_gap;
        this.last_update_gap = 0;
    }

    change_texture_sheet_row(row) {
        if (this.rows <= row)
            throw "Sheet index out of bounds error";
        this.row = row;
        this.col = 0;
        this.last_update_gap = 0;
    }

    update() {
        super.update();
        this.last_update_gap++;
        if (this.last_update_gap % this.update_frequency == 0) {
            this.col = (this.col + 1) % this.cols;
            this.last_update_gap = 0;
        }
    }

    actual_draw() {
        if (this.rows == 0 || this.cols == 0 || this.row == -1 || this.col == -1) {
            super.actual_draw();
        } else {
            if (this.texture_id) {
                context.globalAlpha = this.alpha;
                context.drawImage(Texture.get_Texture_instance(this.texture_id).image, this.col * this.col_w, this.row * this.row_h, this.col_w, this.row_h, this.coord.x, this.coord.y, this.w, this.h);
            }
            if (this.text) {
                context.beginPath();
                context.font = this.text.font;
                context.fillText(this.text.text, this.coord.x, this.coord.y + Math.round(this.h - (this.h - this.text.size) / 2), this.w);
            }
        }
    }
}

//---------------------------------------------- Grid

class Grid extends CollidableGObject {
    constructor(row, col) {
        var x = 0, y = 0, w = canvas.width, h = canvas.height;
        if (w % col != 0 && h % row != 0)
            throw "Canvas width or height is undivisible by row or col error";
        var cell_w = Math.round(w / col), cell_h = Math.round(h / row);
        super(x, y, w, h, new BoundingVolume(-2 * cell_w, -2 * cell_h, w + 4 * cell_w, h + 4 * cell_h));
        this.row = row;
        this.col = col;
        this.cell_w = cell_w;
        this.cell_h = cell_h;
        this.CP = CPType.PASSIVE;
        this.collidable = true;
        this.movable = false;
        this.visble = false;
        this.root_bounding_volume.attach_child_BoundingVolume(new BoundingVolume(0, -2 * cell_h, w, 2 * cell_h));
        this.root_bounding_volume.attach_child_BoundingVolume(new BoundingVolume(0, h, w, 2 * cell_h));
        this.root_bounding_volume.attach_child_BoundingVolume(new BoundingVolume(-2 * cell_w, 0, 2 * cell_w, h));
        this.root_bounding_volume.attach_child_BoundingVolume(new BoundingVolume(w, 0, 2 * cell_w, h));
        this.grid_sprites = new Array();
    }

    move_prediction() {
        return new Grid(this.row, this.col);
    }

    validate_index(row, col) {
        if (!Utilities.isInteger(row) || !Utilities.isInteger(col))
            throw "Non-integer parameter error";
        if (0 > row || row >= this.row || 0 > col || col >= this.col)
            return false;
        return true;
    }

    index_to_coord(row, col) {
        if (!this.validate_index(row, col))
            throw "Invalid index parameter error";
        return new Coordinate(col * this.cell_w, row * this.cell_h);
    }

    coord_to_index(coord) {
        var c = (coord.x - coord.x % this.cell_w) / this.cell_w;
        var r = (coord.y - coord.y % this.cell_h) / this.cell_h;
        if (!this.validate_index(r, c))
            throw "Invalid index parameter error";
        return { row: r, col: c };
    }
}

//---------------------------------------------- Grid Sprite

class GridSprite extends Sprite {
    constructor(row, col, grid) {
        if (!grid instanceof Grid)
            throw "Non-Grid parameter error";
        var coord = grid.index_to_coord(row, col);
        super(coord.x, coord.y, grid.cell_w, grid.cell_h, new BoundingVolume(0, 0, grid.cell_w, grid.cell_h));
        this.grid = grid;
        this.row = row;
        this.col = col;
        this.delta_row = 0;
        this.delta_col = 0;
        this.CP = CPType.PASSIVE;
        this.alpha = 1.0;
        this.texture_id = null;
        this.text = null;
        this.decorator = null;
    }

    move_prediction() {
        if (this.moveVect) {
            var index = this.grid.coord_to_index(new Coordinate(this.coord.x + this.moveVect.x, this.coord.y + this.moveVect.y));
            return new GridSprite(index.row, index.col, this.grid);
        }
        return new GridSprite(this.row, this.col, this.grid);
    }

    move(direction) {
        if (direction instanceof Vector) {
            var next_coord = this.grid.index_to_coord(this.row += this.delta_row, this.col += this.delta_col).add(direction);
            var next_index = this.grid.coord_to_index(next_coord);
            this.delta_row = next_index.row - this.row;
            this.delta_col = next_index.col - this.col;
        } else if (typeof (direction) == "object") {
            if (this.grid.validate_index(this.row + this.delta_row + direction.row, this.col + this.delta_col + direction.col)) {
                this.delta_row += direction.row;
                this.delta_col += direction.col;
            } else
                throw "Moving out of bounds error";
        } else
            throw "Unknown parameter error";
        this.moveVect = new Vector(this.delta_col * this.grid.cell_w, this.delta_row * this.grid.cell_h);
    }

    update() {
        super.update();
        this.row += this.delta_row;
        this.col += this.delta_col;
        this.delta_row = 0;
        this.delta_col = 0;
    }

    move_to(destination) {
        if (destination instanceof Coordinate) {
            var next_index = this.grid.coord_to_index(destination);
            this.delta_row = next_index.row - this.row;
            this.delta_col = next_index.col - this.col;
        } else if (typeof (destination) == "object") {
            if (this.grid.validate_index(destination.row, destination.col)) {
                this.delta_row = destination.row - this.row;
                this.delta_col = destination.col - this.col;
            }
        } else
            throw "Unknown parameter error";
        this.moveVect = new Vector(this.delta_col * this.grid.cell_w, this.delta_row * this.grid.cell_h);
    }
}

class ColoredGridSprite extends GridSprite {
    constructor(row, col, grid, r, g, b, a) {
        super(row, col, grid);
        this.color = null;
        this.attach_color(r, g, b, a);
    }

    attach_texture(texture_id) { /*Disable texture*/ };

    attach_color(r, g, b, a) {
        if ((0 > r || r > 255) || (0 > g || g > 255) || (0 > b || b > 255) || (0 > a || a > 255))
            throw "Invalid color error";
        this.color = { 'r': r, 'g': g, 'b': b, 'a': a };
    }

    actual_draw() {
        if (this.color) {
            context.beginPath();
            context.fillStyle = "rgba(" + this.color.r + "," + this.color.g + "," + this.color.b + "," + this.color.a + ")";
            context.fillRect(this.coord.x, this.coord.y, this.w, this.h);
        }
        super.actual_draw();
    }
}

//---------------------------------------------- World Node

class WorldNode {
    constructor(sprite) {
        if (!sprite instanceof Sprite)
            throw "Non-Sprite parameter error";
        this.parent = null;
        this.index_at_parent = -1;
        this.children = null;
        this.sprite = sprite;
        this.world = null;
    }

    child_count() {
        if (this.children)
            return this.children.length;
        return 0;
    }

    add_child(node) {
        if (!node instanceof WorldNode)
            throw "Non-WorldNode parameter error";
        if (!this.children)
            this.children = new Array();
        this.children.push(node);
        var index = this.child_count() - 1;
        this.children[index].parent = this;
        this.children[index].index_at_parent = index;
        this.children[index].world = this.world;
        this.world.sprite_count++;
    }

    remove_child(index) {
        if (0 <= index && index < this.child_count()) {
            for (var i = index + 1; i < this.child_count(); i++)
                this.children[i].index_at_parent = i - 1;
            var removed = this.children.splice(index, 1)[0];
            while (removed.child_count() > 0) {
                var queue = this.world.node_queue();
                var node = removed.children.splice(removed.child_count() - 1, 1)[0];
                var sprite = node.sprite;
                var added = false;
                for (var i = queue.length - 1; i >= 0; i--) {
                    var sprite_i = queue[i].sprite;
                    if (sprite.overlap_with_decorator_mutually(sprite_i)) {
                        queue[i].add_child(node);
                        added = true;
                        break;
                    }
                }
                if (!added)
                    this.world.root.add_child(node);
            }
            this.world.sprite_count--;
            return removed;
        }
        return null;
    }
}

//---------------------------------------------- World Tree

class WorldTree extends GObject {
    constructor() {
        super(0, 0, canvas.width, canvas.height);
        this.movable = false;
        this.visble = true;
        this.root = new WorldNode();
        this.root.world = this;
        this.sprite_count = 0;
        this.selected_world_node = null;
    }

    node_queue() {
        var queue = new Array();
        var queue_ = new Array();
        for (var i = 0; i < this.root.child_count(); i++) {
            queue.push(this.root.children[i]);
            queue_.push(this.root.children[i]);
        }
        var node = null;
        while (queue_.length > 0) {
            node = queue_.splice(0, 1)[0];
            for (var i = 0; i < node.child_count(); i++) {
                queue.push(node.children[i]);
                queue_.push(node.children[i]);
            }
        }
        return queue;
    }

    add_sprite(sprite) {
        var new_node = new WorldNode(sprite);
        new_node.world = this;
        if (this.sprite_count == 0) {
            this.root.add_child(new_node);
            return null;
        }
        else {
            var queue = this.node_queue();
            var added = false;
            for (var i = queue.length - 1; i >= 0; i--) {
                if (queue[i].sprite.overlap_with_decorator_mutually(sprite)) {
                    var new_node = new WorldNode(sprite);
                    new_node.world = this;
                    queue[i].add_child(new_node);
                    added = true;
                    return (queue[i]);
                }
            }
            if (!added) {
                this.root.add_child(new_node);
                return null;
            }
        }
    }

    add_node(new_node) {
        new_node.world = this;
        if (this.sprite_count == 0) {
            this.root.add_child(new_node);
            return null;
        }
        else {
            var queue = this.node_queue();
            var added = false;
            for (var i = queue.length - 1; i >= 0; i--) {
                if (queue[i].sprite.overlap_with_decorator_mutually(new_node.sprite)) {
                    queue[i].add_child(new_node);
                    added = true;
                    return (queue[i]);
                }
            }
            if (!added) {
                this.root.add_child(new_node);
                return null;
            }
        }
    }

    update() {
        super.update();
        var queue = this.node_queue();
        while (queue.length > 0) {
            var node = queue.splice(0, 1)[0];
            node.sprite.update();
        }
        if (this.selected_world_node)
            this.selected_world_node.sprite.update();
    }

    draw() {
        var queue = this.node_queue();
        while (queue.length > 0) {
            var node = queue.splice(0, 1)[0];
            node.sprite.draw();
        }
        if (this.selected_world_node)
            this.selected_world_node.sprite.draw();
    }
}

//---------------------------------------------- Input Events

const IEType_total = 12;
const IEType = {
    SELECT: 0,
    DRAG: 1,
    DROP: 2,
    UP: 3,
    DOWN: 4,
    LEFT: 5,
    RIGHT: 6,
    SPACE: 7,
    W: 8,
    S: 9,
    A: 10,
    D: 11
};

class Input_Event {
    constructor(type, coord) {
        this.type = type;
        this.coord = coord;
    }
}

function mouse_coord_within_canvas(e) {
    return new Coordinate(e.clientX - canvas_x, e.clientY - canvas_y);
}

var prev_coord = null;
function onMouseDown(e) {
    prev_coord = mouse_coord_within_canvas(e);
    input_event_subscription_manager.publish_input_event(new Input_Event(IEType.SELECT, prev_coord));
}

function onMouseMove(e) {
    if (prev_coord) {
        var buffer = mouse_coord_within_canvas(e);
        var off_coord = buffer.subtract(prev_coord);
        prev_coord = buffer;
        input_event_subscription_manager.publish_input_event(new Input_Event(IEType.DRAG, off_coord));
    }
}

function onMouseUp(e) {
    var off_coord = mouse_coord_within_canvas(e).subtract(prev_coord);
    prev_coord = null;
    input_event_subscription_manager.publish_input_event(new Input_Event(IEType.DROP, off_coord));
}

function onKeyDown(e) {
    switch (e.keyCode) {
        case 38:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.UP, null));
            break;
        case 40:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.DOWN, null));
            break;
        case 37:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.LEFT, null));
            break;
        case 39:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.RIGHT, null));
            break;
        case 32:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.SPACE, null));
            break;
        case 87:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.W, null));
            break;
        case 83:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.S, null));
            break;
        case 65:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.A, null));
            break;
        case 68:
            input_event_subscription_manager.publish_input_event(new Input_Event(IEType.D, null));
            break;
    }
}

//---------------------------------------------- Input Agent

class InputAgent {
    constructor(iesm) {
        if (!iesm instanceof Input_Event_Subscription_Manager)
            throw "Non-Input_Event_Subscription_Manager parameter error";
        this.iesm = iesm;
    }

    input(type, coord) {
        this.iesm.publish_input_event(new Input_Event(type, coord));
    }
}

//---------------------------------------------- Input Event Subscription Manager

class Input_Event_Subscription_Manager {
    constructor() {
        this.subscribers = new Array();
        this.mutexes = new Array();
        for (var i = 0; i < IEType_total; i++)
            this.mutexes.push(-1);
    }

    get_subscriber_index(s) {
        for (var i = 0; i < this.subscribers.length; i++)
            if (this.subscribers[i] === s)
                return i;
        return -1;
    }

    validate_subscriber_index(index) {
        return (0 <= index && index < this.subscribers.length) ? true : false;
    }

    add_subscriber(s) {
        if (this.get_subscriber_index(s) == -1) {
            this.subscribers.push(s);
            return this.subscribers.length - 1;
        }
        return -1;
    }

    remove_subscriber(si) {
        if (this.validate_subscriber_index(si)) {
            this.subscribers.splice(si, 1);
            return true;
        }
        return false;
    }

    publish_input_event(event) {
        for (var i = 0; i < this.subscribers.length; i++)
            if (this.mutexes[event.type] == -1 || this.mutexes[event.type] == i)
                this.subscribers[i].handle_input_event(event);
            else
                break;
    }

    set_exclusive(si, type) {
        if (si == -1)
            throw "Invalid subscriber index";
        if (this.mutexes[type] == -1)
            this.mutexes[type] = si;
        else if (this.mutexes[type] != si)
            throw "Mutex already locked error";
    }

    release_exclusive(si, type) {
        if (si == -1)
            throw "Invalid subscriber index";
        if (this.mutexes[type] == si)
            this.mutexes[type] = -1;
        else if (this.mutexes[type] != si)
            throw "Mutex not locked or not in subscriber's possession error";
    }

    set_full_exclusive(si) {
        for (var i = 0; i < IEType_total; i++) {
            if (!(this.mutexes[i] == -1 || this.mutexes[i] == si))
                throw "Mutex(es) already locked error";
        }
        for (var i = 0; i < IEType_total; i++)
            this.set_exclusive(si, i);
    }

    release_full_exclusive(si) {
        for (var i = 0; i < IEType_total; i++) {
            if (!(this.mutexes[i] == si || this.mutexes[i] == -1))
                throw "Mutex not locked or not in subscriber's possession error";
        }
        for (var i = 0; i < IEType_total; i++)
            this.release_exclusive(si, i);
    }
}

//---------------------------------------------- Scene Graph Node

class SceneGraphNode extends GObject {
    constructor() {
        super(0, 0, 0, 0);
        this.coord = null;
        this.w = null;
        this.h = null;
        this.content = null;
        this.children = null;
        this.name = "";
    }

    attach_content(content) {
        if (!content instanceof GObject)
            throw "Non-GObject parameter error";
        if (!this.content)
            this.content = content;
        else {
            var contentSGNode = new SceneGraphNode();
            contentSGNode.attach_content(content);
            this.attach_child(contentSGNode);
        }
    }

    attach_child(SGNode) {
        if (!SGNode instanceof SceneGraphNode)
            throw "Non-SceneGraphNode parameter error";
        if (!this.children) {
            this.children = new Array();
            if (this.content) {
                var contentSGNode = new SceneGraphNode();
                contentSGNode.attach_content(this.content);
                this.children.push(contentSGNode);
                this.content = null;
            }
        }
        this.children.push(SGNode);
    }

    assign_name(name) {
        if (typeof name !== 'string')
            throw "Non-String parameter error";
        if (!this.get_child_by_name(name))
            this.name = name;
    }

    get_child_by_name(name) {
        if (typeof name !== 'string')
            throw "Non-String parameter error";
        if (!this.children) {
            if (Utilities.string_compare(this.name, name))
                return this;
            return null
        }
        for (var i = 0; i < this.children.length; i++) {
            var res = this.children[i].get_child_by_name(name);
            if (res)
                return res;
        }
        return null;
    }

    move(vect) {
        if (!this.movable)
            return;
        if (this.content)
            this.content.move(vect);
        else if (this.children)
            for (var i = 0; i < this.children.length; i++)
                this.children[i].move(vect);
    }

    move_to(coord) {
        if (!this.movable)
            return;
        if (this.content)
            this.content.move_to(coord);
        else if (this.children)
            for (var i = 0; i < this.children.length; i++)
                this.children[i].move_to(coord);
    }

    update() {
        if (this.content)
            this.content.update();
        else if (this.children)
            for (var i = 0; i < this.children.length; i++)
                this.children[i].update();
    }

    actual_draw() {
        if (!this.visble)
            return;
        if (this.content)
            this.content.draw();
        else if (this.children)
            for (var i = 0; i < this.children.length; i++)
                this.children[i].draw();
    }

    destroy() {
        if (this.content) {
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

//---------------------------------------------- Scene Graph

class SceneGraph extends GObject {
    constructor() {
        super(0, 0, 0, 0);
        this.coord = null;
        this.w = null;
        this.h = null;
        this.root = new SceneGraphNode();
    }

    get_node_by_name(name) {
        return this.root.get_child_by_name(name);
    }

    move(vect) {
        if (!this.movable)
            return;
        this.root.move(vect);
    }

    move_to(coord) {
        if (!this.movable)
            return;
        this.root.move_to(vect);
    }

    update() {
        this.root.update();
    }

    actual_draw() {
        if (!this.visble)
            return;
        this.root.draw();
    }

    destroy() {
        this.root.destroy();
        super.destroy();
    }
}

//---------------------------------------------- Particel System

class Particle extends Sprite {
    constructor(x, y, v_x, v_y, pm) {
        if (!pm instanceof ParticleManager)
            throw "Non-ParticleManager parameter error";
        super(x, y, pm.pw, pm.ph);
        this.speed = new Vector(v_x, v_y);
        this.pm = pm;
        this.recycle = false;
    }

    update() {
        this.move(this.speed);
        super.update();
        if (this.recyclable()) {
            this.visble = false;
            this.collidable = false;
            this.recycle = true;
        }
    }

    recyclable() {
        if (-this.w > this.coord.x || this.coord.x > canvas.width || -this.h > this.coord.y || this.coord.y > canvas.height)
            return true;
        return false;
    }

    assign_properties(x, y, v_x, v_y) {
        this.coord.x = x;
        this.coord.y = y;
        this.speed.x = v_x;
        this.speed.y = v_y;
        this.visble = true;
        this.collidable = true;
        this.recycle = false;
    }
}

class ParticleManager {
    constructor(total, pw, ph) {
        if (typeof total != 'number' || typeof pw != 'number' || typeof ph != 'number')
            throw "Non-ParticleManager parameter error";
        this.total = total;
        this.pw = pw;
        this.ph = ph;
        this.passive_particles = new Array();
        this.active_particles = new Array();
    }

    init() {
        for (var i = 0; i < this.total; i++) {
            var p = new Particle(0, 0, 0, 0, this);
            p.visble = false;
            p.collidable = false;
            p.recycle = true;
            this.passive_particles.push(p);
        }
    }

    recycle() {
        for (var i = this.active_particles.length - 1; i >= 0; i--) {
            var p = this.active_particles.splice(i, 1)[0];
            p.visble = false;
            p.collidable = false;
            p.recycle = true;
            this.passive_particles.push(p);
        }
    }

    destroy() {
        for (var i = this.active_particles.length - 1; i >= 0; i--) {
            var p = this.active_particles.splice(i, 1)[0];
            p.destroy();
        }
        for (var i = this.passive_particles.length - 1; i >= 0; i--) {
            var p = this.passive_particles.splice(i, 1)[0];
            p.destroy();
        }
    }

    utilize_particle(x, y, v_x, v_y) {
        if (this.passive_particles.length < 0)
            throw "Particle pool dry out error";
        var p = this.passive_particles.splice(0, 1)[0];
        p.assign_properties(x, y, v_x, v_y);
        this.active_particles.push(p);
        return p;
    }

    update() {
        for (var i = this.active_particles.length - 1; i >= 0; i--) {
            if (this.active_particles[i].recycle) {
                this.passive_particles.push(this.active_particles.splice(i, 1)[0]);
                continue;
            }
            this.active_particles[i].update();
            if (this.active_particles[i].recycle)
                this.passive_particles.push(this.active_particles.splice(i, 1)[0]);
        }
    }

    draw() {
        for (var i = this.active_particles.length - 1; i >= 0; i--)
            this.active_particles[i].draw();
    }
}

//---------------------------------------------- Networking

class NetworkAgent {
    constructor(id, key) {
        this.peer = new Peer(id, { 'key': key });
        this.connection = null;
        this.data_queue = new Array();
    }

    connect(id, callback) {
        this.connection = this.peer.connect(id);
        var t = this;
        this.connection.on('data', function (data) {
            if (data !== "acknowledged")
                t.connection.send("acknowledged");
            callback(data);
            if (data.class)
                t.data_queue.push(data);
        });
    }

    receive_connection(callback) {
        var t = this;
        this.peer.on('connection', function (connection) {
            t.connection = connection;
            t.connection.on('open', function () { t.connection.send("connection received"); });
            t.connection.on('data', function (data) {
                if (data !== "acknowledged")
                    t.connection.send("acknowledged");
                callback(data);
                if (data.class)
                    t.data_queue.push(data);
            });
        })
    }

    send(message) {
        if (this.connection)
            this.connection.send(message);
    }

    destroy() {
        this.peer.destroy();
    }
}