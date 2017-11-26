# Engine

This is a JavaScript HTML5 game engine.

### [Gallery](https://pages.github.ncsu.edu/twu23/Engine)

Displays all avalaible games made with the engine, click on each to play.

##### 1. [Alchemy R](https://pages.github.ncsu.edu/twu23/Engine/alchemy)

A Little Alchemy-like game.

Drag elements from sidebar and drop them to playground, mix each other to create new elements; drag elements and drop within sidebar to remove it.

##### 2. [Snake R](https://pages.github.ncsu.edu/twu23/Engine/snake)

A Snake-like game.

Eat red normal food to make a snake grow, eat blue spoiled food to make a snake shrink. Normal food stays on stage permanently unless eaten by snake, spoiled food will disappear automatically if not eaten within a certain amount of time.

Game will be over if a snake collides with wall or another snake or itself; in multiplayer, winner is the one who didn't hit anything, or the one who has a higher score when both player hit something.

Game will restart the same mode automatically in 3 seconds after game over.

In single player mode, press arrow key to navigate.

In multiplayer (local) mode, press arrow key to navigate yellow-colored snake, press WASD to navigate cyan-colored snake.

In multiplayer (network) mode, press arrow key to navigate your snake; if you play as host, your snake is yellow-colored, otherwise it's cyan-colored.

**Important Note on Multiplayer (network)**

You have to at least load two instances of this game to get this mode connected, on one instance you should select "Play as Host", on the other you should select "Play as Guest". Reload **both** instances if you happen to select the same option on both instances.

It's using WebRTC, so it can only run on **Chrome** or **Firefox** at this point; it's also using WebSocket, but HTTPS security doesn't allow WebSocket, so it has to be loaded with **HTTP**.

The peer-to-peer connection is setup by cloud service of PeerJS, game won't connect if either player isn't connected to the Internet.

##### 3. [Bubble Shooter R](https://pages.github.ncsu.edu/twu23/Engine/bubble_shooter)

A Bubble Shooter-like game.

Press left & right arrow key to re-orient barrel, press space key to shoot the prepared bubble.

When the shot bubble collides with any existing bubble, all connect bubbles of the same color will disappear.

All existing bubble will be moved down every 20 seconds, game will be over when they crosses the line.

##### 4. [Cops and Robbers R](https://pages.github.ncsu.edu/twu23/Engine/cops_and_robbers)

A Cops and Robbers-like game. Cops are represented by sprites flashing in blue, black and gray; robbers are cyan sprites.

This game provides two modes, in one mode you control a robber against cops, in the other you play as a cop to catch robbers.

In Addition, the game provides two way to of turn-taking, one is that the game will only take turn when player makes input, the other is that the game will take turn at 2 Hz regardless of player input, which is more challenging.

If you choose to play as robber, use arrow key to navigate your robber (yellow colored) to move in 8 directions; other robbers are controlled by AI.

If you choose to play as cop, also use arrow key to navigate your cop (grey colored) to move in 8 directions; other cops are controlled by AI.

If 2 cops have been at 2 adjacent position of robber at the same time, or if a robber can't move because it's blocked by 1 police and obstacles, that robber is caught, and can't move anymore.

If all robbers are caught within a time limit, cops win, other wise robbers win; you need to win in order to load the next level, otherwise game will reload the current level; the game provides 3 levels at the moment.