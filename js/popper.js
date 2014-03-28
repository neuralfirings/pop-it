// BUBBLE_DIAMETER = 30;
BUBBLE_BORDER = 5;
BUBBLE_RADIUS = 25;
CONTAINER_BORDER = 5;
SPEED = 20;

$(document).ready(function() {
  shooting = false;
  gameover = false;
  shooter = $("<div class='popper-shooter'></div>");
  $("#popper-container").append(shooter);
  $("#rotateslider").change(function() {
    shooter.css("transform", "rotate(" + $(this).val() + "deg" + ")");
  });

  pdiv = $("<div class='point'></div>");
  pdiv.css("width", BUBBLE_RADIUS*2 + "px").css("height", BUBBLE_RADIUS*2 + "px");
  pdiv.css("border", "solid " + BUBBLE_BORDER + "px #AAA")
  $("#popper-container").append(pdiv);

  shootercontrol = $('<div id="shooter-control"></div>');
  shooteroverlay = $('<div id="shooter-control-overlay"></div>');
  gameoverlay = $('<div id="gameover"></div>');
  gameoverlay.append("<div style='color: #300; text-align: center; font-size: 60px; margin-top: 200px'><strong>Game Over <i class='fa fa-frown-o'></i></strong></div>")
  $("#popper-container").append(shootercontrol);
  $("#popper-container").append(shooteroverlay);
  $("#popper-container").append(gameoverlay);

  // TO DO: combine the following
  colors = ["red"]//, "green", "blue", "yellow"]
  rand = Math.floor(Math.random() * colors.length);
  currColor = colors[rand];
  currColorClass = "popper-" + currColor;
  $(".popper-shooter").addClass(currColorClass);

  shooteroverlay.mousemove(function(e) {
    if (!gameover) {
      rotatedeg = (e.pageX - $(this).offset().left)/$(this).outerWidth() * 160 - 80;
      $(".popper-shooter").data("rotatedeg", rotatedeg);
      $(".popper-shooter").css("transform", "rotate(" + rotatedeg + "deg" + ")");
      $("#shooter-rotate-deg").text("Shooter at " + Math.round(rotatedeg*10)/10);
    }
  });
  shooteroverlay.bind('touchmove', function(e) {
    if (!gameover) {
      e.preventDefault();
      rotatedeg = (e.originalEvent.touches[0].pageX - $(this).offset().left)/$(this).outerWidth() * 160 - 80;
      rotatedeg = Math.max(-80, rotatedeg); 
      rotatedeg = Math.min(80, rotatedeg); 
      $(".popper-shooter").data("rotatedeg", rotatedeg);
      $(".popper-shooter").css("transform", "rotate(" + rotatedeg + "deg" + ")");
      $("#shooter-rotate-deg").text("Shooter at " + Math.round(rotatedeg*10)/10);
    }
  });
  shooteroverlay.click(function(e) {
    if(!shooting && !gameover) {
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"));
      $("#shoot-at-deg").text("Shoot at: " + Math.round(rotatedeg*10)/10);
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot(rotatedeg)
      for(var i=0; i<colors.length; i++) {
        $(".popper-shooter").removeClass("popper-" + colors[i]);
      }
      rand = Math.floor(Math.random() * colors.length);
      currColor = colors[rand];
      currColorClass = "popper-" + currColor;
      $(".popper-shooter").addClass(currColorClass);
    }
  });
  shooteroverlay.bind('touchend', function(e) {
    if(!shooting && !gameover) {
      e.preventDefault();
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"));//(touchPageX - $(this).offset().left)/$(this).outerWidth() * 160 - 80;
      $("#shoot-at-deg").text("Shoot at: " + Math.round(rotatedeg*10)/10);
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot(rotatedeg);
      for(var i=0; i<colors.length; i++) {
        $(".popper-shooter").removeClass("popper-" + colors[i]);
      }
      rand = Math.floor(Math.random() * colors.length);
      currColor = colors[rand];
      currColorClass = "popper-" + currColor;
      $(".popper-shooter").addClass(currColorClass);
    }
  });

  // make position matrix
  w = $("#popper-container").width(); 
  h = $("#popper-container").outerHeight()-BUBBLE_RADIUS*2-BUBBLE_BORDER*2; 
  xNum = Math.floor(w/(BUBBLE_RADIUS*2)-0.5);
  yNum = Math.floor(h/(BUBBLE_RADIUS*2)-0.5)*1.5-1;
  margin = (w-(xNum+0.5)*BUBBLE_RADIUS*2)/2;
  bubbleMatrix = [];

  for (var j=0; j < yNum; j++) { // each row
    bubbleMatrix[j] = []
    for (var i=0; i < xNum; i++) { // each bubble in row
      if (j%2==0) {
        x = i*BUBBLE_RADIUS*2+margin;
        y = h;
      } else {
        x = i*BUBBLE_RADIUS*2+BUBBLE_RADIUS+margin;
      }
      y = h-BUBBLE_RADIUS*j*1.7;
      bubbleMatrix[j][i] = { x: x, y: y }
      // $("#popper-container").createBubble().drawAt(x, y);
    }
  }
})

jQuery.fn.createBubble = function() {
  div = $("<div class='point'></div>");
  div.css("width", BUBBLE_RADIUS*2 + "px").css("height", BUBBLE_RADIUS*2 + "px").css("border-width", BUBBLE_BORDER + "px")
  $(this[0]).append(div);
  return div;
}

function getSlope(startDeg) {
  aDeg = 90 - Math.abs(startDeg);
  aRad = aDeg * Math.PI / 180;
  m = Math.tan(aRad);
  return m;
}

function getPointAtT(t, startDeg) {
  w = $("#popper-container").outerWidth()-BUBBLE_RADIUS*2-BUBBLE_BORDER*2; 
  m = getSlope(startDeg);

  // DERIVATION!!!
  // y = x*m
  // x^2 + y^2 = t^2
  // x^2 + x^2*m^2 = t^2
  // (1 + m^2)*x^2 = t^2
  // x^2 = t^2/(1 + m^2)
  // x = (t^2/(1 + m^2))^0.5
  // x = t/(1+m^2)^0.5
  x = t/Math.pow(1 + m*m, 0.5);
  y = x*m;

  if(startDeg==0) { // straight up
    x = 0;
    y = t;
  } else { // turn right by default
    dir = Math.ceil((x+w/2)/w);
    k = Math.floor((x/w+0.5)/2)*2;
    if(dir%2==1) {
      x = x-w*k;
    } else {
      x = w-(x-w*k);
    }
    if(startDeg<0) { // turn left
      x=-x;
    }
  }
  x = x + w/2; // scooch point over so x=0 starts at bottom left hand side
  y = y-BUBBLE_RADIUS;
  point = { x: x, y: y};
  return point;
}

function getPointAtY(y, startDeg) {
  w = $("#popper-container").outerWidth()-BUBBLE_RADIUS*2-BUBBLE_BORDER*2; 
  m = getSlope(startDeg);
  x = y/m;
  t = x*Math.pow(1 + m*m, 0.5)
  return getPointAtT(t, startDeg);
}

function findClosestInMatrix(x, y) {
  // TEAM BRUTE FORCE! :D
  minDistance = 5000;
  minMatrixCoords = {x: "", y: ""}
  minMatrix = {row: "", num: ""}
  for (var i=0; i<bubbleMatrix.length; i++) { // goes through each row
    for (var j=0; j<bubbleMatrix[0].length; j++) { // goes through each bubble IN a row
      thisDistance = Math.pow(Math.pow(bubbleMatrix[i][j].x-x, 2) + Math.pow(bubbleMatrix[i][j].y-y, 2), 0.5)
      if (thisDistance < minDistance) {
        minMatrixCoords.x = bubbleMatrix[i][j].x;
        minMatrixCoords.y = bubbleMatrix[i][j].y;
        minMatrix.row = i;
        minMatrix.num = j;
        minDistance = thisDistance;
      }
    }
  }
  return minMatrix;
  // return minMatrixCoords;
}

function isMatrixLocEmpty(loc) {
  if (loc.row<0 || loc.row>bubbleMatrix.length-1 || loc.num<0 || loc.num>bubbleMatrix[0].length-1)
    return true;
  else
    return bubbleMatrix[loc.row][loc.num].div == undefined
}

jQuery.fn.putInMatrix = function(loc) {
  div = $(this[0])
  bubbleMatrix[loc.row][loc.num].div = div
  bubbleMatrix[loc.row][loc.num].color = div.attr("data-color")
  coords = bubbleMatrix[loc.row][loc.num]
  div.drawAt(coords.x, coords.y);
  div.attr("data-matrow", loc.row);
  div.attr("data-matnum", loc.num);
  div.text(loc.row  + ", " + loc.num)

  // enviro = lookAround(loc)
  x = checkSameColor(loc, "red")
  console.log("aftercheck", x)
  // sameColorLocs = []
}

jQuery.fn.drawAt = function(x, y) {
  $(this[0]).show().css("bottom", y+ "px").css("left", + x + "px");
}


checkSameColor2 = function(loc, color, n) {
  if(n==undefined) {
    n=0;
    checkedBefore = [];
  } else {
    n=n+1;
  }
  if (n<100) {
    if ($.inArray("r"+loc.row+"n"+loc.num, checkedBefore) != -1) { // checked already
      return false;
    } else {
      checkedBefore.push("r"+loc.row+"n"+loc.num);
      if (isMatrixLocEmpty(loc)) { // not on the grid
        return false;
      } else {
        if (bubbleMatrix[loc.row][loc.num].color != color) { // not the right color {
          // recursive stuff here
        }
      }
    }
  }
}


checkedBefore = [];
checkSameColor = function(loc, color, n)  {
  console.log(checkedBefore)
  if(n==undefined) {
    n=0;
    checkedBefore = [];
  } else {
    n=n+1;
  }
  if (n<100) {
    if ($.inArray("r"+loc.row+"n"+loc.num, checkedBefore) != -1) {
      return false;
    } else {
      checkedBefore.push("r"+loc.row+"n"+loc.num);
      if (bubbleMatrix[loc.row][loc.num].color == color) {
        enviro = lookAround(loc);
        ctr = 0
        result = []
        for(var i=0; i<enviro.length; i++) {
          if (!isMatrixLocEmpty(enviro[i])) {
            data = checkSameColor(enviro[i], color, n)
            if (data) {
              result = result.concat(data)
            }
          } 
        }
        console.log ("returned", result.concat(loc))
        return result.concat(loc) 
      } 
    }
  }
}


//   sameColorLocs.push(loc);
//   console.log("pushed loc", loc)
//   color = bubbleMatrix[loc.row][loc.num].color
//   enviro = lookAround(loc);
//   for(var i=0; i<enviro.length; i++) {
//     newloc = enviro[i]
//     if(!isMatrixLocEmpty(newloc)) {
//       if ($.inArray(newloc, checkedBefore) == -1 && bubbleMatrix[newloc.row][newloc.num].color == color) {
//         // console.log("same color!", newloc.row, newloc.num);

//         sameColorLocs2 = checkSameColor(newloc)
//         if(sameColorLocs2.length>0) {
//           sameColorLocs = sameColorLocs.concat(sameColorLocs2);
//         }
//         return sameColorLocs; 
//       } else {
//         return [];
//       }
//     }
//   }
// }

// returns a list of locations in bMatrix
lookAround = function(loc) {
  div = $(this[0])
  row = loc.row //$(this[0]).attr("data-matrow")
  num = loc.num //$(this[0]).attr("data-matnum")
  enviro = []
  
  if (row % 2 == 0) { alt = -1 } else { alt = 0 } // even vs. odd row
  if (row == 0 ) { top = true } else { top = false };
  if (num == 0 ) { left = true } else { left = false }
  if (num >= bubbleMatrix[0].length) { right = true } else { right = false }; 

  // if (!top && !left ) { enviro.push({row: row-1, num: num+alt}); }
  // if (!top && !right) { enviro.push({row: row-1, num: num+alt+1}); }
  // if (!left) { enviro.push({row: row, num: num-1}); }
  // if (!right) { enviro.push({row: row, num: num+1}); }
  // if (!left) { enviro.push({row: row+1, num: num}); }
  // if (!right) { enviro.push({row: row+1, num: num+1}); }
  enviro.push(bubbleMatrix[row-1][num+alt  ]);
  enviro.push(bubbleMatrix[row-1][num+alt+1]); 
  enviro.push(bubbleMatrix[row  ][num-1    ]); 
  enviro.push(bubbleMatrix[row  ][num+1    ]); 
  enviro.push(bubbleMatrix[row+1][num      ]); 
  enviro.push(bubbleMatrix[row+1][num+1    ]); 
  // enviro.push({row: row-1, num: num+alt}); 
  // enviro.push({row: row-1, num: num+alt+1}); 
  // enviro.push({row: row, num: num-1}); 
  // enviro.push({row: row, num: num+1}); 
  // enviro.push({row: row+1, num: num}); 
  // enviro.push({row: row+1, num: num+1}); 

  // if(row == 0) { // wall 
  //   enviro.push({row: row, num: num-1})
  //   enviro.push({row: row, num: num+1})
  //   enviro.push({row: row+1, num: num-1})
  //   enviro.push({row: row+1, num: num})
  // } else {
  //   if(row % 2 == 0) { // even row
  //     enviro.push({row: row-1, num: num-1}) // [num-1])
  //     enviro.push({row: row-1, num: num }) //[num])
  //     enviro.push({row: row, num: num-1})
  //     enviro.push({row: row, num: num+1})
  //     enviro.push({row: row+1, num: num-1})
  //     enviro.push({row: row+1, num: num})
  //   } else { // odd row
  //     enviro.push({row: row-1, num: num}) // [num-1])
  //     enviro.push({row: row-1, num: num+1}) //[num])
  //     enviro.push({row: row, num: num-1})
  //     enviro.push({row: row, num: num+1})
  //     enviro.push({row: row+1, num: num})
  //     enviro.push({row: row+1, num: num+1})
  //   }
  // }

  return enviro
}

jQuery.fn.shoot = function(startDeg) {
  div = $(this[0])
  clearInterval(window.shootInterval);
  prevMatrixLoc = {row: "", num: ""}
  h = $("#popper-container").outerHeight()-BUBBLE_RADIUS*2-BUBBLE_BORDER*2; 
  t = 0;
  ctr = 0;
  window.shootInterval = setInterval(function() {
    shooting = true;
    p = getPointAtT(t, startDeg);
    if (p.y <= h) {
      currMatrixLoc = findClosestInMatrix(p.x, p.y);
      if(isMatrixLocEmpty(currMatrixLoc)) { // free space!
        if(ctr%2 == 0) { // draw every other interval
          div.drawAt(p.x, p.y);
        }
        prevMatrixLoc = currMatrixLoc;
        t+=SPEED;
      } else { // occupied space :(
        clearInterval(window.shootInterval);
        shooting = false;
        if(prevMatrixLoc.row > 8) { // Option 4: game over x_x
          $("#gameover").show();
          gameover = true;
          div.remove();
        } else { // Option 3: drop it in lines 3+
          div.putInMatrix(prevMatrixLoc)
        }
      }
    } else { // top of the container!!
      clearInterval(window.shootInterval);
      shooting = false;
      coords = getPointAtY(h+BUBBLE_RADIUS, startDeg);
      currMatrixLoc = findClosestInMatrix(coords.x, coords.y);
      if(isMatrixLocEmpty(currMatrixLoc)) { // Option 1: free space at top!! drop in line 1
        div.putInMatrix(currMatrixLoc)
      } else { // Option 2: occupied space drop in line 2
        div.putInMatrix(prevMatrixLoc)
      }
    }
  }, 5);

  return div;
}