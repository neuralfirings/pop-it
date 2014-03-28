# Some constants
# Do stuff with this so it's not so global later
BUBBLE_BORDER = 5
BUBBLE_RADIUS = 25
CONTAINER_BORDER = 5
SPEED = 20
bubbleMatrix = []

$(document).ready ->
  shooting = false
  gameover = false

  shooter = $("<div class='popper-shooter'></div>")
  shootercontrol = $("<div id='shooter-control'></div>")
  shooteroverlay = $("<div id='shooter-control-overlay'></div>")
  gameoverlay = $("<div id='gameover'></div>")
  gameoverlay.append "<div style='color: #300; text-align: center; font-size: 60px; margin-top: 200px'><strong>Game Over <i class='fa fa-frown-o'></i></strong></div>"
  $("#popper-container").append shootercontrol
  $("#popper-container").append shooteroverlay
  $("#popper-container").append gameoverlay
  $("#popper-container").append shooter

  # Shooter code
  colors = ["red", "green", "yellow", "blue"]
  rand = Math.floor(Math.random() * colors.length)
  currColor = colors[rand]
  currColorClass = "popper-" + currColor
  $(".popper-shooter").addClass currColorClass
  shooteroverlay.mousemove (e) ->
    unless gameover
      rotatedeg = (e.pageX - $(this).offset().left) / $(this).outerWidth() * 160 - 80
      $(".popper-shooter").data "rotatedeg", rotatedeg
      $(".popper-shooter").css "transform", "rotate(" + rotatedeg + "deg" + ")"
      $("#shooter-rotate-deg").text "Shooter at " + Math.round(rotatedeg * 10) / 10
    return

  shooteroverlay.bind "touchmove", (e) ->
    unless gameover
      e.preventDefault()
      rotatedeg = (e.originalEvent.touches[0].pageX - $(this).offset().left) / $(this).outerWidth() * 160 - 80
      rotatedeg = Math.max(-80, rotatedeg)
      rotatedeg = Math.min(80, rotatedeg)
      $(".popper-shooter").data "rotatedeg", rotatedeg
      $(".popper-shooter").css "transform", "rotate(" + rotatedeg + "deg" + ")"
      $("#shooter-rotate-deg").text "Shooter at " + Math.round(rotatedeg * 10) / 10
    return

  shooteroverlay.click (e) ->
    if not shooting and not gameover
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"))
      $("#shoot-at-deg").text "Shoot at: " + Math.round(rotatedeg * 10) / 10
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot rotatedeg
      i = 0

      while i < colors.length
        $(".popper-shooter").removeClass "popper-" + colors[i]
        i++
      rand = Math.floor(Math.random() * colors.length)
      currColor = colors[rand]
      currColorClass = "popper-" + currColor
      $(".popper-shooter").addClass currColorClass
    return

  shooteroverlay.bind "touchend", (e) ->
    if not shooting and not gameover
      e.preventDefault()
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"))
      $("#shoot-at-deg").text "Shoot at: " + Math.round(rotatedeg * 10) / 10
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot rotatedeg
      i = 0

      while i < colors.length
        $(".popper-shooter").removeClass "popper-" + colors[i]
        i++
      rand = Math.floor(Math.random() * colors.length)
      currColor = colors[rand]
      currColorClass = "popper-" + currColor
      $(".popper-shooter").addClass currColorClass
    return

  # Making the bubble Matrix
  w = $("#popper-container").width()
  h = $("#popper-container").outerHeight() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2
  xNum = Math.floor(w / (BUBBLE_RADIUS * 2) - 0.5)
  yNum = Math.floor(h / (BUBBLE_RADIUS * 2) - 0.5) * 1.5 - 1
  margin = (w - (xNum + 0.5) * BUBBLE_RADIUS * 2) / 2
  bubbleMatrix = []

  j = 0
  while j < yNum
    bubbleMatrix[j] = []
    i = 0
    while i < xNum
      if j % 2 is 0
        x = i * BUBBLE_RADIUS * 2 + margin
        y = h
      else
        x = i * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + margin
      y = h - BUBBLE_RADIUS * j * 1.7
      bubbleMatrix[j][i] =
        x: x
        y: y
      i++
    j++
  return



#####################################################################
### The next set of functions are for getting the bubble to shoot ###
#####################################################################

# You know, they really should just make middle school kids
# write this game to learn their trig
getSlope = (startDeg) ->
  aDeg = 90 - Math.abs(startDeg)
  aRad = aDeg * Math.PI / 180
  m = Math.tan(aRad)
  m

# get point along the path, the t = path
# I think it's "t" because it's usually refers to time
# I don't know.. parametric geometry from 8th grade stuff
getPointAtT = (t, startDeg) ->
  w = $("#popper-container").outerWidth() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2
  m = getSlope(startDeg)
  
  # DERIVATION!!! Gotta show your work! My math teacher would be proud...
  # y = x*m
  # x^2 + y^2 = t^2
  # x^2 + x^2*m^2 = t^2
  # (1 + m^2)*x^2 = t^2
  # x^2 = t^2/(1 + m^2)
  # x = (t^2/(1 + m^2))^0.5
  # x = t/(1+m^2)^0.5
  x = t / Math.pow(1 + m * m, 0.5)
  y = x * m
  if startDeg is 0 # straight up
    x = 0
    y = t
  else # turn right by default
    dir = Math.ceil((x + w / 2) / w)
    k = Math.floor((x / w + 0.5) / 2) * 2
    if dir % 2 is 1
      x = x - w * k
    else
      x = w - (x - w * k)
    # turn left
    x = -x  if startDeg < 0
  x = x + w / 2 # scooch point over so x=0 starts at bottom left hand side
  y = y - BUBBLE_RADIUS
  point =
    x: x
    y: y

  point
getPointAtY = (y, startDeg) ->
  w = $("#popper-container").outerWidth() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2
  m = getSlope(startDeg)
  x = y / m
  t = x * Math.pow(1 + m * m, 0.5)
  getPointAtT t, startDeg

# find closest point so the bubble can get to the right place
findClosestInMatrix = (x, y) ->
  # TEAM BRUTE FORCE! :D
  minDistance = 5000
  minMatrixCoords =
    x: ""
    y: ""

  minMatrix =
    row: ""
    num: ""

  i = 0 # goes through each row
  while i < bubbleMatrix.length
    j = 0 # goes through each bubble IN a row

    while j < bubbleMatrix[0].length
      thisDistance = Math.pow(Math.pow(bubbleMatrix[i][j].x - x, 2) + Math.pow(bubbleMatrix[i][j].y - y, 2), 0.5)
      if thisDistance < minDistance
        minMatrixCoords.x = bubbleMatrix[i][j].x
        minMatrixCoords.y = bubbleMatrix[i][j].y
        minMatrix.row = i
        minMatrix.num = j
        minDistance = thisDistance
      j++
    i++
  minMatrix

#####################################################################
### The next set of functions are for returning clusters of color ###
#####################################################################

checkSameColor = (loc, n, checkedBefore) ->
  if n is undefined # new check
    n = 0
  else
    n++

  if checkedBefore is undefined # new check
    checkedBefore = []

  checkedBefore.push stringifyLoc(loc)
  arr = [loc] # [stringifyLoc(loc)] # turning this on returns readable stuff in console.log
  if n < 1000 # in case of infinite loop
    enviro = lookAround(loc)
    for l in enviro
      if $.inArray(stringifyLoc(l), checkedBefore) is -1 # verify it's not already checked
        checkedBefore.push stringifyLoc(l)
        if getColor(l) is getColor(loc) # verify that it's the right color
          arr = arr.concat checkSameColor(l, n, checkedBefore)
    return arr
  else
    console.log "too many recursions"

isMatrixLocEmpty = (loc) ->
  if loc.row < 0 or loc.row > bubbleMatrix.length - 1 or loc.num < 0 or loc.num > bubbleMatrix[0].length - 1
    true
  else
    bubbleMatrix[loc.row][loc.num].div is `undefined`

stringifyLoc = (loc) ->
  return loc.row + "," + loc.num

# row could be a location object, or a number
getColor = (row, num) ->
  if row.row == undefined
    return bubbleMatrix[row][num].color
  else
    return bubbleMatrix[row.row][row.num].color

# returns a list of location where there are bubbles around loc
lookAround = (loc) ->
  div = $(this[0])
  row = loc.row 
  num = loc.num 
  enviro = []
  if row % 2 is 0 # even vs. odd row
    alt = -1
  else
    alt = 0
  
  enviro.push { row: row-1, num: num+alt }
  enviro.push { row: row-1, num: num+alt+1 }
  enviro.push { row: row  , num: num-1 }
  enviro.push { row: row  , num: num+1 }
  enviro.push { row: row+1, num: num+alt }
  enviro.push { row: row+1, num: num+alt+1 }

  enviro2 = []
  for l in enviro 
    if !isMatrixLocEmpty(l)
      # l.color = getColor(l.row, l.num)
      enviro2.push l

  return enviro2

############################################################
### jQuery add ons, mostly relatied to shooting a bubble ###
############################################################

jQuery.fn.createBubble = ->
  div = $("<div class='point'></div>")
  div.css("width", BUBBLE_RADIUS * 2 + "px").css("height", BUBBLE_RADIUS * 2 + "px").css "border-width", BUBBLE_BORDER + "px"
  $(this[0]).append div
  div

jQuery.fn.putInMatrix = (loc) ->
  div = $(this[0])
  bubbleMatrix[loc.row][loc.num].div = div
  bubbleMatrix[loc.row][loc.num].color = div.attr("data-color")
  coords = bubbleMatrix[loc.row][loc.num]
  div.drawAt coords.x, coords.y
  div.attr "data-matrow", loc.row
  div.attr "data-matnum", loc.num
  div.text loc.row + ", " + loc.num
  return

jQuery.fn.drawAt = (x, y) ->
  $(this[0]).show().css("bottom", y + "px").css "left", +x + "px"
  return

jQuery.fn.shoot = (startDeg) ->
  div = $(this[0])
  clearInterval window.shootInterval
  prevMatrixLoc =
    row: ""
    num: ""

  h = $("#popper-container").outerHeight() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2
  t = 0
  ctr = 0
  window.shootInterval = setInterval(->
    shooting = true
    p = getPointAtT(t, startDeg)
    if p.y <= h
      currMatrixLoc = findClosestInMatrix(p.x, p.y)
      if isMatrixLocEmpty(currMatrixLoc) # free space!
        # draw every other interval
        div.drawAt p.x, p.y  if ctr % 2 is 0
        prevMatrixLoc = currMatrixLoc
        t += SPEED
      else # occupied space :(
        clearInterval window.shootInterval
        shooting = false
        if prevMatrixLoc.row > 8 # Option 4: game over x_x
          $("#gameover").show()
          gameover = true
          div.remove()
        else # Option 3: drop it in lines 3+
          div.putInMatrix prevMatrixLoc
    else # top of the container!!
      clearInterval window.shootInterval
      shooting = false
      coords = getPointAtY(h + BUBBLE_RADIUS, startDeg)
      currMatrixLoc = findClosestInMatrix(coords.x, coords.y)
      if isMatrixLocEmpty(currMatrixLoc) # Option 1: free space at top!! drop in line 1
        div.putInMatrix currMatrixLoc
      else # Option 2: occupied space drop in line 2
        div.putInMatrix prevMatrixLoc
    return
  , 5)
  div