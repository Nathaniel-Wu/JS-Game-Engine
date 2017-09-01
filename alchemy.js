var canvas = document.getElementById("canvas");
var canvas_x = canvas.getBoundingClientRect().left;
var canvas_y = canvas.getBoundingClientRect().top;
var context = canvas.getContext("2d");
var playground_width = canvas.width * 0.8;
var sidebar_width = canvas.width - playground_width;

//---------------------------------------------- Element

var names = new Array();
var sources = new Array();
var elements = new Array();

function string_compare(str_1, str_2) {
    return (str_1 < str_2 ? false : (str_1 > str_2 ? false : true));
}

function look_up_name(name) {
    for (var i = 0; i < names.length; i++)
        if (string_compare(names[i], name))
            return i;
    return -1;
}

function look_up_source(source) {
    for (var i = 0; i < sources.length; i++)
        if (string_compare(sources[i], source))
            return i;
    return -1;
}

function Element(name_index, source_index) {
    this.ni = name_index;
    this.si = name_index;
    return this;
}

function create_element(name, source) {
    var ni = look_up_name(name);
    if (ni == -1) {
        ni = names.length;
        names.push(name);
        var si = look_up_source(source);
        if (si == -1) {
            si = sources.length;
            sources.push(source);
        }
        elements.push(new Element(ni, si));
        return true;
    }
    return false;
}

function look_up_element(name) {
    for (var i = 0; i < elements.length; i++)
        if (string_compare(names[elements[i].ni], name))
            return i;
    return -1;
}

//---------------------------------------------- Rule Set

var rule_set = new Array();

function Rule(component_index_1, component_index_2, result_index) {
    this.comp_1 = component_index_1;
    this.comp_2 = component_index_2;
    this.result = result_index;
}

function create_rule(component_name_1, component_name_2, result_name) {
    var comp_1 = look_up_element(component_name_1);
    if (comp_1 != -1) {
        var comp_2 = look_up_element(component_name_2);
        if (comp_2 != -1) {
            var result = look_up_element(result_name);
            if (result != -1) {
                rule_set.push(new Rule(comp_1, comp_2, result));
                return true;
            }
        }
    }
    return false;
}

function seek_result_name(component_name_1, component_name_2) {
    for (var i = 0; i < rule_set.length; i++) {
        var rule_comp_1 = names[elements[rule_set[i].comp_1].ni];
        var rule_comp_2 = names[elements[rule_set[i].comp_2].ni];
        if ((string_compare(rule_comp_1, component_name_1) && string_compare(rule_comp_2, component_name_2)) || (string_compare(rule_comp_1, component_name_2) && string_compare(rule_comp_2, component_name_1)))
            return names[elements[rule_set[i].result].ni];
    }
    return null;
}

//---------------------------------------------- Sprite

var sprite_size = 50;
var half_sprite_size = sprite_size / 2;
var min_x = half_sprite_size;
var max_x = canvas.width - half_sprite_size;
var min_y = half_sprite_size;
var max_y = canvas.height - half_sprite_size;

function Sprite(x, y, w, h, source_index, element_index) {
    this.X = x;
    this.Y = y;
    this.image = new Image();
    this.image.width = w;
    this.image.height = h;
    this.image.src = sources[source_index];
    this.ei = element_index;
    this.priority = 0;
    this.alpha = 1;
    return this;
}

var sprites = new Array();

function allowable_x(x) {
    if (x < min_x)
        return min_x;
    if (x > max_x)
        return max_x;
    return x;
}

function allowable_y(y) {
    if (y < min_y)
        return min_y;
    if (y > max_y)
        return max_y;
    return y;
}

function create_sprite(name, x, y) {
    var ei = look_up_element(name);
    if (ei != -1) {
        sprites.push(new Sprite(allowable_x(x), allowable_y(y), sprite_size, sprite_size, elements[ei].si, ei));
        return true;
    }
    return false;
}

function check_overlap_without_priority(sprite_index) {
    var luX = sprites[sprite_index].X - sprites[sprite_index].image.width / 2;
    var luY = sprites[sprite_index].Y - sprites[sprite_index].image.height / 2;
    var rlX = sprites[sprite_index].X + sprites[sprite_index].image.width / 2;
    var rlY = sprites[sprite_index].Y + sprites[sprite_index].image.height / 2;
    var luX_, luY_, rlX_, rlY_;
    for (var i = 0; i < sprites.length; i++) {
        if (i == sprite_index)
            continue;
        luX_ = sprites[i].X - sprites[i].image.width / 2;
        luY_ = sprites[i].Y - sprites[i].image.height / 2;
        rlX_ = sprites[i].X + sprites[i].image.width / 2;
        rlY_ = sprites[i].Y + sprites[i].image.height / 2;
        if ((luX > rlX_ || luX_ > rlX) || (luY > rlY_ || luY_ > rlY))
            continue;
        return true;
    }
    return false;
}

function reassign_sprite_priorities() {
    priorities = new Array();
    for (var i = 0; i < sprites.length; i++)
        if (!check_overlap_without_priority(i))
            sprites[i].priority = 0;
    for (var i = 0; i < sprites.length; i++) {
        var priority_exists = false;
        var insert_after = -1;
        for (var j = 0; j < priorities.length; j++) {
            if (priorities[j] == sprites[i].priority) {
                priority_exists = true;
                break;
            }
            if (sprites[i].priority > priorities[j])
                insert_after = j;
        }
        if (!priority_exists) {
            switch (insert_after) {
                case -1:
                    priorities.unshift(sprites[i].priority);
                    break;
                case priorities.length - 1:
                    priorities.push(sprites[i].priority);
                    break;
                default:
                    priorities.splice(insert_after + 1, 0, sprites[i].priority);
            }
        }
    }
    for (var i = 0; i < sprites.length; i++) {
        for (var j = 0; j < priorities.length; j++)
            if (sprites[i].priority == priorities[j]) {
                sprites[i].priority = j;
                break;
            }
    }
}

function remove_sprite(sprite_index) {
    if (sprite_index < sprites.length) {
        sprites.splice(sprite_index, 1);
        return true;
    }
    return false;
}

function check_sprite_at(x, y) {
    var lowest_priority = -1;
    var res = -1;
    for (var i = 0; i < sprites.length; i++) {
        if (Math.abs(x - sprites[i].X) <= sprites[i].image.width / 2 && Math.abs(y - sprites[i].Y) <= sprites[i].image.height / 2)
            if (lowest_priority == -1 || sprites[i].priority < lowest_priority) {
                res = i;
                lowest_priority = sprites[i].priority;
            }
    }
    return res;
}

function check_overlap_with_priority(sprite_index) {
    var luX = sprites[sprite_index].X - sprites[sprite_index].image.width / 2;
    var luY = sprites[sprite_index].Y - sprites[sprite_index].image.height / 2;
    var rlX = sprites[sprite_index].X + sprites[sprite_index].image.width / 2;
    var rlY = sprites[sprite_index].Y + sprites[sprite_index].image.height / 2;
    var luX_, luY_, rlX_, rlY_;
    var lowest_priority = sprites[sprite_index].priority;
    var index_of_lowest_prioritized_sprite = -1;
    for (var i = 0; i < sprites.length; i++) {
        if (i == sprite_index || sprites[i].priority < sprites[sprite_index].priority)
            continue;
        luX_ = sprites[i].X - sprites[i].image.width / 2;
        luY_ = sprites[i].Y - sprites[i].image.height / 2;
        rlX_ = sprites[i].X + sprites[i].image.width / 2;
        rlY_ = sprites[i].Y + sprites[i].image.height / 2;
        if ((luX > rlX_ || luX_ > rlX) || (luY > rlY_ || luY_ > rlY))
            continue;
        sprites[i].priority++;
        check_overlap_with_priority(i);
        if (lowest_priority == sprites[sprite_index].priority || sprites[i].priority < lowest_priority) {
            lowest_priority = sprites[i].priority;
            index_of_lowest_prioritized_sprite = i;
        }
    }
    return index_of_lowest_prioritized_sprite;
}

function move_sprite(sprite_index, x, y) {
    sprites[sprite_index].X = allowable_x(sprites[sprite_index].X + x);
    sprites[sprite_index].Y = allowable_y(sprites[sprite_index].Y + y);
}

function draw_sprite(sprite_index) {
    context.globalAlpha = sprites[sprite_index].alpha;
    context.drawImage(sprites[sprite_index].image, sprites[sprite_index].X - half_sprite_size, sprites[sprite_index].Y - half_sprite_size, sprites[sprite_index].image.width, sprites[sprite_index].image.height);
}

//---------------------------------------------- Menu

var menu_items = new Array();

var top_menu_item_Y = 0;
var margin_between_menu_items = 5;
var menu_font = "20px Helvetica";
var menu_font_size = 20;

function Menu_Item(element_name) {
    var ei = look_up_element(element_name);
    this.ei = ei;
    this.image = new Image();
    this.image.width = sprite_size;
    this.image.height = sprite_size;
    this.image.src = sources[elements[ei].si];
    return this;
}

function look_up_menu_item(element_name) {
    for (var i = 0; i < menu_items.length; i++)
        if (string_compare(names[elements[menu_items[i].ei].ni], element_name))
            return i;
    return -1;
}

function create_menu_item(element_name) {
    if (look_up_menu_item(element_name) == -1) {
        menu_items.push(new Menu_Item(element_name));
        return true;
    }
    return false;
}

function draw_menu_item(menu_index) {
    var Y = top_menu_item_Y + menu_index * (sprite_size + margin_between_menu_items);
    if (0 - sprite_size <= Y || Y <= canvas.height) {
        context.drawImage(menu_items[menu_index].image, playground_width, Y, sprite_size, sprite_size);
        context.font = menu_font;
        context.fillText(names[elements[menu_items[menu_index].ei].ni], playground_width + sprite_size + margin_between_menu_items, Y + (sprite_size - menu_font_size) / 2);
        context.beginPath();
        context.lineWidth = "1";
        context.strokeStyle = "grey";
        context.moveTo(playground_width, Y + sprite_size + 3);
        context.lineTo(canvas.width, Y + sprite_size + 3);
        context.stroke();
    }
}

function get_menu_index(Y) {
    var leftover = (Y - top_menu_item_Y) % (sprite_size + margin_between_menu_items);
    var index = (Y - top_menu_item_Y - leftover) / (sprite_size + margin_between_menu_items);
    if (leftover > sprite_size || index >= menu_items.length)
        index = -1;
    return index;
}

//---------------------------------------------- Mouse Events

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);

var selected_sprite = -1;
var prev_X = -1;
var prev_Y = -1;

var mouse_state = 0;
var delta_X = 0;
var delta_Y = 0;
var overlapped_sprite_index_1 = -1;
var overlapped_sprite_index_2 = -1;

var sprite_to_create;
var sprite_creation_X = -1;
var sprite_creation_Y = -1;

function mouse_pos_within_canvas(e) {
    this.X = e.clientX - canvas_x;
    this.Y = e.clientY - canvas_y;
    return this;
}

function onMouseDown(e) {
    pos = new mouse_pos_within_canvas(e);
    if (pos.X <= playground_width) {
        overlapped_sprite_index_1 = -1;
        overlapped_sprite_index_2 = -1;
        selected_sprite = check_sprite_at(pos.X, pos.Y);
        if (selected_sprite != -1) {
            mouse_state = 1;
            prev_X = pos.X;
            prev_Y = pos.Y;
        } else
            mouse_state = 0;
    } else {
        var mi = get_menu_index(pos.Y);
        if (mi != -1) {
            mouse_state = 4;
            sprite_to_create = names[elements[menu_items[mi].ei].ni];
            sprite_creation_X = pos.X;
            sprite_creation_Y = pos.Y;
            prev_X = pos.X;
            prev_Y = pos.Y;
        } else
            mouse_state = 0;
    }
}

function onMouseMove(e) {
    if (mouse_state == 2 || mouse_state == 1) {
        mouse_state = 2;
        pos = new mouse_pos_within_canvas(e);
        delta_X += pos.X - prev_X;
        delta_Y += pos.Y - prev_Y;
        prev_X = pos.X;
        prev_Y = pos.Y;
    }
}

function onMouseUp(e) {
    if (mouse_state == 2) {
        pos = new mouse_pos_within_canvas(e);
        if (pos.X <= playground_width) {
            if (selected_sprite != -1) {
                mouse_state = 3;
                prev_X = -1;
                prev_Y = -1;
                sprites[selected_sprite].alpha = 1;
                overlapped_sprite_index_1 = selected_sprite;
                selected_sprite = -1;
            } else
                mouse_state = 0;
        } else {
            if (selected_sprite != -1) {
                mouse_state = 5;
            } else
                mouse_state = 0;
        }
    } else if (mouse_state == 4) {
        sprite_to_create = "";
        sprite_creation_X = -1;
        sprite_creation_Y = -1;
        mouse_state = 0;
    } else if (mouse_state == 1) {
        mouse_state = 5;
    }
}

//---------------------------------------------- Game Design

function load_content() {
    create_element("air", "http://i.imgur.com/PdoBAcx.png");
    create_element("earth", "http://i.imgur.com/J72A0Il.png");
    create_element("fire", "http://i.imgur.com/OHnZET1.png");
    create_element("water", "http://i.imgur.com/oDLGUuT.png");
    create_element("dust", "http://i.imgur.com/hpWgW3y.png");
    create_element("energy", "http://i.imgur.com/RgsM7YR.png");
    create_element("rain", "http://i.imgur.com/O5Xdc30.png");
    create_element("lava", "http://i.imgur.com/ZEQOqd1.png");
    create_element("mud", "http://i.imgur.com/jHtQtWT.png");
    create_element("steam", "http://i.imgur.com/cjtPfty.png");

    create_rule("air", "earth", "dust");
    create_rule("air", "fire", "energy");
    create_rule("air", "water", "rain");
    create_rule("earth", "fire", "lava");
    create_rule("earth", "water", "mud");
    create_rule("fire", "water", "steam");

    create_menu_item("air");
    create_menu_item("earth");
    create_menu_item("fire");
    create_menu_item("water");
}

//---------------------------------------------- Rendering

function update() {
    switch (mouse_state) {
        case 1: {
            if (selected_sprite == -1)
                break;
            sprites[selected_sprite].priority = 0;
            sprites[selected_sprite].alpha = 0.5;
            check_overlap_with_priority(selected_sprite);
            reassign_sprite_priorities();
        }
        case 2: {
            if (selected_sprite == -1)
                break;
            move_sprite(selected_sprite, delta_X, delta_Y);
            delta_X = 0;
            delta_Y = 0;
            check_overlap_with_priority(selected_sprite);
            reassign_sprite_priorities();
            break;
        }
        case 3: {
            reassign_sprite_priorities();
            if (overlapped_sprite_index_1 == -1) {
                mouse_state = 0;
                break;
            }
            overlapped_sprite_index_2 = check_overlap_with_priority(overlapped_sprite_index_1);
            if (overlapped_sprite_index_2 != -1) {
                var result_name = seek_result_name(names[elements[sprites[overlapped_sprite_index_1].ei].ni], names[elements[sprites[overlapped_sprite_index_2].ei].ni]);
                if (result_name) {
                    var new_sprite_X = (sprites[overlapped_sprite_index_1].X + sprites[overlapped_sprite_index_2].X) / 2;
                    var new_sprite_Y = (sprites[overlapped_sprite_index_1].Y + sprites[overlapped_sprite_index_2].Y) / 2;
                    if (overlapped_sprite_index_1 < overlapped_sprite_index_2) {
                        remove_sprite(overlapped_sprite_index_2);
                        remove_sprite(overlapped_sprite_index_1);
                    } else {
                        remove_sprite(overlapped_sprite_index_1);
                        remove_sprite(overlapped_sprite_index_2);
                    }
                    reassign_sprite_priorities();
                    create_menu_item(result_name);
                    create_sprite(result_name, new_sprite_X, new_sprite_Y);
                    check_overlap_with_priority(sprites.length - 1);
                    reassign_sprite_priorities();
                }
                overlapped_sprite_index_1 = -1;
                overlapped_sprite_index_2 = -1;
            }
            mouse_state = 0;
            break;
        }
        case 4: {
            create_sprite(sprite_to_create, sprite_creation_X, sprite_creation_Y);
            selected_sprite = sprites.length - 1;
            sprites[selected_sprite].alpha = 0.5;
            mouse_state = 1;
            break;
        }
        case 5: {
            if (selected_sprite != -1) {
                remove_sprite(selected_sprite);
                selected_sprite = -1;
            }
            mouse_state = 0;
            break;
        }
    }
}

function draw() {
    canvas.width = canvas.width;

    //Draw bounds
    context.beginPath();
    context.lineWidth = "1";
    context.strokeStyle = "grey";
    context.rect(0, 0, canvas.width, canvas.height);
    context.stroke();

    //Draw line between playground and sidebar
    context.beginPath();
    context.lineWidth = "1";
    context.strokeStyle = "grey";
    context.moveTo(playground_width, 0);
    context.lineTo(playground_width, canvas.height);
    context.stroke();

    //Draw sidebar
    for (var i = 0; i < menu_items.length; i++)
        draw_menu_item(i);

    //Draw sprites in prioritized order
    var highest_priority = 0;
    for (var i = 0; i < sprites.length; i++)
        if (sprites[i].priority > highest_priority)
            highest_priority = sprites[i].priority;
    for (var p = highest_priority; p >= 0; p--)
        for (var i = 0; i < sprites.length; i++)
            if (sprites[i].priority == p)
                draw_sprite(i);
}

function game_loop() {
    update();
    draw();
}

//---------------------------------------------- Run

load_content();
setInterval(game_loop, 16.67);