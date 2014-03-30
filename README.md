## URL Params

### Game Settings

**maxrows**: default 3, how many rows you start with

**startrows**: default 10, after this it's game over sadface
angle: default 75, max angle of the shooter

### Turn Settings (the fun stuff!)

**turnmax**: default 4, when counter reaches this it adds a new row, so lower the number is harder; 0 for infinite

**turnmin**: default 2, min number of turns before ceiling (random factory included)

**turnrand**: default 1, as counter increments, it can increment 1-this number at random 

**turnaccel**: default 0.8, as you get more turns, row ceiling gets lower (not exponentially)

**timermax**: default 0, seconds before new layer, 0 for infinite

**timermin**: default 5, mininum seconds before new layer

**timeraccel**: default .9, as you get more turns your seconds drop (exponentially)

### Bonus Points Settings

**droppoints**: default 1.2, multiple of points you get when you drop bubbles

**droptime**: default 1, dropped * this = extra seconds you get