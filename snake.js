function init_game() {
    init_engine();
}

//---------------------------------------------- Run

function update() { }

function draw() {
    canvas.width = canvas.width;
}

function game_loop() {
    update();
    draw();
}

init_game();
setInterval(game_loop, 16.67);