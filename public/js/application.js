var BUBBLE_BORDER, BUBBLE_OPTIONS, BUBBLE_RADIUS, CONTAINER_BORDER, DROP_MULTIPLER, MAX_ANGLE, ROW_COUNTER_CEILING, SPEED, addRow, addRowCounter, addRows, bubbleMatrix, bubbleMatrixOne, bubbleMatrixTwo, checkCluster, currMatrix, drop, findClosestInMatrix, gameover, getColor, getDivFromLoc, getPointAtT, getPointAtY, getSlope, isMatrixLocEmpty, lookAround, moveBubble, scoochAllDown, shooting, stringifyLoc, toggleMatrixPosition;

BUBBLE_BORDER = 5;

BUBBLE_RADIUS = 25;

CONTAINER_BORDER = 5;

SPEED = 20;

MAX_ANGLE = 75;

BUBBLE_OPTIONS = ["red", "green", "yellow", "blue"];

ROW_COUNTER_CEILING = 10;

DROP_MULTIPLER = 2;

addRowCounter = 0;

shooting = false;

currMatrix = "";

gameover = false;

bubbleMatrix = [];

bubbleMatrixOne = [];

bubbleMatrixTwo = [];

$(document).ready(function() {
  var currColor, currColorClass, gameoverlay, h, i, j, margin, rand, shooter, shooterbase, shootercontrol, shooteroverlay, w, x, xNum, y, yNum;
  shooter = $("<div class='popper-shooter'></div>");
  shootercontrol = $("<div id='shooter-control'></div>");
  shooterbase = $("<div id='shooter-base'></div>");
  shooteroverlay = $("<div id='shooter-control-overlay'></div>");
  gameoverlay = $("<div id='gameover'></div>");
  gameoverlay.append("<div style='color: #300; text-align: center; font-size: 60px; margin-top: 200px'><strong>Game Over <i class='fa fa-frown-o'></i></strong></div>");
  $("#popper-container").append(shootercontrol);
  $("#popper-container").append(shooterbase);
  $("#popper-container").append(shooteroverlay);
  $("#popper-container").append(gameoverlay);
  $("#popper-container").append(shooter);
  rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length);
  currColor = BUBBLE_OPTIONS[rand];
  currColorClass = "popper-" + currColor;
  $(".popper-shooter").addClass(currColorClass);
  shooteroverlay.mousemove(function(e) {
    var rotatedeg;
    if (!gameover) {
      rotatedeg = (e.pageX - $(this).offset().left) / $(this).outerWidth() * 160 - MAX_ANGLE;
      rotatedeg = Math.max(-MAX_ANGLE, rotatedeg);
      rotatedeg = Math.min(MAX_ANGLE, rotatedeg);
      $(".popper-shooter").data("rotatedeg", rotatedeg);
      $(".popper-shooter").css("transform", "rotate(" + rotatedeg + "deg" + ")");
      $("#shooter-rotate-deg").text("Shooter at " + Math.round(rotatedeg * 10) / 10);
    }
  });
  shooteroverlay.bind("touchmove", function(e) {
    var rotatedeg;
    if (!gameover) {
      e.preventDefault();
      rotatedeg = (e.originalEvent.touches[0].pageX - $(this).offset().left) / $(this).outerWidth() * 160 - MAX_ANGLE;
      rotatedeg = Math.max(-MAX_ANGLE, rotatedeg);
      rotatedeg = Math.min(MAX_ANGLE, rotatedeg);
      $(".popper-shooter").data("rotatedeg", rotatedeg);
      $(".popper-shooter").css("transform", "rotate(" + rotatedeg + "deg" + ")");
      $("#shooter-rotate-deg").text("Shooter at " + Math.round(rotatedeg * 10) / 10);
    }
  });
  shooteroverlay.click(function(e) {
    var i, rotatedeg;
    if (!shooting && !gameover) {
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"));
      $("#shoot-at-deg").text("Shoot at: " + Math.round(rotatedeg * 10) / 10);
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot(rotatedeg);
      addRowCounter += Math.floor(Math.random() * 2) + 1;
      if (addRowCounter > ROW_COUNTER_CEILING) {
        addRow();
        addRowCounter = 0;
      }
      i = 0;
      while (i < BUBBLE_OPTIONS.length) {
        $(".popper-shooter").removeClass("popper-" + BUBBLE_OPTIONS[i]);
        i++;
      }
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length);
      currColor = BUBBLE_OPTIONS[rand];
      currColorClass = "popper-" + currColor;
      $(".popper-shooter").addClass(currColorClass);
    }
  });
  shooteroverlay.bind("touchend", function(e) {
    var i, rotatedeg;
    if (!shooting && !gameover) {
      e.preventDefault();
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"));
      $("#shoot-at-deg").text("Shoot at: " + Math.round(rotatedeg * 10) / 10);
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot(rotatedeg);
      addRowCounter += Math.floor(Math.random() * 2) + 1;
      if (addRowCounter > ROW_COUNTER_CEILING) {
        addRow();
        addRowCounter = 0;
      }
      i = 0;
      while (i < BUBBLE_OPTIONS.length) {
        $(".popper-shooter").removeClass("popper-" + BUBBLE_OPTIONS[i]);
        i++;
      }
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length);
      currColor = BUBBLE_OPTIONS[rand];
      currColorClass = "popper-" + currColor;
      return $(".popper-shooter").addClass(currColorClass);
    }
  });
  w = $("#popper-container").width();
  h = $("#popper-container").outerHeight() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2;
  xNum = Math.floor(w / (BUBBLE_RADIUS * 2) - 0.5);
  yNum = Math.floor(h / (BUBBLE_RADIUS * 2) - 0.5) * 1.5 - 1;
  margin = (w - (xNum + 0.5) * BUBBLE_RADIUS * 2) / 2;
  bubbleMatrixOne = [];
  bubbleMatrix = [];
  j = 0;
  while (j < yNum) {
    bubbleMatrixOne[j] = [];
    bubbleMatrix[j] = [];
    i = 0;
    while (i < xNum) {
      if (j % 2 === 0) {
        x = i * BUBBLE_RADIUS * 2 + margin;
        y = h;
      } else {
        x = i * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + margin;
      }
      y = h - BUBBLE_RADIUS * j * 1.7;
      bubbleMatrixOne[j][i] = {
        x: x,
        y: y
      };
      bubbleMatrix[j][i] = {
        x: x,
        y: y
      };
      i++;
    }
    j++;
  }
  currMatrix = "one";
  bubbleMatrixTwo = [];
  j = 0;
  while (j < yNum) {
    bubbleMatrixTwo[j] = [];
    i = 0;
    while (i < xNum) {
      if (j % 2 === 1) {
        x = i * BUBBLE_RADIUS * 2 + margin;
        y = h;
      } else {
        x = i * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + margin;
      }
      y = h - BUBBLE_RADIUS * j * 1.7;
      bubbleMatrixTwo[j][i] = {
        x: x,
        y: y
      };
      i++;
    }
    j++;
  }
  addRows(3);
});


/* The next set of functions are for getting the bubble to shoot */

getSlope = function(startDeg) {
  var aDeg, aRad, m;
  aDeg = 90 - Math.abs(startDeg);
  aRad = aDeg * Math.PI / 180;
  m = Math.tan(aRad);
  return m;
};

getPointAtT = function(t, startDeg) {
  var dir, k, m, point, w, x, y;
  w = $("#popper-container").outerWidth() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2;
  m = getSlope(startDeg);
  x = t / Math.pow(1 + m * m, 0.5);
  y = x * m;
  if (startDeg === 0) {
    x = 0;
    y = t;
  } else {
    dir = Math.ceil((x + w / 2) / w);
    k = Math.floor((x / w + 0.5) / 2) * 2;
    if (dir % 2 === 1) {
      x = x - w * k;
    } else {
      x = w - (x - w * k);
    }
    if (startDeg < 0) {
      x = -x;
    }
  }
  x = x + w / 2;
  y = y - BUBBLE_RADIUS;
  point = {
    x: x,
    y: y
  };
  return point;
};

getPointAtY = function(y, startDeg) {
  var m, t, w, x;
  w = $("#popper-container").outerWidth() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2;
  m = getSlope(startDeg);
  x = y / m;
  t = x * Math.pow(1 + m * m, 0.5);
  return getPointAtT(t, startDeg);
};

findClosestInMatrix = function(x, y) {
  var i, j, minDistance, minMatrix, minMatrixCoords, thisDistance;
  minDistance = 5000;
  minMatrixCoords = {
    x: "",
    y: ""
  };
  minMatrix = {
    row: "",
    num: ""
  };
  i = 0;
  while (i < bubbleMatrix.length) {
    j = 0;
    while (j < bubbleMatrix[0].length) {
      thisDistance = Math.pow(Math.pow(bubbleMatrix[i][j].x - x, 2) + Math.pow(bubbleMatrix[i][j].y - y, 2), 0.5);
      if (thisDistance < minDistance) {
        minMatrixCoords.x = bubbleMatrix[i][j].x;
        minMatrixCoords.y = bubbleMatrix[i][j].y;
        minMatrix.row = i;
        minMatrix.num = j;
        minDistance = thisDistance;
      }
      j++;
    }
    i++;
  }
  return minMatrix;
};


/* The next set of functions are for adding bubbles */

addRows = function(n) {
  var i, _results;
  i = 0;
  _results = [];
  while (i < n) {
    addRow();
    _results.push(i++);
  }
  return _results;
};

addRow = function(colors) {
  var color, div, i, loc, num, rand, _i, _j, _len, _len1, _ref, _results;
  scoochAllDown();
  if (colors === void 0) {
    colors = [];
    _ref = bubbleMatrix[0];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length);
      colors.push(BUBBLE_OPTIONS[rand]);
    }
  } else if (colors.length < bubbleMatrix[0].length) {
    i = colors.length;
    while (i < bubbleMatrix[0].length) {
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length);
      colors.push(BUBBLE_OPTIONS[rand]);
      i++;
    }
  }
  num = 0;
  _results = [];
  for (_j = 0, _len1 = colors.length; _j < _len1; _j++) {
    color = colors[_j];
    div = $("#popper-container").createBubble(color).addClass("popper-" + color).text('0,' + num);
    loc = {
      row: 0,
      num: num
    };
    div.putInMatrix(loc, false);
    div.hide().fadeIn({
      duration: 200
    });
    _results.push(num++);
  }
  return _results;
};

scoochAllDown = function(n) {
  var r;
  r = bubbleMatrix.length;
  while (r > 0) {
    r--;
    n = bubbleMatrix[r].length;
    while (n > 0) {
      n--;
      if (!isMatrixLocEmpty({
        row: r,
        num: n
      })) {
        moveBubble({
          row: r,
          num: n
        }, {
          row: r + 1,
          num: n
        });
      }
    }
  }
  return toggleMatrixPosition();
};

moveBubble = function(oldloc, newloc) {
  var div;
  div = getDivFromLoc(oldloc);
  div.attr("data-matrow", newloc.row).attr("data-matnum", newloc.num);
  div.css("bottom", bubbleMatrix[newloc.row][newloc.num].y);
  div.css("left", bubbleMatrix[newloc.row][newloc.num].x);
  div.text(newloc.row + "," + newloc.num);
  bubbleMatrix[newloc.row][newloc.num].div = bubbleMatrix[oldloc.row][oldloc.num].div;
  bubbleMatrix[newloc.row][newloc.num].color = bubbleMatrix[oldloc.row][oldloc.num].color;
  bubbleMatrix[oldloc.row][oldloc.num].div = void 0;
  return bubbleMatrix[oldloc.row][oldloc.num].color = void 0;
};

toggleMatrixPosition = function() {
  var bm, div, n, r;
  if (currMatrix === "one") {
    bm = bubbleMatrixTwo;
    currMatrix = "two";
  } else {
    bm = bubbleMatrixOne;
    currMatrix = "one";
  }
  r = 0;
  while (r < bm.length) {
    n = 0;
    while (n < bm[r].length) {
      bubbleMatrix[r][n].x = bm[r][n].x;
      bubbleMatrix[r][n].y = bm[r][n].y;
      if (!isMatrixLocEmpty({
        row: r,
        num: n
      })) {
        div = $(".point[data-matrow='" + r + "'][data-matnum='" + n + "']");
        div.css("left", bm[r][n].x + "px").css("bottom", bm[r][n].y);
      }
      n++;
    }
    r++;
  }
};


/* The next set of functions are for returning clusters of color */

checkCluster = function(loc, checkColor, n, checkedBefore) {
  var arr, enviro, l, _i, _len;
  if (checkColor === void 0) {
    checkColor = true;
  }
  if (n === void 0) {
    n = 0;
  } else {
    n++;
  }
  if (checkedBefore === void 0) {
    checkedBefore = [];
  }
  checkedBefore.push(stringifyLoc(loc));
  arr = [loc];
  if (n < 1000) {
    enviro = lookAround(loc);
    for (_i = 0, _len = enviro.length; _i < _len; _i++) {
      l = enviro[_i];
      if ($.inArray(stringifyLoc(l), checkedBefore) === -1) {
        checkedBefore.push(stringifyLoc(l));
        if (checkColor) {
          if (getColor(l) === getColor(loc)) {
            arr = arr.concat(checkCluster(l, checkColor, n, checkedBefore));
          }
        } else {
          arr = arr.concat(checkCluster(l, checkColor, n, checkedBefore));
        }
      }
    }
    return arr;
  } else {
    return console.log("too many recursions");
  }
};

isMatrixLocEmpty = function(loc) {
  if (loc.row < 0 || loc.row > bubbleMatrix.length - 1 || loc.num < 0 || loc.num > bubbleMatrix[0].length - 1) {
    return true;
  } else {
    return bubbleMatrix[loc.row][loc.num].div === undefined;
  }
};

stringifyLoc = function(loc) {
  return loc.row + "," + loc.num;
};

getColor = function(row, num) {
  if (row.row === void 0) {
    return bubbleMatrix[row][num].color;
  } else {
    return bubbleMatrix[row.row][row.num].color;
  }
};

lookAround = function(loc) {
  var alt, div, enviro, enviro2, l, num, row, _i, _len;
  div = $(this[0]);
  row = loc.row;
  num = loc.num;
  enviro = [];
  if (currMatrix === "one") {
    if (row % 2 === 0) {
      alt = -1;
    } else {
      alt = 0;
    }
  } else {
    if (row % 2 === 1) {
      alt = -1;
    } else {
      alt = 0;
    }
  }
  enviro.push({
    row: row - 1,
    num: num + alt
  });
  enviro.push({
    row: row - 1,
    num: num + alt + 1
  });
  enviro.push({
    row: row,
    num: num - 1
  });
  enviro.push({
    row: row,
    num: num + 1
  });
  enviro.push({
    row: row + 1,
    num: num + alt
  });
  enviro.push({
    row: row + 1,
    num: num + alt + 1
  });
  enviro2 = [];
  for (_i = 0, _len = enviro.length; _i < _len; _i++) {
    l = enviro[_i];
    if (!isMatrixLocEmpty(l)) {
      enviro2.push(l);
    }
  }
  return enviro2;
};

drop = function(locs, type, callback) {
  var b, l, ldiv, target, toploc, toprow, _i, _len;
  if (locs instanceof Array) {
    locs = locs;
  } else {
    locs = [locs];
  }
  toploc = _.min(locs, function(d) {
    return d.row;
  });
  toprow = toploc.row;
  for (_i = 0, _len = locs.length; _i < _len; _i++) {
    l = locs[_i];
    bubbleMatrix[l.row][l.num].color = void 0;
    bubbleMatrix[l.row][l.num].div = void 0;
    ldiv = getDivFromLoc(l);
    b = parseInt(ldiv.css("bottom"));
    target = (b - $("#popper-container").height()) * ((l.row - toploc.row + 1) * 3 + 1);
    if (type === "drop") {
      ldiv.animate({
        bottom: target + "px"
      }, {
        duration: 600,
        complete: function() {
          if (callback !== void 0) {
            return callback();
          }
        }
      });
    } else {
      ldiv.fadeOut({
        duration: 150,
        complete: function() {
          if (callback !== void 0) {
            return setTimeout((function() {
              return callback();
            }), 10);
          }
        }
      });
    }
  }
};

getDivFromLoc = function(loc) {
  var div;
  div = $(".point[data-matrow=" + loc.row + "][data-matnum=" + loc.num + "]");
  return div;
};


/* jQuery add ons, mostly relatied to shooting a bubble */

jQuery.fn.createBubble = function(color) {
  var div;
  div = $("<div class='point'></div>");
  div.css("width", BUBBLE_RADIUS * 2 + "px").css("height", BUBBLE_RADIUS * 2 + "px").css("border-width", BUBBLE_BORDER + "px");
  if (color !== void 0) {
    div.attr("data-color", color);
  }
  $(this[0]).append(div);
  return div;
};

jQuery.fn.putInMatrix = function(loc, pop) {
  var coords, deltaScore, div, oldScore, sameColorLocs;
  if (pop === void 0) {
    pop = true;
  }
  div = $(this[0]);
  bubbleMatrix[loc.row][loc.num].div = div;
  bubbleMatrix[loc.row][loc.num].color = div.attr("data-color");
  coords = bubbleMatrix[loc.row][loc.num];
  div.drawAt(coords.x, coords.y);
  div.attr("data-matrow", loc.row);
  div.attr("data-matnum", loc.num);
  div.text(loc.row + ", " + loc.num);
  if (pop === true) {
    deltaScore = 0;
    sameColorLocs = checkCluster(loc, true);
    if (sameColorLocs.length >= 3) {
      oldScore = parseInt($("#score").text());
      drop(sameColorLocs, "fade", function() {
        var b, furthest, i, l, loc_i, looseguys, n, r, topsChecked, wallcluster, _i, _len, _ref;
        topsChecked = [];
        i = 0;
        _ref = bubbleMatrix[0];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          b = _ref[_i];
          topsChecked.push(i);
          i++;
        }
        wallcluster = [];
        i = 0;
        while (i < topsChecked.length && i < 1000) {
          loc_i = {
            row: 0,
            num: i
          };
          if (!isMatrixLocEmpty(loc_i)) {
            wallcluster = wallcluster.concat(checkCluster(loc_i, false));
            furthest = _.max(_.where(wallcluster, {
              row: 0
            }), function(d) {
              return d.num;
            });
            i = furthest.num + 1;
          } else {
            i++;
          }
        }
        looseguys = [];
        r = 0;
        while (r < bubbleMatrix.length) {
          n = 0;
          while (n < bubbleMatrix[r].length) {
            l = {
              row: r,
              num: n
            };
            if (!isMatrixLocEmpty(l)) {
              if (_.where(wallcluster, l).length === 0) {
                looseguys.push(l);
              }
            }
            n++;
          }
          r++;
        }
        drop(looseguys, "drop");
        deltaScore += Math.ceil(looseguys.length * DROP_MULTIPLER);
        return $("#score").text(oldScore + deltaScore);
      });
    } else {
      if (loc.row > 10) {
        $("#gameover").show();
        gameover = true;
        div = $(".point").last();
        div.css("background-color", "#DDD").css("border-color", "#BBB");
        div.putInMatrix(prevMatrixLoc);
        shooting = false;
      }
    }
    if (sameColorLocs.length >= 3) {
      deltaScore += sameColorLocs.length;
    }
    oldScore = parseInt($("#score").text());
    $("#score").text(oldScore + deltaScore);
  }
  shooting = false;
};

jQuery.fn.drawAt = function(x, y) {
  $(this[0]).show().css("bottom", y + "px").css("left", +x + "px");
};

jQuery.fn.shoot = function(startDeg) {
  var ctr, div, h, prevMatrixLoc, t;
  div = $(this[0]);
  clearInterval(window.shootInterval);
  prevMatrixLoc = {
    row: "",
    num: ""
  };
  h = $("#popper-container").outerHeight() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2;
  t = 0;
  ctr = 0;
  window.shootInterval = setInterval(function() {
    var coords, currMatrixLoc, p;
    shooting = true;
    p = getPointAtT(t, startDeg);
    if (p.y <= h) {
      currMatrixLoc = findClosestInMatrix(p.x, p.y);
      if (isMatrixLocEmpty(currMatrixLoc)) {
        if (ctr % 2 === 0) {
          div.drawAt(p.x, p.y);
        }
        prevMatrixLoc = currMatrixLoc;
        t += SPEED;
      } else {
        clearInterval(window.shootInterval);
        div.putInMatrix(prevMatrixLoc);
      }
    } else {
      clearInterval(window.shootInterval);
      coords = getPointAtY(h + BUBBLE_RADIUS, startDeg);
      currMatrixLoc = findClosestInMatrix(coords.x, coords.y);
      if (isMatrixLocEmpty(currMatrixLoc)) {
        div.putInMatrix(currMatrixLoc);
      } else {
        div.putInMatrix(prevMatrixLoc);
      }
    }
  }, 5);
  return div;
};
