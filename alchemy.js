//---------------------------------------------- Element

var elements = new Array();

function look_up_element_by_name(name) {
    for (var i = 0; i < elements.length; i++)
        if (Utilities.string_compare(elements[i].name, name))
            return i;
    return -1;
}

class Element {
    constructor(name, texture_id) {
        this.name = name;
        this.ti = texture_id;
    }
}

function create_element(name, texture_id) {
    var ei = look_up_element_by_name(name);
    if (ei == -1) {
        elements.push(new Element(name, texture_id));
        return true;
    }
    return false;
}

function validate_element_index(element_index) {
    if (0 <= element_index && element_index < elements.length)
        return true;
    return false;
}

//---------------------------------------------- Rule Set

var rule_set = new Array();

function Rule(component_index_1, component_index_2, result_index) {
    this.comp_1 = component_index_1;
    this.comp_2 = component_index_2;
    this.result = result_index;
    return this;
}

function create_rule(component_name_1, component_name_2, result_name) {
    var comp_1 = look_up_element_by_name(component_name_1);
    if (comp_1 != -1) {
        var comp_2 = look_up_element_by_name(component_name_2);
        if (comp_2 != -1) {
            var result = look_up_element_by_name(result_name);
            if (result != -1) {
                rule_set.push(new Rule(comp_1, comp_2, result));
                return true;
            }
        }
    }
    return false;
}

function seek_result(component_index_1, component_index_2) {
    for (var i = 0; i < rule_set.length; i++) {
        if ((rule_set[i].comp_1 == component_index_1 && rule_set[i].comp_2 == component_index_2) || (rule_set[i].comp_1 == component_index_2 && rule_set[i].comp_2 == component_index_1))
            return rule_set[i].result;
    }
    return -1;
}

//---------------------------------------------- Alchemy specialized Sprite

class Sprite_ extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x_offset = Math.round(w / 2);
        this.y_offset = Math.round(h / 2);
        this.max_in_canvas_x = (canvas.width - w > 0) ? (canvas.width - w) : 0;
        this.max_in_canvas_y = (canvas.height - h > 0) ? (canvas.height - h) : 0;
        this.out_of_canvas = true;
    }

    get_allowed_coord(coord) {
        var coord_ = coord.clone();
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

    covers_coord_with_decorator(coord) {
        return this.check_coordinate_with_decorator(coord);
    }

    overlap_with_decorator_mutually(sprite) {
        return this.check_overlap_with_decorator_mutually(sprite);
    }
}

//---------------------------------------------- Engine-Inherited Element Sprite

var element_sprite_size = 50;
class Element_Sprite extends Sprite_ {
    constructor(x, y, element_index) {
        super(x, y, element_sprite_size, element_sprite_size);
        this.ei = -1;
        if (validate_element_index(element_index)) {
            this.ei = element_index;
            this.attach_texture(elements[this.ei].ti);
        }
        return this;
    }
}

//---------------------------------------------- Engine-Inherited - Menu Item Sprite

var menu;
var margin_between_menu_items = 5;
var menu_font_size = 20;
var menu_font = "Helvetica";
class Menu_Item extends Element_Sprite {
    constructor(element_index) {
        super(playground_width, menu.sprite_count * (element_sprite_size + margin_between_menu_items), element_index);
        this.attach_decorator(new Sprite(0, 0, canvas.width - playground_width - element_sprite_size, this.h), element_sprite_size, 0);
        if (this.decorator)
            this.decorator.attach_text(new Text(elements[element_index].name, menu_font_size, menu_font));
        return this;
    }

    actual_draw() {
        super.actual_draw();
        context.beginPath();
        context.lineWidth = "1";
        context.strokeStyle = "grey";
        context.moveTo(playground_width, this.coord.y + element_sprite_size + 3);
        context.lineTo(canvas.width, this.coord.y + element_sprite_size + 3);
        context.stroke();
    }
}

function look_up_menu_item(element_name) {
    for (var i = 0; i < menu.sprite_count; i++)
        if (string_compare(menu.root.children[i], element_name))
            return i;
    return -1;
}

function create_menu_item(element_name) {
    var ei = look_up_element_by_name(element_name);
    if (validate_element_index(ei)) {
        menu.add_sprite(new Menu_Item(ei));
        return true;
    }
    return false;
}

//---------------------------------------------- Engine-Inherited - Playground

var playground;
var playground_width;
class Playground extends WorldTree {
    constructor() {
        super();
        this.input_event_subscription_manager = input_event_subscription_manager;
        this.si = -1;
        this.latest_drag = null;
        this.latest_element = -1;
        var si = this.input_event_subscription_manager.add_subscriber(this);
        if (si >= 0)
            this.si = si;
        else
            throw "Input Event Subscription Error";
    }

    update() {
        if (this.selected_world_node && this.latest_drag) {
            this.selected_world_node.sprite.move(this.latest_drag.clone());
            this.latest_drag.x = 0;
            this.latest_drag.y = 0;
        }
        super.update();
    }

    handle_input_event(event) {
        switch (event.type) {
            case IEType.SELECT: {
                try {
                    this.input_event_subscription_manager.set_exclusive(this.si, IEType.SELECT);
                    this.selected_world_node = null;
                    var queue = this.node_queue();
                    for (var i = queue.length - 1; i >= 0; i--) {
                        if (queue[i].sprite.covers_coord_with_decorator(event.coord)) {
                            this.selected_world_node = queue[i];
                            break;
                        }
                    }
                    if (this.selected_world_node) {
                        this.selected_world_node.parent.remove_child(this.selected_world_node.index_at_parent);
                        this.selected_world_node.sprite.alpha = 0.5;
                        this.latest_drag = new Coordinate(0, 0);
                        try {
                            this.input_event_subscription_manager.set_full_exclusive(this.si);
                        } catch (e) {
                            console.log(e);
                        }
                    } else
                        try {
                            this.input_event_subscription_manager.release_exclusive(this.si, IEType.SELECT);
                        } catch (e) {
                            console.log(e);
                        }
                } catch (e) {
                    console.log(e);
                }
                break;
            }
            case IEType.DRAG: {
                if (this.selected_world_node) {
                    try {
                        this.input_event_subscription_manager.set_exclusive(this.si, IEType.DRAG);
                        this.latest_drag = this.latest_drag.add(event.coord);
                    } catch (e) {
                        console.log(e);
                    }
                }
                break;
            }
            case IEType.DROP: {
                if (this.selected_world_node) {
                    try {
                        this.input_event_subscription_manager.set_exclusive(this.si, IEType.DROP);
                        this.latest_drag = this.latest_drag.add(event.coord);
                        this.selected_world_node.sprite.move(this.latest_drag);
                        this.latest_drag = null;
                        this.selected_world_node.sprite.alpha = 1;
                        if (this.selected_world_node.sprite.coord.x <= playground_width) {
                            var overlap_node = this.add_node(this.selected_world_node);
                            if (overlap_node) {
                                var res = seek_result(overlap_node.sprite.ei, this.selected_world_node.sprite.ei);
                                if (res != -1) {
                                    overlap_node.remove_child(this.selected_world_node.index_at_parent);
                                    overlap_node.parent.remove_child(overlap_node.index_at_parent);
                                    var new_coord = overlap_node.sprite.coord.add(this.selected_world_node.sprite.coord).scale(0.5);
                                    this.add_sprite(new Element_Sprite(new_coord.x, new_coord.y, res));
                                    this.latest_element = res;
                                }
                            }
                        }
                        this.selected_world_node = null;
                        try {
                            this.input_event_subscription_manager.release_full_exclusive(this.si);
                        } catch (e) {
                            console.log(e);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
                this.selected_world_node = null;
                break;
            }
        }
    }
}

//---------------------------------------------- Engine-Inherited - Menu

class Menu extends WorldTree {
    constructor(monitored_playground) {
        super();
        this.input_event_subscription_manager = input_event_subscription_manager;
        this.si = -1;
        this.playground = monitored_playground;
        var si = this.input_event_subscription_manager.add_subscriber(this);
        if (si >= 0)
            this.si = si;
        else
            throw "Input Event Subscription Error";
    }

    handle_input_event(event) {
        switch (event.type) {
            case IEType.SELECT: {
                try {
                    this.input_event_subscription_manager.set_exclusive(this.si, IEType.SELECT)
                    this.selected_world_node = null;
                    for (var i = this.sprite_count - 1; i >= 0; i--) {
                        if (this.root.children[i].sprite.covers_coord_with_decorator(event.coord)) {
                            this.selected_world_node = this.root.children[i];
                            break;
                        }
                    }
                    if (this.selected_world_node) {
                        this.playground.latest_drag = new Coordinate(0, 0);
                        var new_sprite = new Element_Sprite(event.coord.x, event.coord.y, this.selected_world_node.sprite.ei);
                        new_sprite.move(new Coordinate(-new_sprite.x_offset, -new_sprite.y_offset));
                        new_sprite.alpha = 0.5;
                        var new_node = new WorldNode(new_sprite);
                        new_node.world = this.playground;
                        this.playground.selected_world_node = new_node;
                        try {
                            this.input_event_subscription_manager.release_exclusive(this.si, IEType.SELECT);
                            this.input_event_subscription_manager.set_full_exclusive(this.playground.si);
                        } catch (e) {
                            console.log(e);
                        }
                    } else
                        try {
                            this.input_event_subscription_manager.release_exclusive(this.si, IEType.SELECT)
                        } catch (e) {
                            console.log(e);
                        }
                } catch (e) {
                    console.log(e);
                }
                break;
            }
        }
    }

    element_exists(ei) {
        for (var i = this.sprite_count - 1; i >= 0; i--)
            if (this.root.children[i].sprite.ei == ei)
                return true;
        return false;
    }

    update() {
        if (this.playground.latest_element != -1 && !this.element_exists(this.playground.latest_element)) {
            this.add_sprite(new Menu_Item(this.playground.latest_element));
            this.playground.latest_element = -1;
        }
        super.update();
    }
}

//---------------------------------------------- Game Design

function load_elements() {
    create_element("air", new Texture("http://i.imgur.com/PdoBAcx.png").Texture_id);
    create_element("earth", new Texture("http://i.imgur.com/J72A0Il.png").Texture_id);
    create_element("fire", new Texture("http://i.imgur.com/OHnZET1.png").Texture_id);
    create_element("water", new Texture("http://i.imgur.com/oDLGUuT.png").Texture_id);
    create_element("dust", new Texture("http://i.imgur.com/hpWgW3y.png").Texture_id);
    create_element("energy", new Texture("http://i.imgur.com/RgsM7YR.png").Texture_id);
    create_element("rain", new Texture("http://i.imgur.com/O5Xdc30.png").Texture_id);
    create_element("lava", new Texture("http://i.imgur.com/ZEQOqd1.png").Texture_id);
    create_element("mud", new Texture("http://i.imgur.com/jHtQtWT.png").Texture_id);
    create_element("steam", new Texture("http://i.imgur.com/cjtPfty.png").Texture_id);
}

function load_rules() {
    create_rule("air", "earth", "dust");
    create_rule("air", "fire", "energy");
    create_rule("air", "water", "rain");
    create_rule("earth", "fire", "lava");
    create_rule("earth", "water", "mud");
    create_rule("fire", "water", "steam");
}

function load_menu() {
    create_menu_item("air");
    create_menu_item("earth");
    create_menu_item("fire");
    create_menu_item("water");
}

function init_game() {
    init_engine();
    playground_width = Math.round(canvas.width * 0.8);
    load_elements();
    load_rules();
    playground = new Playground();
    menu = new Menu(playground);
    load_menu();
}

//---------------------------------------------- Run

function update() {
    playground.update();
    menu.update();
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

    playground.draw();

    menu.draw();
}

function game_loop() {
    update();
    draw();
}

init_game();
setInterval(game_loop, 16.67);