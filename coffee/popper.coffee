# Some constants
# Do stuff with this so it's not so global later

NUM_PER_ROW = 10 # Number of bubbles per row

BUBBLE_OPTIONS = ["red", "green", "yellow", "blue"] # should corrlate with CSS classes
DEFAULT_ROWS = 3 # how many rows you start with
MAX_ROW_NUM = 10 # after this it's game over sadface

SPEED = 20 # speed of the shooter
MAX_ANGLE = 75 # max angle of the shooter

ROW_TURNS_CEILING = 0 # when counter reaches this it adds a new row, so lower the number is harder; 0 for infinite
ROW_TURNS_FLOOR = 3 # min number of turns before ceiling (random factory included)
ROW_TURNS_RAND = 2 # as counter increments, it can increment 1-this number at random 
ROW_TURNS_MULTIPLIER = 0 # as you get more turns, row ceiling gets lower (not exponentially)

ADDROW_TIMER_CEILING = 20  # seconds before new layer, 0 for infinite
ADDROW_TIMER_MIN = 5  # mininum seconds before new layer
ADDROW_TIMER_MULTIPLIER = .95  # as you get more turns your seconds drop (exponentially)

DROP_MULTIPLER = 1.2 # multiple of points you get when you drop bubbles
DROP_TIME_MULTIPLER = 2.5 # dropped * this = extra seconds you get

# URL Params.. for easy play testing
getUrlParam = (name) ->
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
  regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  results = regex.exec(location.search)
  (if not results? then "" else decodeURIComponent(results[1].replace(/\+/g, " ").replace(/\//g, '')))
if getUrlParam("num") != ""
  NUM_PER_ROW = parseFloat(getUrlParam("num"))
if getUrlParam("maxrows") != ""
  MAX_ROW_NUM = parseFloat(getUrlParam("maxrows"))
if getUrlParam("startrows") != ""
  DEFAULT_ROWS = parseFloat(getUrlParam("startrows"))

if getUrlParam("speed") != ""
  SPEED = parseFloat(getUrlParam("speed"))
if getUrlParam("angle") != ""
  MAX_ANGLE = parseFloat(getUrlParam("angle"))

if getUrlParam("turnmax") != ""
  ROW_TURNS_CEILING = parseFloat(getUrlParam("turnmax"))
if getUrlParam("turnmin") != ""
  ROW_TURNS_FLOOR = parseFloat(getUrlParam("turnmin"))
if getUrlParam("turnrand") != ""
  ROW_TURNS_RAND = parseFloat(getUrlParam("turnrand"))
if getUrlParam("turnaccel") != ""
  ROW_TURNS_MULTIPLIER = parseFloat(getUrlParam("turnaccel"))

if getUrlParam("timermax") != ""
  ADDROW_TIMER_CEILING = parseFloat(getUrlParam("timermax"))
if getUrlParam("timermin") != ""
  ADDROW_TIMER_MIN = parseFloat(getUrlParam("timermin"))
if getUrlParam("timeraccel") != ""
  ADDROW_TIMER_MULTIPLIER = parseFloat(getUrlParam("timeraccel"))

if getUrlParam("droppoints") != ""
  DROP_MULTIPLER = parseFloat(getUrlParam("droppoints"))
if getUrlParam("droptime") != ""
  DROP_TIME_MULTIPLER = parseFloat(getUrlParam("droptime"))

# not so constant constants
BUBBLE_BORDER = 5 # constant, I think
BUBBLE_RADIUS = 25 # change to number of bubbles
CONTAINER_BORDER = 5 # constant

# starter values
shooting = false 
isGameOver = false
isPaused = true
isWon = false
currMatrix = ""
bubbleMatrix = [] # the matrix currently in use
bubbleMatrixOne = [] # because of the hexagonal thing
bubbleMatrixTwo = [] # because of the hexagonal thing
addRowCounter = 0 # starter value
addRowCounterSecs = 1
numRowAdded = 0
isMultiPlayer = false
screwQueue = []
myPlayerNum = 0

fb = new Firebase("https://pop-it.firebaseio.com/")
user = ""
isLoggedIn = false
autoLogIn = true
auth = new FirebaseSimpleLogin(fb, (e, u) ->
  if e
    console.log "Firebase error: " + e
    # $("#startplaying").show()
    # $("#startscreen").css("color", "#888") # show start screen
  else if u 
    user = u
    console.log "Anonymouse User " + u.id
    match_id = getUrlParam("m")
    if match_id != "" # game on
      match = fb.child("matches").child(match_id)
      match.on("value", (d) -> 
        if d.val() != null # Make sure it's not a ghost game
          if d.val().player1 != undefined and d.val().player1 == user.id # you are player 1
              console.log "You are Player 1!"
              isMultiPlayer = true
              $("#startplaying").text("Start Match") 
              myPlayerNum = 1
              if d.val().player2 == undefined
                console.log "waiting for your opponent"
                $("#startplaying").addClass("disabled").text("waiting for opponent")
              else
                opponentID = d.val().player2
                $("#startplaying").removeClass("disabled").text("Start Match")
          else if d.val().player2 != undefined and d.val().player2 == user.id # you are player 2
              console.log "You are Player 2!"
              isMultiPlayer = true
              $("#startplaying").text("Start Match")
              myPlayerNum = 2
              opponentID = d.val().player1
          else if d.val().player2 == undefined # you are the NEW player 2
              match.child("player2").set(user.id) 
              isMultiPlayer = true
              console.log "You are Player 2!"
              $("#startplaying").text("Start Match")
              myPlayerNum = 2
              opponentID = d.val().player1
        if isMultiPlayer == true
          console.log "game on"
          clearInterval(window.addrow)
          $("#timer-container").hide()
          $("#startscreen").find("#rowintervalinfo").hide()
          $("#startscreen").find("#rowcounterinfo").hide()
          ROW_TURNS_CEILING = 0
          ADDROW_TIMER_CEILING = 0

          sqdiv = $("<div class='screwqueue-container'><div>Send when full</div></div>")
          i = 0
          while i < NUM_PER_ROW
            sqdiv.append "<div class='screwqueue-ball screwqueue-" + i + "'></div>"
            i++
          $("#popper-container").append sqdiv

          if !$("#startplaying").hasClass("disabled")
            opponentBoard = fb.child("players").child(opponentID).child(match_id).child("boardchange")
            opponentBoard.child("addrow").on("child_added", (d) ->
              addRow(d.val(), "Your 'friend' sent you a gift")
              console.log "Your friend sent you a gift", opponentID
            )
      );
    $("#startscreen").css("color", "#888") # show start screen
  else 
    if autoLogIn
      console.log "Getting id..."
      auth.login('anonymous', {
        rememberMe: true
      });
    $("#startscreen").css("color", "#888") # show start screen
  $("#startplaying").show()
)


$(document).ready ->

  shooter = $("<div class='popper-shooter'></div>")
  shootercontrol = $("<div id='shooter-control'></div>")
  shooterbase = $("<div id='shooter-base'></div>")

  # overlays!
  if ROW_TURNS_CEILING != 0
    if ROW_TURNS_MULTIPLIER != 0
      fornow = "<br>...for now"
    else
      fornow = ""
    if ROW_TURNS_RAND != 1
      minCtr = Math.ceil(ROW_TURNS_CEILING/ROW_TURNS_RAND) + " to " 
    else
      minCtr = ""
    rowcounterinfo = "<span id='rowcounterinfo'>New row every " + minCtr + ROW_TURNS_CEILING + " turns" + fornow + ".<br><br></span>"
  else
    rowcounterinfo = ""

  if ADDROW_TIMER_CEILING != 0
    if ADDROW_TIMER_MULTIPLIER < 1
      fornow = "<br>...for now"
    else 
      fornow = ""
    rowintervalinfo = "<span id='rowintervalinfo'>New row every " + ADDROW_TIMER_CEILING + " secs" + fornow + ".<br><br></span>"
  else
    rowintervalinfo = ""
  startoverlay = $("<div id='startscreen' class='overlay' style='color: transparent'></div>")
  startoverlay.append """
    <p>Clear the board.<br /><br />
    Connect 3 or more of the similar colors to POP them.<br /><br /> """ + rowcounterinfo + rowintervalinfo + """
    <button class="btn btn-primary btn-large" id="startplaying" style="display:none">Start Playing</button><br />
    <span id="startmatch-container" style="font-size: 16px; font-weight: normal">or <a href="javascript:void(0)" id="startmatch">start a match</a></span>
    </p>
  """
  gameoverlay = $("<div id='gameover' class='overlay'></div>")
  gameoverlay.append "<p>Game Over <i class='fa fa-frown-o'></i></p>"
  pauseoverlay = $("<div id='pause' class='overlay'></div>")
  pauseoverlay.append "<p>Paused. o_O</p>"
  winoverlay = $("<div id='victory' class='overlay'></div>")
  winoverlay.append "<p>VICTORY! <i class='fa fa-smile-o'></p>"

  # .. underlay?
  noticeoverlay = $("<div id='notice-overlay'></div>")

  # uber overlay
  shooteroverlay = $("<div id='shooter-control-overlay'></div>")

  $("#popper-container").append shootercontrol
  $("#popper-container").append shooterbase
  $("#popper-container").append shooteroverlay
  $("#popper-container").append gameoverlay
  $("#popper-container").append pauseoverlay
  $("#popper-container").append winoverlay
  $("#popper-container").append shooter
  $("#popper-container").append noticeoverlay
  $("#popper-container").append startoverlay

  # Shooter code
  rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length)
  currColor = BUBBLE_OPTIONS[rand]
  currColorClass = "popper-" + currColor
  $(".popper-shooter").addClass currColorClass
  shooteroverlay.mousemove (e) ->
    unless isGameOver or isPaused or isWon
      rotatedeg = (e.pageX - $(this).offset().left) / $(this).outerWidth() * 160 - MAX_ANGLE
      rotatedeg = Math.max(-MAX_ANGLE, rotatedeg)
      rotatedeg = Math.min(MAX_ANGLE, rotatedeg)
      $(".popper-shooter").data "rotatedeg", rotatedeg
      $(".popper-shooter").css "transform", "rotate(" + rotatedeg + "deg" + ")"
      $("#shooter-rotate-deg").text "Shooter at " + Math.round(rotatedeg * 10) / 10
    return

  shooteroverlay.bind "touchmove", (e) ->
    unless isGameOver or isPaused or isWon
      e.preventDefault()
      rotatedeg = (e.originalEvent.touches[0].pageX - $(this).offset().left) / $(this).outerWidth() * 160 - MAX_ANGLE
      rotatedeg = Math.max(-MAX_ANGLE, rotatedeg)
      rotatedeg = Math.min(MAX_ANGLE, rotatedeg)
      $(".popper-shooter").data "rotatedeg", rotatedeg
      $(".popper-shooter").css "transform", "rotate(" + rotatedeg + "deg" + ")"
      $("#shooter-rotate-deg").text "Shooter at " + Math.round(rotatedeg * 10) / 10
    return

  shooteroverlay.click (e) ->
    if not shooting and not isGameOver and not isPaused and not isWon
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"))
      $("#shoot-at-deg").text "Shoot at: " + Math.round(rotatedeg * 10) / 10
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot rotatedeg

      # increment counter
      if ROW_TURNS_CEILING != 0
        addRowCounter += Math.floor(Math.random() * ROW_TURNS_RAND)+1
        if addRowCounter >= Math.max(ROW_TURNS_FLOOR, ROW_TURNS_CEILING - ROW_TURNS_MULTIPLIER * numRowAdded)
          addRow()
          numRowAdded++
          addRowCounter = 0

      # change color options for the shoooter
      i = 0
      while i < BUBBLE_OPTIONS.length
        $(".popper-shooter").removeClass "popper-" + BUBBLE_OPTIONS[i]
        i++
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length)
      currColor = BUBBLE_OPTIONS[rand]
      currColorClass = "popper-" + currColor
      $(".popper-shooter").addClass currColorClass
    return

  shooteroverlay.bind "touchend", (e) ->
    if not shooting and not isGameOver and not isPaused and not isWon
      e.preventDefault()
      rotatedeg = Number($(".popper-shooter").data("rotatedeg"))
      $("#shoot-at-deg").text "Shoot at: " + Math.round(rotatedeg * 10) / 10
      $("#popper-container").createBubble().addClass(currColorClass).attr("data-color", currColor).shoot rotatedeg
      if ROW_TURNS_CEILING != 0
        addRowCounter += Math.floor(Math.random() * ROW_TURNS_RAND)+1
        if addRowCounter > ROW_TURNS_CEILING - ROW_TURNS_MULTIPLIER * numRowAdded
          addRow()
          numRowAdded++
          addRowCounter = 0 

      i = 0
      while i < BUBBLE_OPTIONS.length
        $(".popper-shooter").removeClass "popper-" + BUBBLE_OPTIONS[i]
        i++
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length)
      currColor = BUBBLE_OPTIONS[rand]
      currColorClass = "popper-" + currColor
      $(".popper-shooter").addClass currColorClass
  #   return

  # Making the bubble Matrix
  w = $("#popper-container").width()
  h = $("#popper-container").outerHeight() - BUBBLE_RADIUS * 2 - BUBBLE_BORDER * 2
  xNum = Math.floor(w / (BUBBLE_RADIUS * 2) - 0.5)
  if (NUM_PER_ROW > 0)
    xNum = NUM_PER_ROW
  yNum = Math.floor(h / (BUBBLE_RADIUS * 2) - 0.5) * 1.5 - 1
  margin = (w - (xNum + 0.5) * BUBBLE_RADIUS * 2) / 2

  bubbleMatrixOne = []
  bubbleMatrix = []
  j = 0
  while j < yNum
    bubbleMatrixOne[j] = []
    bubbleMatrix[j] = []
    i = 0
    while i < xNum
      if j % 2 is 0
        x = i * BUBBLE_RADIUS * 2 + margin
        y = h
      else
        x = i * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + margin
      y = h - BUBBLE_RADIUS * j * 1.7
      bubbleMatrixOne[j][i] =
        x: x
        y: y
      bubbleMatrix[j][i] =
        x: x
        y: y
      # p = $("#popper-container").createBubble().addClass("opt1").css("border-color", "#BBB").css("opacity", ".5").text(j+','+i)
      # p.drawAt(x, y)
      i++
    j++
  currMatrix = "one";

  bubbleMatrixTwo = []
  j = 0
  while j < yNum
    bubbleMatrixTwo[j] = []
    i = 0
    while i < xNum
      if j % 2 is 1
        x = i * BUBBLE_RADIUS * 2 + margin
        y = h
      else
        x = i * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + margin
      y = h - BUBBLE_RADIUS * j * 1.7
      bubbleMatrixTwo[j][i] =
        x: x
        y: y
      # p = $("#popper-container").createBubble().addClass("opt2").css("border-color", "#BBB").css("opacity", ".5").text(j+','+i)
      # p.drawAt(x, y)
      i++
    j++

  # Add Row by Timer
  if ADDROW_TIMER_CEILING == 0
    $("#timer-container").hide()
    addRowCounterSecs = 1
  else
    $("#timer-container").show()
    $("#addrowmeter").css("width", "100%")
    $("#timer").text(ADDROW_TIMER_CEILING).show()
    addRowCounterSecs = ADDROW_TIMER_CEILING
    refresh = .1 # seconds
    window.addrow = setInterval (() ->
      if isPaused == false 
        $("#timer").text(Math.max(0, Math.ceil(addRowCounterSecs)))
        $("#addrowmeter").css("width", (addRowCounterSecs-1*refresh)/ADDROW_TIMER_CEILING*100 + "%")
        if addRowCounterSecs < 0
          addRow()
          numRowAdded++
          # reset counter
          addRowCounterSecs = Math.max(ADDROW_TIMER_MIN, ADDROW_TIMER_CEILING * Math.pow(ADDROW_TIMER_MULTIPLIER, numRowAdded))
        addRowCounterSecs = addRowCounterSecs - 1*refresh
    ), 1000 * refresh

  addRows(DEFAULT_ROWS)
  
  # addRow(["red", "red", "red", "red", "red", "red", "red", "red", "red", "red", "red"])
  
  # CLICKS
  $("#pause-button").click () ->
    if isPaused == false
      pause()
      $(this).text("Go")
    else
      unpause()
      $(this).text("Pause")

  $("#startplaying").click () ->
    $("#startscreen").hide()
    unpause()
    $("#popper-container").css("cursor", "none")

  $("#startmatch").click () ->
    newMatch = fb.child("matches").push()
    fb.child("matches").child(newMatch.name()).child("created_on").set(Firebase.ServerValue.TIMESTAMP)
    fb.child("matches").child(newMatch.name()).child("player1").set(user.id)
    mdb_myactions =  fb.child("players").child(user.id).push()
    fb.child("players").child(user.id).child(mdb_myactions.name()).set( {
        name: "Rando", 
        points: 0, 
        boardchange: { 
          add: "", 
          addrow: "", 
          pop: "", 
          currmatrix: "one"
        }, 
        send: "" 
      }
    )
    # alert("firebase time!! " + newMatch.name())
    $("#startscreen").find("span").append("<br />link to match: <input type='text' value='" + window.location.origin + "/?m=" + newMatch.name() + "' />")

# return # end of document ready

noticeFlash = (str) ->
  $("#notice-overlay").html(str).show().fadeOut({duration: 1500})


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



########################################################
### The next set of functions are for adding bubbles ###
########################################################
addRows = (n) ->
  i = 0
  while i < n 
    addRow()
    i++

addRow = (colors, flash) ->

  scoochAllDown()
  # toggleMatrixPosition()

  # assumes adding a complete row
  if (colors == undefined)
    colors = []
    for i in bubbleMatrix[0]
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length)
      colors.push BUBBLE_OPTIONS[rand]
  else if (colors.length < bubbleMatrix[0].length)
    i = colors.length
    while i < bubbleMatrix[0].length
      rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length)
      colors.push BUBBLE_OPTIONS[rand]
      i++


  num = 0
  for color in colors
    div = $("#popper-container").createBubble(color).addClass("popper-" + color).text('0,'+num)
    loc = {row: 0, num: num}
    div.putInMatrix loc, false
    div.hide().fadeIn({duration: 200})
    num++

  if flash != undefined 
    noticeFlash(flash)

scoochAllDown = (n) ->
  furthestRow = 0
  furthestRowReached = false
  r = bubbleMatrix.length
  while r > 0
    r--
    n = bubbleMatrix[r].length
    while n > 0# bubbleMatrix[r].length
      n--
      if !isMatrixLocEmpty({row: r, num: n})
        moveBubble({row:r, num: n}, {row: r+1, num: n})
        if furthestRowReached == false
          furthestRowReached = true
          furthestRow = r+1
  toggleMatrixPosition()
  if furthestRow > MAX_ROW_NUM
    gameOver()



moveBubble = (oldloc, newloc) ->
  # TO DO: add some animation here
  div = getDivFromLoc(oldloc)
  div.attr("data-matrow", newloc.row).attr("data-matnum", newloc.num)
  div.css("bottom", bubbleMatrix[newloc.row][newloc.num].y)
  div.css("left", bubbleMatrix[newloc.row][newloc.num].x)
  div.text(newloc.row+","+newloc.num)

  bubbleMatrix[newloc.row][newloc.num].div = bubbleMatrix[oldloc.row][oldloc.num].div
  bubbleMatrix[newloc.row][newloc.num].color = bubbleMatrix[oldloc.row][oldloc.num].color
  bubbleMatrix[oldloc.row][oldloc.num].div = undefined
  bubbleMatrix[oldloc.row][oldloc.num].color = undefined

toggleMatrixPosition = () ->
  if currMatrix == "one"
    bm = bubbleMatrixTwo
    currMatrix = "two"
  else
    bm = bubbleMatrixOne
    currMatrix = "one"

  r = 0
  while r < bm.length
    n = 0
    while n < bm[r].length
      bubbleMatrix[r][n].x = bm[r][n].x
      bubbleMatrix[r][n].y = bm[r][n].y
      if(!isMatrixLocEmpty({row:r, num:n}))
        div = $(".point[data-matrow='" + r + "'][data-matnum='" + n + "']")
        div.css("left", bm[r][n].x + "px").css("bottom", bm[r][n].y)
      n++
    r++

  return 

#####################################################################
### The next set of functions are for returning clusters of color ###
#####################################################################

checkCluster = (loc, checkColor, n, checkedBefore) ->
  if checkColor is undefined
    checkColor = true
  if n is undefined # new check
    n = 0
  else
    n++
  if checkedBefore is undefined # new check
    checkedBefore = []

  # TO DO : convert this to use underscore.js
  checkedBefore.push stringifyLoc(loc)
  arr = [loc] 
  if n < 1000 # in case of infinite loop
    enviro = lookAround(loc)
    for l in enviro
      if $.inArray(stringifyLoc(l), checkedBefore) is -1 # verify it's not already checked
        checkedBefore.push stringifyLoc(l)
        if checkColor
          if getColor(l) is getColor(loc) # verify that it's the right color
            arr = arr.concat checkCluster(l, checkColor,  n, checkedBefore)
        else
          arr = arr.concat checkCluster(l, checkColor,  n, checkedBefore)
    return arr

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
  if currMatrix == "one"
    if row % 2 is 0 # even vs. odd row
      alt = -1
    else
      alt = 0
  else
    if row % 2 is 1 # even vs. odd row
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

drop = (locs, type, callback) ->
  if locs == undefined
    return
  else
    if locs instanceof Array
      if locs.length == 0
        return # yeah, THIS should not happen, not sure what the deal is here
      else
        locs = locs
    else
      locs = [locs]

    if type == "drop"
      toploc = _.min(locs, (d) ->
        return d.row; 
      )
      topRow = toploc.row
      topRowDFB = bubbleMatrix[topRow][0].y - $("#popper-container").height()
      # DFB = distance from top, where it should end up when dropped

    i = 0
    for l in locs
      # clear matrix
      bubbleMatrix[l.row][l.num].color = undefined
      bubbleMatrix[l.row][l.num].div = undefined

      ldiv = getDivFromLoc(l)
      if type == "drop"
        # calculate where l should end up
        target = topRowDFB
        multipler = Math.pow(l.row - topRow + 1, 1.1) # lower rows to drop faster
        delta = -50*multipler
        target = target+delta 

        if i == locs.length-1
          ldiv.animate(
            { bottom: target + "px"}, 
            { duration: 600, complete: () ->
              if callback != undefined
                callback()
              $(this).remove()
            }
          );
        else
          ldiv.animate(
            { bottom: target + "px"}, 
            { duration: 600, complete: () ->
              $(this).remove()
            }
          );

      else
        if i == locs.length-1
          ldiv.fadeOut({duration: 150, complete: () ->
            if callback != undefined
              setTimeout (() ->
                callback()
              ), 10
            $(this).remove();
          });
        else 
          ldiv.fadeOut({duration: 150, complete: () ->
            $(this).remove();
          });
      i++
  return

getDivFromLoc = (loc) ->
  div = $(".point[data-matrow=" + loc.row + "][data-matnum=" + loc.num + "]")
  return div

# TODO Re name to lost
gameOver = () ->
  $("#gameover").show()
  isGameOver = true
  clearInterval(window.addrow)
  shooting = false
  $("#pause-button").addClass("disabled")


pause = () ->
  $("#pause").show()
  isPaused = true
  # shooting = false

unpause = () ->
  $("#pause").hide()
  isPaused = false
  # shooting = true

win = () ->
  $("#victory").show()
  clearInterval(window.addrow)
  isWon = true
  shooting = false
  $("#pause-button").addClass("disabled")

checkIfWon = () ->
  didIWin = true # for now.. hehehe...
  r = 0
  while r < bubbleMatrix.length
    n = 0
    while n < bubbleMatrix[r].length
      l = {row: r, num: n}
      if !isMatrixLocEmpty(l)
        didIWin = false
        break
      n++
    r++

  return didIWin

addToScore = (deltaScore) ->
  # calc same color score
  oldScore = parseInt($("#score").text())
  newScore = oldScore + deltaScore

  if newScore < 10
    $("#score").text("0000" + newScore)
  else if newScore >= 10
    $("#score").text("000" + newScore)
  else if newScore >= 100
    $("#score").text("00" + newScore)
  else if newScore >= 1000
    $("#score").text("0" + newScore)
  else if newScore >= 10000
    $("#score").text(newScore)
  else 
    $("#score").text(newScore)
    $("#score-container").css("font-size", "28px")

addToScrewQueue = (arr, type) ->
  for i in arr

    if type == "locs"
      color = bubbleMatrix[i.row][i.num].color
    else if type == "colors"
      color = i

    screwQueue.push color
    $(".screwqueue-" + (screwQueue.length - 1)).addClass("popper-" + color)

    if screwQueue.length == 10
      fb.child("players").child(user.id).child("boardchange").child("addrow").push(screwQueue)
      screwQueue = []
      for c in BUBBLE_OPTIONS
        $(".screwqueue-ball").removeClass("popper-" + c)

    $("#screwqueue-length").text(screwQueue.length)



############################################################
### jQuery add ons, mostly relatied to shooting a bubble ###
############################################################

jQuery.fn.createBubble = (color) ->
  div = $("<div class='point'></div>")
  div.css("width", BUBBLE_RADIUS * 2 + "px").css("height", BUBBLE_RADIUS * 2 + "px").css "border-width", BUBBLE_BORDER + "px"
  if color != undefined
    div.attr("data-color", color)
  $(this[0]).append div
  div

jQuery.fn.putInMatrix = (loc, pop) ->
  if pop == undefined
    pop = true
  div = $(this[0])
  bubbleMatrix[loc.row][loc.num].div = div
  bubbleMatrix[loc.row][loc.num].color = div.attr("data-color")
  coords = bubbleMatrix[loc.row][loc.num]
  div.drawAt coords.x, coords.y
  div.attr "data-matrow", loc.row
  div.attr "data-matnum", loc.num
  div.text loc.row + ", " + loc.num

  # check for similar colors and for those with greater than three, drop them like their hot
  if pop == true
    deltaScore = 0
    sameColorLocs = checkCluster(loc, true)
    if sameColorLocs.length >= 3
      addToScore(sameColorLocs.length)
      if isMultiPlayer
        numToAdd = Math.floor(sameColorLocs.length/2)
        i = 0
        screwColors = []
        while i < numToAdd
          i++
          rand = Math.floor(Math.random() * BUBBLE_OPTIONS.length)
          c = BUBBLE_OPTIONS[rand]
          console.log c
          screwColors.push c
        addToScrewQueue(screwColors, "colors")

      drop(sameColorLocs, "fade", () ->
        # code to drop loose bubbles
        topsChecked = []
        i=0
        for b in bubbleMatrix[0]
          topsChecked.push(i)
          i++

        wallcluster = []
        i=0
        while i<topsChecked.length and i < 1000
          loc_i = 
            row: 0
            num: i
          if !isMatrixLocEmpty(loc_i)
            wallcluster = wallcluster.concat checkCluster(loc_i, false)
            furthest = _.max(_.where(wallcluster, {row: 0}), (d) -> 
              return d.num; 
            )
            i = furthest.num+1
          else
            i++

        # TEAM BRUTE FORCE!!! :D 
        looseguys = []
        r = 0
        while r < bubbleMatrix.length
          n = 0
          while n < bubbleMatrix[r].length
            l = {row: r, num: n}
            if !isMatrixLocEmpty(l)
              if _.where(wallcluster, l).length == 0 
                looseguys.push l #bubbleMatrix[r][n].div
            n++
          r++

        # bonus time for dropping
        if looseguys.length > 0
          bonussec = Math.round(looseguys.length * DROP_TIME_MULTIPLER)
          newsec = addRowCounterSecs + bonussec
          newsec = Math.min(newsec, ADDROW_TIMER_CEILING)
          addRowCounterSecs = newsec
          $("#addrowmeter").css("width", addRowCounterSecs/ADDROW_TIMER_CEILING*100 + "%")

        # calc loose guys score
        if looseguys.length > 0  
          bonuspts = Math.ceil(Math.pow(looseguys.length, DROP_MULTIPLER))#-looseguys.length #looseguys.length * DROP_MULTIPLER-1
          if bonuspts > 1
            noticeFlash("<small>Dropped " + looseguys.length + "!</small><br />" + bonuspts + " bonus points!!")
          else if bonuspts == 1
            noticeFlash("<small>Dropped 1</small><br />" + bonuspts + " bonus point!")
        else
          bonuspts = 0

        addToScore(looseguys.length + bonuspts)
        if isMultiPlayer
          addToScrewQueue(looseguys, "locs")

        # drop it like it's hot
        drop(looseguys, "drop", () ->
          if checkIfWon() == true
            win()
        )
        
        if checkIfWon() == true
          win()
      )
    else
      if loc.row > MAX_ROW_NUM
        gameOver()
        div = $(".point").last()
        div.css("background-color", "#DDD").css("border-color", "#BBB")
        div.putInMatrix prevMatrixLoc

  shooting = false 
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
        div.putInMatrix prevMatrixLoc # Option 3: drop it in lines 3+
    else # top of the container!!
      clearInterval window.shootInterval
      coords = getPointAtY(h + BUBBLE_RADIUS, startDeg)
      currMatrixLoc = findClosestInMatrix(coords.x, coords.y)
      if isMatrixLocEmpty(currMatrixLoc) # Option 1: free space at top!! drop in line 1
        div.putInMatrix currMatrixLoc
      else # Option 2: occupied space drop in line 2
        div.putInMatrix prevMatrixLoc
    return
  , 5)
  div

