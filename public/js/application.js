var ADDROW_TIMER_CEILING, ADDROW_TIMER_MIN, ADDROW_TIMER_MULTIPLIER, BUBBLE_BORDER, BUBBLE_OPTIONS, BUBBLE_RADIUS, CONTAINER_BORDER, DEFAULT_ROWS, DROP_MULTIPLER, DROP_TIME_MULTIPLER, MAX_ANGLE, MAX_ROW_NUM, NUM_PER_ROW, ROW_TURNS_CEILING, ROW_TURNS_FLOOR, ROW_TURNS_MULTIPLIER, ROW_TURNS_RAND, SPEED, addRow, addRowCounter, addRowCounterSecs, addRows, addToScore, addToScrewQueue, auth, autoLogIn, bubbleMatrix, bubbleMatrixOne, bubbleMatrixTwo, checkCluster, checkIfWon, currMatrix, drop, fb, findClosestInMatrix, getColor, getDivFromLoc, getPointAtT, getPointAtY, getSlope, getUrlParam, isLoggedIn, isLost, isMatrixLocEmpty, isMultiPlayer, isPaused, isWon, lookAround, lose, matchID, moveBubble, myPlayerNum, noticeFlash, numRowAdded, opponentID, pause, scoochAllDown, screwQueue, shooting, stringifyLoc, toggleMatrixPosition, unpause, user, win;

NUM_PER_ROW = 10;

BUBBLE_OPTIONS = ["red", "green", "yellow", "blue"];

DEFAULT_ROWS = 3;

MAX_ROW_NUM = 10;

SPEED = 20;

MAX_ANGLE = 75;

ROW_TURNS_CEILING = 0;

ROW_TURNS_FLOOR = 3;

ROW_TURNS_RAND = 2;

ROW_TURNS_MULTIPLIER = 0;

ADDROW_TIMER_CEILING = 20;

ADDROW_TIMER_MIN = 5;

ADDROW_TIMER_MULTIPLIER = .95;

DROP_MULTIPLER = 1.2;

DROP_TIME_MULTIPLER = 2.5;

getUrlParam = function(name) {
  var regex, results;
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  results = regex.exec(location.search);
  if (results == null) {
    return "";
  } else {
    return decodeURIComponent(results[1].replace(/\+/g, " ").replace(/\//g, ''));
  }
};

if (getUrlParam("num") !== "") {
  NUM_PER_ROW = parseFloat(getUrlParam("num"));
}

if (getUrlParam("maxrows") !== "") {
  MAX_ROW_NUM = parseFloat(getUrlParam("maxrows"));
}

if (getUrlParam("startrows") !== "") {
  DEFAULT_ROWS = parseFloat(getUrlParam("startrows"));
}

if (getUrlParam("speed") !== "") {
  SPEED = parseFloat(getUrlParam("speed"));
}

if (getUrlParam("angle") !== "") {
  MAX_ANGLE = parseFloat(getUrlParam("angle"));
}

if (getUrlParam("turnmax") !== "") {
  ROW_TURNS_CEILING = parseFloat(getUrlParam("turnmax"));
}

if (getUrlParam("turnmin") !== "") {
  ROW_TURNS_FLOOR = parseFloat(getUrlParam("turnmin"));
}

if (getUrlParam("turnrand") !== "") {
  ROW_TURNS_RAND = parseFloat(getUrlParam("turnrand"));
}

if (getUrlParam("turnaccel") !== "") {
  ROW_TURNS_MULTIPLIER = parseFloat(getUrlParam("turnaccel"));
}

if (getUrlParam("timermax") !== "") {
  ADDROW_TIMER_CEILING = parseFloat(getUrlParam("timermax"));
}

if (getUrlParam("timermin") !== "") {
  ADDROW_TIMER_MIN = parseFloat(getUrlParam("timermin"));
}

if (getUrlParam("timeraccel") !== "") {
  ADDROW_TIMER_MULTIPLIER = parseFloat(getUrlParam("timeraccel"));
}

if (getUrlParam("droppoints") !== "") {
  DROP_MULTIPLER = parseFloat(getUrlParam("droppoints"));
}

if (getUrlParam("droptime") !== "") {
  DROP_TIME_MULTIPLER = parseFloat(getUrlParam("droptime"));
}

BUBBLE_BORDER = 5;

BUBBLE_RADIUS = 25;

CONTAINER_BORDER = 5;

shooting = false;

isLost = false;

isPaused = true;

isWon = false;

currMatrix = "";

bubbleMatrix = [];

bubbleMatrixOne = [];

bubbleMatrixTwo = [];

addRowCounter = 0;

addRowCounterSecs = 1;

numRowAdded = 0;

isMultiPlayer = false;

screwQueue = [];

myPlayerNum = 0;

fb = new Firebase("https://pop-it.firebaseio.com/");

user = "";

isLoggedIn = false;

autoLogIn = true;

opponentID = void 0;

matchID = void 0;

auth = new FirebaseSimpleLogin(fb, function(e, u) {
  var endmatch, match_id, startmatch, transit;
  if (e) {
    console.log("Firebase error: " + e);
  } else if (u) {
    user = u;
    console.log("Anonymouse User " + u.id);
    match_id = getUrlParam("m");
    if (match_id !== "") {
      isMultiPlayer === true;
      startmatch = fb.child("matches").child(match_id);
      startmatch.on("value", function(d) {
        var i, sqdiv;
        if (d.val() !== null) {
          if (d.val().winner === void 0 || d.val().winner === "") {
            if (d.child("players").hasChild(user.id) === true) {
              console.log("You are Player 1!");
              isMultiPlayer = true;
              matchID = match_id;
              $("#startscreen").find(".startplaying").text("Start Match");
              myPlayerNum = 1;
              if (d.val().player2_id === void 0) {
                $("#startscreen").find(".startplaying").addClass("disabled").text("waiting for opponent");
              } else {
                opponentID = d.val().player2_id;
                $("#startscreen").find(".startplaying").removeClass("disabled").text("Start Match");
                startmatch.off("value");
              }
            } else if (d.val().player2_id === void 0 || d.val().player2_id === user.id) {
              startmatch.child("player2_id").set(user.id);
              isMultiPlayer = true;
              matchID = match_id;
              console.log("You are Player 2!");
              $("#startscreen").find(".startplaying").text("Start Match");
              myPlayerNum = 2;
              opponentID = d.val().player1_id;
              startmatch.off("value");
            } else {
              $("#startscreen").find(".startplaying").addClass("disabled").text("Match Full");
              startmatch.off("value");
            }
          } else {
            $("#startscreen").hide();
          }
        }
        if (isMultiPlayer === true) {
          console.log("game on");
          clearInterval(window.addrow);
          $("#timer-container").hide();
          $("#startscreen").find("#rowintervalinfo").hide();
          $("#startscreen").find("#rowcounterinfo").hide();
          ROW_TURNS_CEILING = 0;
          ADDROW_TIMER_CEILING = 0;
          sqdiv = $("<div class='screwqueue-container'><div>Send when full</div></div>");
          i = 0;
          while (i < NUM_PER_ROW) {
            sqdiv.append("<div class='screwqueue-ball screwqueue-" + i + "'></div>");
            i++;
          }
          return $("#popper-container").append(sqdiv);
        }
      });
      transit = fb.child("matches").child(match_id).child("transit");
      transit.on("child_added", function(d) {
        if (d.val() !== null) {
          window.dv = d.val();
          if (d.val().to === user.id) {
            addRow(d.val().addrow, "You got a gift");
            return transit.child(d.name()).child("status").set("done");
          }
        }
      });
      endmatch = fb.child("matches").child(match_id).child("winner");
      endmatch.on("value", function(d) {
        console.log("winner", d.val());
        if (d.val() !== void 0 && d.val() !== "") {
          console.log("somebody won");
          if (d.val() === user.id) {
            return win();
          } else {
            return lose();
          }
        }
      });
    }
    $("#startscreen").css("color", "#888");
  } else {
    if (autoLogIn) {
      console.log("Getting id...");
      auth.login('anonymous', {
        rememberMe: true
      });
    }
    $("#startscreen").css("color", "#888");
  }
  return $(".startplaying").show();
});

$(document).ready(function() {
  var currColor, currColorClass, fornow, gameoverlay, h, i, j, margin, minCtr, noticeoverlay, pauseoverlay, rand, refresh, rowcounterinfo, rowintervalinfo, shooter, shooterbase, shootercontrol, shooteroverlay, startoverlay, w, winoverlay, x, xNum, y, yNum;
  shooter = $("<div class='popper-shooter'></div>");
  shootercontrol = $("<div id='shooter-control'></div>");
  shooterbase = $("<div id='shooter-base'></div>");
  if (ROW_TURNS_CEILING !== 0) {
    if (ROW_TURNS_MULTIPLIER !== 0) {
      fornow = "<br>...for now";
    } else {
      fornow = "";
    }
    if (ROW_TURNS_RAND !== 1) {
      minCtr = Math.ceil(ROW_TURNS_CEILING / ROW_TURNS_RAND) + " to ";
    } else {
      minCtr = "";
    }
    rowcounterinfo = "<span id='rowcounterinfo'>New row every " + minCtr + ROW_TURNS_CEILING + " turns" + fornow + ".<br><br></span>";
  } else {
    rowcounterinfo = "";
  }
  if (ADDROW_TIMER_CEILING !== 0) {
    if (ADDROW_TIMER_MULTIPLIER < 1) {
      fornow = "<br>...for now";
    } else {
      fornow = "";
    }
    rowintervalinfo = "<span id='rowintervalinfo'>New row every " + ADDROW_TIMER_CEILING + " secs" + fornow + ".<br><br></span>";
  } else {
    rowintervalinfo = "";
  }
  startoverlay = $("<div id='startscreen' class='overlay' style='color: transparent'></div>");
  startoverlay.append("<p>Clear the board.<br /><br />\nConnect 3 or more of the similar colors to POP them.<br /><br /> " + rowcounterinfo + rowintervalinfo + "<button class=\"btn btn-primary btn-large startplaying\" style=\"display:none\">Start Playing</button><br />\n<span class=\"startmatch-container\" style=\"font-size: 16px; font-weight: normal\">or <a href=\"javascript:void(0)\" class=\"startmatch-btn\">start a match</a></span>\n</p>");
  gameoverlay = $("<div id='gameover' class='overlay'></div>");
  gameoverlay.append("<p>Game Over <i class='fa fa-frown-o'></i><br /><br />\n  <button class=\"btn btn-primary btn-large startplaying\" style=\"display:none\">Start Playing</button><br />\n  <span class=\"startmatch-container\" style=\"font-size: 16px; font-weight: normal\">or <a href=\"javascript:void(0)\" class=\"startmatch-btn\">start a match</a></span>\n</p>");
  pauseoverlay = $("<div id='pause' class='overlay'></div>");
  pauseoverlay.append("<p>Paused. o_O</p>");
  winoverlay = $("<div id='victory' class='overlay'></div>");
  winoverlay.append("\"\n<p>VICTORY! <i class='fa fa-smile-o'></i><br /><br />\n  <button class=\"btn btn-primary btn-large startplaying\" style=\"display:none\">Start Playing</button><br />\n  <span class=\"startmatch-container\" style=\"font-size: 16px; font-weight: normal\">or <a href=\"javascript:void(0)\" class=\"startmatch-btn\">start a match</a></span>\n</p>");
  noticeoverlay = $("<div id='notice-overlay'></div>");
  shooteroverlay = $("<div id='shooter-control-overlay'></div>");
  $("#popper-container").append(shootercontrol);
  $("#popper-container").append(shooterbase);
  $("#popper-container").append(shooteroverlay);
  $("#popper-container").append(gameoverlay);
  $("#popper-container").append(pauseoverlay);
  $("#popper-container").append(winoverlay);
  $("#popper-container").append(shooter);
  $("#popper-container").append(noticeoverlay);
  $("#popper-container").append(startoverlay);
  if (getUrlParam("start") === "true") {
    $("#startscreen").hide();
    unpause();
    $("#popper-container").css("cursor", "none");
  }
  rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length);
  currColor = BUBBLE_OPTIONS[rand];
  currColorClass = "popper-" + currColor;
  $(".popper-shooter").addClass(currColorClass);
  shooteroverlay.mousemove(function(e) {
    var rotatedeg;
    if (!(isLost || isPaused || isWon)) {
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
    if (!(isLost || isPaused || isWon)) {
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
    if (!shooting && !isLost && !isPaused && !isWon) {
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"));
      $("#shoot-at-deg").text("Shoot at: " + Math.round(rotatedeg * 10) / 10);
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot(rotatedeg);
      if (ROW_TURNS_CEILING !== 0) {
        addRowCounter += Math.floor(Math.random() * ROW_TURNS_RAND) + 1;
        if (addRowCounter >= Math.max(ROW_TURNS_FLOOR, ROW_TURNS_CEILING - ROW_TURNS_MULTIPLIER * numRowAdded)) {
          addRow();
          numRowAdded++;
          addRowCounter = 0;
        }
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
    if (!shooting && !isLost && !isPaused && !isWon) {
      e.preventDefault();
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"));
      $("#shoot-at-deg").text("Shoot at: " + Math.round(rotatedeg * 10) / 10);
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot(rotatedeg);
      if (ROW_TURNS_CEILING !== 0) {
        addRowCounter += Math.floor(Math.random() * ROW_TURNS_RAND) + 1;
        if (addRowCounter > ROW_TURNS_CEILING - ROW_TURNS_MULTIPLIER * numRowAdded) {
          addRow();
          numRowAdded++;
          addRowCounter = 0;
        }
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
  if (NUM_PER_ROW > 0) {
    xNum = NUM_PER_ROW;
  }
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
  if (ADDROW_TIMER_CEILING === 0) {
    $("#timer-container").hide();
    addRowCounterSecs = 1;
  } else {
    $("#timer-container").show();
    $("#addrowmeter").css("width", "100%");
    $("#timer").text(ADDROW_TIMER_CEILING).show();
    addRowCounterSecs = ADDROW_TIMER_CEILING;
    refresh = .1;
    window.addrow = setInterval((function() {
      if (isPaused === false) {
        $("#timer").text(Math.max(0, Math.ceil(addRowCounterSecs)));
        $("#addrowmeter").css("width", (addRowCounterSecs - 1 * refresh) / ADDROW_TIMER_CEILING * 100 + "%");
        if (addRowCounterSecs < 0) {
          addRow();
          numRowAdded++;
          addRowCounterSecs = Math.max(ADDROW_TIMER_MIN, ADDROW_TIMER_CEILING * Math.pow(ADDROW_TIMER_MULTIPLIER, numRowAdded));
        }
        return addRowCounterSecs = addRowCounterSecs - 1 * refresh;
      }
    }), 1000 * refresh);
  }
  addRows(DEFAULT_ROWS);
  $("#pause-button").click(function() {
    if (isPaused === false) {
      pause();
      return $(this).text("Go");
    } else {
      unpause();
      return $(this).text("Pause");
    }
  });
  $(".startplaying").click(function() {
    if (isWon || isLost) {
      return window.location = "?start=true";
    } else {
      $("#startscreen").hide();
      unpause();
      return $("#popper-container").css("cursor", "none");
    }
  });
  return $(".startmatch-btn").click(function() {
    var match;
    match = fb.child("matches").push();
    match.child("created_on").set(Firebase.ServerValue.TIMESTAMP);
    match.child("player1_id").set(user.id);
    match.child("players").child(user.id).set({
      userid: user.id,
      name: "Rando",
      points: 0,
      boardchange: {
        add: "",
        addrow: "",
        pop: "",
        currmatrix: "one"
      }
    });
    match.child("winner").set("");
    return $(".startmatch-container").html("<span style='font-size: 14px; font-weight: normal'>link to match: <input type='text' value='" + window.location.origin + "/?m=" + match.name() + "' /></span>");
  });
});

noticeFlash = function(str) {
  return $("#notice-overlay").html(str).show().fadeOut({
    duration: 1500
  });
};


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

addRow = function(colors, flash) {
  var color, div, i, loc, num, rand, _i, _j, _len, _len1, _ref;
  if (!isWon && !isLost) {
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
      num++;
    }
    if (flash !== void 0) {
      return noticeFlash(flash);
    }
  }
};

scoochAllDown = function(n) {
  var furthestRow, furthestRowReached, r;
  furthestRow = 0;
  furthestRowReached = false;
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
        if (furthestRowReached === false) {
          furthestRowReached = true;
          furthestRow = r + 1;
        }
      }
    }
  }
  toggleMatrixPosition();
  if (furthestRow > MAX_ROW_NUM) {
    return lose();
  }
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
  var delta, i, l, ldiv, multipler, target, topRow, topRowDFB, toploc, _i, _len;
  if (locs === void 0) {
    return;
  } else {
    if (locs instanceof Array) {
      if (locs.length === 0) {
        return;
      } else {
        locs = locs;
      }
    } else {
      locs = [locs];
    }
    if (type === "drop") {
      toploc = _.min(locs, function(d) {
        return d.row;
      });
      topRow = toploc.row;
      topRowDFB = bubbleMatrix[topRow][0].y - $("#popper-container").height();
    }
    i = 0;
    for (_i = 0, _len = locs.length; _i < _len; _i++) {
      l = locs[_i];
      bubbleMatrix[l.row][l.num].color = void 0;
      bubbleMatrix[l.row][l.num].div = void 0;
      ldiv = getDivFromLoc(l);
      if (type === "drop") {
        target = topRowDFB;
        multipler = Math.pow(l.row - topRow + 1, 1.1);
        delta = -50 * multipler;
        target = target + delta;
        if (i === locs.length - 1) {
          ldiv.animate({
            bottom: target + "px"
          }, {
            duration: 600,
            complete: function() {
              if (callback !== void 0) {
                callback();
              }
              return $(this).remove();
            }
          });
        } else {
          ldiv.animate({
            bottom: target + "px"
          }, {
            duration: 600,
            complete: function() {
              return $(this).remove();
            }
          });
        }
      } else {
        if (i === locs.length - 1) {
          ldiv.fadeOut({
            duration: 150,
            complete: function() {
              if (callback !== void 0) {
                setTimeout((function() {
                  return callback();
                }), 10);
              }
              return $(this).remove();
            }
          });
        } else {
          ldiv.fadeOut({
            duration: 150,
            complete: function() {
              return $(this).remove();
            }
          });
        }
      }
      i++;
    }
  }
};

getDivFromLoc = function(loc) {
  var div;
  div = $(".point[data-matrow=" + loc.row + "][data-matnum=" + loc.num + "]");
  return div;
};


/* END GAME */

lose = function() {
  $("#gameover").show();
  isLost = true;
  clearInterval(window.addrow);
  shooting = false;
  $("#pause-button").addClass("disabled");
  if (isMultiPlayer) {
    fb.child("matches").child(matchID).child("winner").set(opponentID);
  }
  $(".startmatch-btn").show();
  return $(".startplaying").show();
};

pause = function() {
  $("#pause").show();
  return isPaused = true;
};

unpause = function() {
  $("#pause").hide();
  return isPaused = false;
};

win = function() {
  $("#victory").show();
  clearInterval(window.addrow);
  isWon = true;
  shooting = false;
  $("#pause-button").addClass("disabled");
  $(".startmatch-btn").show();
  return $(".startplaying").show();
};

checkIfWon = function() {
  var didIWin, l, n, r;
  didIWin = true;
  r = 0;
  while (r < bubbleMatrix.length) {
    n = 0;
    while (n < bubbleMatrix[r].length) {
      l = {
        row: r,
        num: n
      };
      if (!isMatrixLocEmpty(l)) {
        didIWin = false;
        break;
      }
      n++;
    }
    r++;
  }
  return didIWin;
};

addToScore = function(deltaScore) {
  var newScore, oldScore;
  oldScore = parseInt($("#score").text());
  newScore = oldScore + deltaScore;
  if (newScore < 10) {
    return $("#score").text("0000" + newScore);
  } else if (newScore >= 10) {
    return $("#score").text("000" + newScore);
  } else if (newScore >= 100) {
    return $("#score").text("00" + newScore);
  } else if (newScore >= 1000) {
    return $("#score").text("0" + newScore);
  } else if (newScore >= 10000) {
    return $("#score").text(newScore);
  } else {
    $("#score").text(newScore);
    return $("#score-container").css("font-size", "28px");
  }
};

addToScrewQueue = function(arr, type) {
  var c, color, i, _i, _j, _len, _len1, _results;
  _results = [];
  for (_i = 0, _len = arr.length; _i < _len; _i++) {
    i = arr[_i];
    if (type === "locs") {
      color = bubbleMatrix[i.row][i.num].color;
    } else if (type === "colors") {
      color = i;
    }
    screwQueue.push(color);
    $(".screwqueue-" + (screwQueue.length - 1)).addClass("popper-" + color);
    if (screwQueue.length === 10) {
      fb.child("matches").child(matchID).child("transit").push({
        from: user.id,
        to: opponentID,
        addrow: screwQueue
      });
      screwQueue = [];
      for (_j = 0, _len1 = BUBBLE_OPTIONS.length; _j < _len1; _j++) {
        c = BUBBLE_OPTIONS[_j];
        $(".screwqueue-ball").removeClass("popper-" + c);
      }
    }
    _results.push($("#screwqueue-length").text(screwQueue.length));
  }
  return _results;
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
  var c, coords, deltaScore, div, i, numToAdd, rand, sameColorLocs, screwColors;
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
      addToScore(sameColorLocs.length);
      if (isMultiPlayer) {
        numToAdd = Math.floor(sameColorLocs.length / 2);
        i = 0;
        screwColors = [];
        while (i < numToAdd) {
          i++;
          rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length);
          c = BUBBLE_OPTIONS[rand];
          screwColors.push(c);
        }
        addToScrewQueue(screwColors, "colors");
      }
      drop(sameColorLocs, "fade", function() {
        var b, bonuspts, bonussec, furthest, l, loc_i, looseguys, n, newsec, r, topsChecked, wallcluster, _i, _len, _ref;
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
        if (looseguys.length > 0) {
          bonussec = Math.round(looseguys.length * DROP_TIME_MULTIPLER);
          newsec = addRowCounterSecs + bonussec;
          newsec = Math.min(newsec, ADDROW_TIMER_CEILING);
          addRowCounterSecs = newsec;
          $("#addrowmeter").css("width", addRowCounterSecs / ADDROW_TIMER_CEILING * 100 + "%");
        }
        if (looseguys.length > 0) {
          bonuspts = Math.ceil(Math.pow(looseguys.length, DROP_MULTIPLER));
          if (bonuspts > 1) {
            noticeFlash("<small>Dropped " + looseguys.length + "!</small><br />" + bonuspts + " bonus points!!");
          } else if (bonuspts === 1) {
            noticeFlash("<small>Dropped 1</small><br />" + bonuspts + " bonus point!");
          }
        } else {
          bonuspts = 0;
        }
        addToScore(looseguys.length + bonuspts);
        if (isMultiPlayer) {
          addToScrewQueue(looseguys, "locs");
        }
        drop(looseguys, "drop", function() {
          if (checkIfWon() === true) {
            return win();
          }
        });
        if (checkIfWon() === true) {
          return win();
        }
      });
    } else {
      if (loc.row > MAX_ROW_NUM) {
        lose();
        div = $(".point").last();
        div.css("background-color", "#DDD").css("border-color", "#BBB");
      }
    }
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
