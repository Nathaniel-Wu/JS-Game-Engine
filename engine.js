var canvas;
var canvas_x;
var canvas_y;
var context;
var input_event_subscription_manager;

//---------------------------------------------- Initialization

function init_canvas_and_context() {
    canvas = document.getElementById("canvas");
    canvas_x = canvas.getBoundingClientRect().left;
    canvas_y = canvas.getBoundingClientRect().top;
    context = canvas.getContext("2d");
}

function init_input_listeners() {
    input_event_subscription_manager = new Input_Event_Subscription_Manager();
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
}

function init_engine() {
    init_canvas_and_context();
    init_input_listeners();
}

//---------------------------------------------- Utilities

function string_compare(str_1, str_2) {
    return str_1 < str_2 ? false : (str_1 > str_2 ? false : true);
}

function isInteger(num) {
    if (num === parseInt(num, 10))
        return true;
    return false;
}

//---------------------------------------------- Asset Management

var textures = new Array();

function Texture(src) {
    this.src = src;
    this.image = new Image();
    this.image.src = src;
    return this;
}

function add_texture(src) {
    for (var i = 0; i < textures.length; i++)
        if (string_compare(textures[i].src, src))
            return -1;
    textures.push(new Texture(src));
    return textures.length - 1;//returns the new texture's index;
}

function validate_texture_index(index) {
    if (isInteger(index) && 0 <= index && index < textures.length)
        return true;
    return false;
}

function Text(text, size, font) {
    this.text = text;
    this.size = size;
    this.font = size + "px " + font;
    return this;
}

//---------------------------------------------- Coordinate

function Coordinate(x, y) {
    if (isInteger(x) && isInteger(y)) {
        this.x = x;
        this.y = y;
        return this;
    }
    return null;
}

Coordinate.prototype.copy = function () {
    return new Coordinate(this.x, this.y);
}

Coordinate.prototype.subtract = function (coord) {
    return new Coordinate(this.x - coord.x, this.y - coord.y);
}

Coordinate.prototype.add = function (coord) {
    return new Coordinate(this.x + coord.x, this.y + coord.y);
}

Coordinate.prototype.scale = function (scaler) {
    return new Coordinate(Math.round(this.x * scaler), Math.round(this.y * scaler));
}

//---------------------------------------------- Sprite

function Sprite(x, y, w, h) {
    if (!canvas)
        return null;
    this.coord = new Coordinate(x, y);
    if (this.coord && isInteger(w) && isInteger(h)) {
        this.w = w;
        this.h = h;
        this.x_offset = Math.round(w / 2);
        this.y_offset = Math.round(h / 2);
        this.max_in_canvas_x = (canvas.width - w > 0) ? (canvas.width - w) : 0;
        this.max_in_canvas_y = (canvas.height - h > 0) ? (canvas.height - h) : 0;
        this.bound = { left_upper: new Coordinate(x, y), right_lower: new Coordinate(x + w, y + h) };

        this.alpha = 1.0;
        this.texture = -1;
        this.text = null;
        this.decorator = null;
        this.out_of_canvas = true;
        return this;
    }
    return null;
}

Sprite.prototype.get_allowed_coord = function (coord) {
    var coord_ = coord.copy();
    if (!this.out_of_canvas) {
        if (coord_.x < 0)
            coord_.x = 0;
        if (coord_.x > this.max_in_canvas_x)
            coord_.x = this.max_in_canvas_x;
        if (coord_.y < 0)
            coord_.y = 0;
        if (coord_.y > this.max_in_canvas_y)
            coord_.y = this.max_in_canvas_y;
    }
    return coord_;
}

Sprite.prototype.attach_texture = function (texture_index) {
    if (validate_texture_index(texture_index)) {
        this.texture = texture_index;
        return true;
    }
    return false;
}

Sprite.prototype.attach_text = function (text) {
    this.text = text;
}

Sprite.prototype.attach_decorator = function (sub_sprite, x_offset, y_offset) {
    if (!this.decorator) {
        sub_sprite.move_to(this.coord.add(new Coordinate(x_offset, y_offset)));
        this.decorator = sub_sprite;
    } else {
        offset_coord = this.coord.add(new Coordinate(x_offset, y_offset)).subtract(this.decorator.coord);
        this.decorator.attach_decorator(sub_sprite, offset_coord.x, offset_coord.y);
    }
}

Sprite.prototype.covers_coord = function (coord) {
    if (this.bound.left_upper.x && coord.x <= this.bound.right_lower.x && this.bound.left_upper.y <= coord.y && coord.y <= this.bound.right_lower.y)
        return true;
    return false;
}

Sprite.prototype.covers_coord_with_decorator = function (coord) {
    if (!this.decorator)
        return this.covers_coord(coord);
    else
        return this.decorator.covers_coord_with_decorator(coord);
}

Sprite.prototype.overlap = function (sprite) {
    var res = true;
    if ((this.bound.left_upper.x > sprite.bound.right_lower.x || sprite.bound.left_upper.x > this.bound.right_lower.x) || (this.bound.left_upper.y > sprite.bound.right_lower.y || sprite.bound.left_upper.y > this.bound.right_lower.y))
        res = false;
    return res;
}

Sprite.prototype.overlap_with_decorator = function (sprite) {
    if (!this.decorator)
        return this.overlap(sprite);
    else
        return this.decorator.overlap_with_decorator(sprite);
}

Sprite.prototype.overlap_with_decorator_mutually = function (sprite) {
    if (!this.decorator)
        return sprite.overlap_with_decorator(this);
    else
        return this.decorator.overlap_with_decorator_mutually(sprite);
}

Sprite.prototype.move = function (offset_coord) {
    this.coord = this.coord.add(offset_coord);
    var lu = this.bound.left_upper.copy();
    var rl = this.bound.right_lower.copy();
    this.bound = { left_upper: lu.add(offset_coord), right_lower: rl.add(offset_coord) };
    if (this.decorator)
        this.decorator.move(offset_coord);
}

Sprite.prototype.move_to = function (coord) {
    var offset_coord = coord.subtract(this.coord);
    this.move(offset_coord);
}

Sprite.prototype.draw = function () {
    if (this.texture!=-1) {
        context.globalAlpha = this.alpha;
        context.drawImage(textures[this.texture].image, this.coord.x, this.coord.y, this.w, this.h);
    }
    if (this.text) {
        context.font = this.text.font;
        context.fillText(this.text.text, this.coord.x, Math.round(this.coord.y + (this.h - this.text.size) / 2), this.w);
        context.beginPath();
    }
    if (this.decorator)
        this.decorator.draw();
}

//---------------------------------------------- World Node

function WorldNode(sprite) {
    this.parent = null;
    this.index_at_parent = -1;
    this.children = null;
    this.sprite = sprite;
    this.world = null;
    return this;
}

WorldNode.prototype.child_count = function () {
    if (this.children)
        return this.children.length;
    return 0;
}

WorldNode.prototype.add_child = function (node) {
    if (!this.children)
        this.children = new Array();
    this.children.push(node);
    var index = this.child_count() - 1;
    this.children[index].parent = this;
    this.children[index].index_at_parent = index;
    this.children[index].world = this.world;
    this.world.sprite_count++;
}

WorldNode.prototype.remove_child = function (index) {
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

//---------------------------------------------- World Tree

function World() {
    this.root = new WorldNode(null);
    this.root.world = this;
    this.sprite_count = 0;
    this.selected_world_node = null;
    return this;
}

World.prototype.node_queue = function () {
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

World.prototype.add_sprite = function (sprite) {
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

World.prototype.add_node = function (new_node) {
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

World.prototype.draw = function () {
    var queue = this.node_queue();
    while (queue.length > 0) {
        node = queue.splice(0, 1)[0];
        node.sprite.draw();
    }
    if (this.selected_world_node)
        this.selected_world_node.sprite.draw();
}

//---------------------------------------------- Input Events

var Input_Event_Type = {
    SELECT: 0,
    DRAG: 1,
    DROP: 2
};

function Input_Event(type, coord) {
    this.type = type;
    this.coord = coord;
    return this;
}

function mouse_coord_within_canvas(e) {
    return new Coordinate(e.clientX - canvas_x, e.clientY - canvas_y);
}

var prev_coord = null;
function onMouseDown(e) {
    prev_coord = mouse_coord_within_canvas(e);
    input_event_subscription_manager.publish_input_event(new Input_Event(Input_Event_Type.SELECT, prev_coord));
}

function onMouseMove(e) {
    if (prev_coord) {
        var buffer = mouse_coord_within_canvas(e);
        var off_coord = buffer.subtract(prev_coord);
        prev_coord = buffer;
        input_event_subscription_manager.publish_input_event(new Input_Event(Input_Event_Type.DRAG, off_coord));
    }
}

function onMouseUp(e) {
    var off_coord = mouse_coord_within_canvas(e).subtract(prev_coord);
    prev_coord = null;
    input_event_subscription_manager.publish_input_event(new Input_Event(Input_Event_Type.DROP, off_coord));
}

//---------------------------------------------- Input Event Subscription Manager

function Input_Event_Subscription_Manager() {
    this.subscribers = new Array();
    this.mutexes = { SELECT: -1, DRAG: -1, DROP: -1 };
    return this;
}

Input_Event_Subscription_Manager.prototype.get_subscriber_index = function (s) {
    for (var i = 0; i < this.subscribers.length; i++)
        if (this.subscribers[i] === s)
            return i;
    return -1;
}

Input_Event_Subscription_Manager.prototype.validate_subscriber_index = function (index) {
    return (0 <= index && index < this.subscribers.length) ? true : false;
}

Input_Event_Subscription_Manager.prototype.add_subscriber = function (s) {
    if (this.get_subscriber_index(s) == -1) {
        this.subscribers.push(s);
        return this.subscribers.length - 1;
    }
    return -1;
}

Input_Event_Subscription_Manager.prototype.remove_subscriber = function (si) {
    if (this.validate_subscriber_index(si)) {
        this.subscribers.splice(si, 1);
        return true;
    }
    return false;
}

Input_Event_Subscription_Manager.prototype.publish_input_event = function (event) {
    switch (event.type) {
        case Input_Event_Type.SELECT: {
            for (var i = 0; i < this.subscribers.length; i++)
                if (this.mutexes.SELECT == -1 || this.mutexes.SELECT == i)
                    this.subscribers[i].handle_input_event(event);
                else
                    break;
            break;
        }
        case Input_Event_Type.DRAG: {
            for (var i = 0; i < this.subscribers.length; i++)
                if (this.mutexes.DRAG == -1 || this.mutexes.DRAG == i)
                    this.subscribers[i].handle_input_event(event);
                else
                    break;
            break;
        }
        case Input_Event_Type.DROP: {
            for (var i = 0; i < this.subscribers.length; i++)
                if (this.mutexes.DROP == -1 || this.mutexes.DROP == i)
                    this.subscribers[i].handle_input_event(event);
                else
                    break;
            break;
        }
    }
}

Input_Event_Subscription_Manager.prototype.set_exclusive = function (si, type) {
    if (si != -1) {
        switch (type) {
            case Input_Event_Type.SELECT: {
                if (this.mutexes.SELECT == -1) {
                    this.mutexes.SELECT = si;
                    return true;
                } else if (this.mutexes.SELECT == si)
                    return true;
                break;
            }
            case Input_Event_Type.DRAG: {
                if (this.mutexes.DRAG == -1) {
                    this.mutexes.DRAG = si;
                    return true;
                } else if (this.mutexes.DRAG == si)
                    return true;
                break;
            }
            case Input_Event_Type.DROP: {
                if (this.mutexes.DROP == -1) {
                    this.mutexes.DROP = si;
                    return true;
                } else if (this.mutexes.DROP == si)
                    return true;
                break;
            }
        }
    }
    return false;
}

Input_Event_Subscription_Manager.prototype.release_exclusive = function (si, type) {
    if (si != -1) {
        switch (type) {
            case Input_Event_Type.SELECT: {
                if (this.mutexes.SELECT == si) {
                    this.mutexes.SELECT = -1;
                    return true;
                }
                break;
            }
            case Input_Event_Type.DRAG: {
                if (this.mutexes.DRAG == si) {
                    this.mutexes.DRAG = -1;
                    return true;
                }
                break;
            }
            case Input_Event_Type.DROP: {
                if (this.mutexes.DROP == si) {
                    this.mutexes.DROP = -1;
                    return true;
                }
                break;
            }
        }
    }
    return false;
}

Input_Event_Subscription_Manager.prototype.set_full_exclusive = function (si) {
    if ((this.mutexes.SELECT == -1 || this.mutexes.SELECT == si) && (this.mutexes.DRAG == -1 || this.mutexes.DRAG == si) && (this.mutexes.DROP == -1 || this.mutexes.DROP == si)) {
        if (this.set_exclusive(si, Input_Event_Type.SELECT) && this.set_exclusive(si, Input_Event_Type.DRAG) && this.set_exclusive(si, Input_Event_Type.DROP))
            return true;
        this.release_exclusive(si, Input_Event_Type.SELECT);
        this.release_exclusive(si, Input_Event_Type.DRAG);
        this.release_exclusive(si, Input_Event_Type.DROP);
    }
    return false;
}

Input_Event_Subscription_Manager.prototype.release_full_exclusive = function (si) {
    if ((this.mutexes.SELECT == si || this.mutexes.SELECT == -1) && (this.mutexes.DRAG == si || this.mutexes.DRAG == -1) && (this.mutexes.DROP == si || this.mutexes.DROP == -1)) {
        if (this.release_exclusive(si, Input_Event_Type.SELECT) && this.release_exclusive(si, Input_Event_Type.DRAG) && this.release_exclusive(si, Input_Event_Type.DROP))
            return true;
        this.set_exclusive(si, Input_Event_Type.SELECT);
        this.set_exclusive(si, Input_Event_Type.DRAG);
        this.set_exclusive(si, Input_Event_Type.DROP);
    }
    return false;
}