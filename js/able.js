/*
 ****************************************************************
 ** Able.js by forcer (at) vnet.sk
 ** This file is covered by GPL v2 license.
 ** Please find it here: http://www.gnu.org/licenses/gpl-2.0.txt
 ****************************************************************
 */

var cvs, gcvs, ctx, gctx, tcvs, tctx
var MaxX, MaxY
var boxZoom, boxDelta
var selectedObjs = []
var clipboardObjs = []
var spriteData = {}
var startmx, startmy
var selObjInitVals = []
var selectionInProgress = false
var toolSetMap = {}
var buttonClicked
var ctrlKeyPressed

var numberOfImagesLoaded = 0
var numberOfImages = 0

var d = document
var levelData = {}
var ratio = 20
var ydelta = 50

var tableElements

function isObject(v) {
  return "[object Object]" === Object.prototype.toString.call(v)
}

JSON.sort = function (o) {
  if (Array.isArray(o)) {
    return o.sort().map(JSON.sort)
  } else if (isObject(o)) {
    return Object.keys(o)
      .sort()
      .reduce(function (a, k) {
        a[k] = JSON.sort(o[k])

        return a
      }, {})
  }
  return o
}

function help() {
  var message =
    "Welcome to ABLE!.\n\n" +
    "ABLE(Angry Birds Level Editor) is Level editor for Angry Birds(AB) 1.3.x for Maemo, Android and Palm (Apple devices not included)\n" +
    "You can use it to create new levels and edit existing decompiled levels\n" +
    "If you want to edit existing levels used in game, you need to decompile them to text form before using them in this editor.\n\n" +
    "Controls:\n" +
    "Click on object from grey toolbox to insert the object to level, Click on object in level field to select it. You can select multiple objects by clicking and dragging on empty space.\n\n" +
    "if no object selected:\n" +
    "Keyboard Up/Down: zoom Out/In\n" +
    "Keyboard Left/Right: move left/right around the level\n\n" +
    "if object selected:\n" +
    "Mouse Left button: if dragging selected object(s), it moves with mouse, ctrl+click selects/deselects single object\n" +
    "Mouse Right button: if dragging up/down, angle of object(s) changes with mouse\n" +
    "Keyboard Up/Down/Left/Right: move the object(s)\n" +
    "Keyboard Delete: delete the object(s)\n" +
    "Keyboard J/R: if exactly 2 objects have been selected you can create/delete joint (connect object with invisible string)\n" +
    "Keyboadr D: duplicate the object(s)\n\n" +
    "All newly created files can be used directly in game, without compiling them.\n" +
    "You need to overwrite existing level to play your custom level.\n" +
    "Search for Level1.lua in your device to find the folder where AB stores the levels." +
    "If you found it, and have your level done in ABLE, press 'save changes' and create new file Level1.lua anywhere on your PC and paste\n" +
    "the contents of ABLE code text box to the newly created Level1.lua.\n" +
    "Then, overwrite existing Level1.lua with one on you saved earlier."
  return message
}

function init() {
  loadImages()
  txtEl = d.getElementById("txt")
  txtEl.focus()
  txtEl.select()
  cvs = d.getElementById("canvas")
  ctx = cvs.getContext("2d")
  MaxX = cvs.width
  MaxY = cvs.height

  cvs.onmousedown = canvasMouseDown
  cvs.onmouseup = canvasMouseUp

  gcvs = document.createElement("canvas")
  gcvs.width = MaxX
  gcvs.height = MaxY
  gctx = gcvs.getContext("2d")

  tcvs = d.getElementById("toolset")
  tctx = tcvs.getContext("2d")
  tcvs.onmousedown = toolSetMouseDown

  d.onkeydown = canvasKeyDown
  d.onkeyup = canvasKeyUp

  spriteData = definitionToSpriteDataMapping()
  toolSetMap = toolSetMapping()

  levelData = parseLevel()
  setTimeout(preloadImagesCheck, 100)

  tableElements = {
    id: document.getElementById("selected-object-id"),
    x: document.getElementById("selected-object-x"),
    y: document.getElementById("selected-object-y"),
    s: document.getElementById("selected-object-s"),
  }
}

function loadImages() {
  for (var sec in images) {
    if (sec == "theme_grounds") {
      theme = images[sec]
      for (var tsec in theme) {
        theme[tsec].img = new Image()
        theme[tsec].img.onload = function () {
          ++numberOfImagesLoaded
        }
        theme[tsec].img.src = "images/" + theme[tsec].src + ".png"
        ++numberOfImages
      }
    } else {
      images[sec].img = new Image()
      images[sec].img.onload = function () {
        ++numberOfImagesLoaded
      }
      images[sec].img.src = "images/" + images[sec].src + ".png"
      ++numberOfImages
    }
  }
}

function preloadImagesCheck() {
  var ilDiv = d.getElementById("loading")
  if (numberOfImagesLoaded < numberOfImages) {
    ilDiv.innerHTML =
      "<h1>Loaded " +
      (((numberOfImagesLoaded / numberOfImages) * 100) >> 1) +
      "% of Images</h1>"
    setTimeout(preloadImagesCheck, 100)
  } else {
    drawToolSet()
    setInterval(drawCanvas, 100)
    ilDiv.style.display = "none"
  }
}

function toolSetMapping() {
  var tMaxX = tcvs.width
  var tMaxY = tcvs.height
  var scale = 1 / 2.6
  var currentWidth = 0
  var currentHeight = 0
  var maxHeight = 0
  var result = {}
  for (var blname in blocks) {
    var sprd = spriteData[blname]
    if (sprd == null) continue
    if (sprd.data.omitInToolSet) continue

    if (currentWidth + sprd.data.width * scale > tMaxX) {
      currentHeight += maxHeight
      currentWidth = 0
    }

    result[blname] = {}
    result[blname].data = sprd.data
    result[blname].img = sprd.img
    result[blname].x = currentWidth
    result[blname].y = currentHeight
    result[blname].w = sprd.data.width * scale
    result[blname].h = sprd.data.height * scale

    maxHeight =
      maxHeight < sprd.data.height * scale
        ? sprd.data.height * scale
        : maxHeight
    currentWidth += sprd.data.width * scale
  }
  return result
}

function drawToolSet() {
  for (var def in toolSetMap) {
    var tsm = toolSetMap[def]
    var sd = tsm.data
    tctx.drawImage(
      tsm.img,
      sd.pvrX,
      sd.pvrY,
      sd.width,
      sd.height,
      tsm.x,
      tsm.y,
      tsm.w,
      tsm.h
    )
  }
}

function toolSetMouseDown(e) {
  var tsc = d.getElementById("tscontainer")
  var mx = e.pageX + tsc.scrollLeft - tsc.offsetLeft
  var my = e.pageY + tsc.scrollTop - tsc.offsetTop

  for (var def in toolSetMap) {
    var tsm = toolSetMap[def]
    if (mx < tsm.x + tsm.w && my < tsm.y + tsm.h && mx > tsm.x && my > tsm.y) {
      //console.info("added "+def);
      addNewObject(def)
      break
    }
  }
}

function definitionToSpriteDataMapping() {
  var result = {}
  for (var definition in blocks) {
    var sprite = blocks[definition].sprite
    if (!sprite) continue
    for (var secnm in images) {
      if (secnm == "theme_grounds") {
        for (var tsprite in images[secnm]) {
          if (tsprite == sprite) {
            theme = images[secnm]
            result[definition] = {}
            result[definition].img = theme[sprite].img
            result[definition].data = theme[sprite]
          }
        }
      } else {
        section = images[secnm]
        for (var spritenm in section) {
          if (sprite == spritenm) {
            //console.info(section);
            result[definition] = {}
            result[definition].img = section.img
            result[definition].data = section[spritenm]
          }
        }
      }
    }
  }
  return result
}

function dumpLevel(arr, level) {
  function isNumber(x) {
    return typeof x === typeof 1 && null !== x && isFinite(x)
  }
  var i = 0
  var len = 0
  var dumpedText = ""
  if (!level) level = 0

  var levelPadding = ""
  for (var j = 0; j < level; j++) levelPadding += "    "

  if (typeof arr == "object") {
    for (var item in arr) {
      len++
    }
    //alert(len);
    for (var item in arr) {
      i++
      var value = arr[item]
      if (typeof value == "object") {
        dumpedText += levelPadding + item + " = {\n"
        dumpedText += dumpLevel(value, level + 1)
        dumpedText += levelPadding + "}"
        if (level > 0 && i < len) dumpedText += ",\n"
        else dumpedText += "\n"
      } else {
        value = isNumber(value) ? value : '"' + value + '"'
        dumpedText += levelPadding + item + " = " + value
        if (level > 0 && i < len) dumpedText += ",\n"
        else dumpedText += "\n"
      }
    }
  }
  return dumpedText
}

function getObjectType(definition) {
  return blocks[definition].group === "birds" ? "bird" : "block"
}

function getLastObjectID(type) {
  let i = 0
  while (levelData.world[type + "_" + ++i]) {
    if (i > 999) {
      throw new Error("Too many objects")
    }
  }
  return i - 1
}

function getLastObjectName(type) {
  return `${type}_${getLastObjectID(type)}`
}

function getNextAvailableObjectName(definition) {
  const type = getObjectType(definition)
  return `${type}_${getLastObjectID(type) + 1}`
}

function addNewObject(definition, x, y, angle) {
  if (!levelData) return undefined
  var objName = getNextAvailableObjectName(definition)
  levelData.world[objName] = {}
  var obj = levelData.world[objName]
  var loc = {}

  if (x === undefined || y === undefined) {
    loc = untransform(MaxX / 2, MaxY / 4)
  } else {
    loc.x = x
    loc.y = y
  }

  obj.x = loc.x
  obj.y = loc.y

  obj.s = 2

  obj.id = definition
  obj.angle = angle === undefined ? 0 : angle
  const type = blocks[definition].group === "birds" ? "birds" : "blocks"
  if (levelData.counts[type]) {
    levelData.counts[type] = parseInt(levelData.counts[type]) + 1
  } else {
    levelData.counts[type] = 1
  }
  return objName
}

function saveLevel() {
  txtEl = d.getElementById("txt")
  txtEl.value = JSON.stringify(JSON.sort(levelData), null, 2)
  txtEl.focus()
  txtEl.select()
  download("Level1-1.json", txtEl.value)
}

function download(filename, text) {
  var pom = document.createElement("a")
  pom.setAttribute(
    "href",
    "data:application/json;charset=utf-8," + encodeURIComponent(text)
  )
  pom.setAttribute("download", filename)

  if (document.createEvent) {
    var event = document.createEvent("MouseEvents")
    event.initEvent("click", true, true)
    pom.dispatchEvent(event)
  } else {
    pom.click()
  }
}

function parseLevel() {
  var txt = d.getElementById("txt").value
  console.info(txt)
  try {
    return JSON.parse(txt)
  } catch (err) {
    alert(
      "Level data not parsable: " +
        err +
        "\nSend error reports with level data to forcer (at) vnet.sk"
    )
    return null
  }
}

function generateSituation() {
  const predicates = []

  predicates.push(generatePredicate("slingshotPivot", 0, 0))
  predicates.push(generatePredicate("situation_name", "customSituation"))

  Object.keys(levelData.world).forEach((key) => {
    const obj = levelData.world[key]

    if (!blockLookup[obj.id]) {
      console.log("Undefined: ", obj.id)
      return
    }

    if (blockLookup[obj.id].isBird) {
      predicates.push(generatePredicate("bird", key))
      predicates.push(generatePredicate("hasColor", key, "red")) // TODO: static color
    }

    if (blockLookup[obj.id].isPig) {
      predicates.push(generatePredicate("pig", key, 1, 1, 1, 1))
    }

    var sprd = spriteData[obj.id]
    if (!sprd) return

    var tr = transform(obj.x, obj.y, sprd.data.width, sprd.data.height)

    const scale = obj.s ?? 1

    const width = tr.w * scale
    const height = tr.h * scale

    predicates.push(
      generatePredicate(
        "shape",
        key,
        getShapeFromObjectID(obj.id),
        obj.x,
        obj.y,
        55,
        [width, height, width * height]
      )
    )

    predicates.push(
      generatePredicate(
        "hasMaterial",
        key,
        getMaterialFromObjectID(obj.id),
        1,
        1,
        1,
        1
      )
    )

    predicates.push(
      generatePredicate("hasForm", key, getFormFromObjectID(obj.id))
    )
  })

  const pom = document.createElement("a")
  pom.setAttribute(
    "href",
    "data:application/prolog;charset=utf-8," +
      encodeURIComponent(predicates.join("\n"))
  )
  pom.setAttribute("download", "customSituation.pl")

  if (document.createEvent) {
    var event = document.createEvent("MouseEvents")
    event.initEvent("click", true, true)
    pom.dispatchEvent(event)
  } else {
    pom.click()
  }

  console.log(predicates.join("\n"))
}

function getShapeFromObjectID(key) {
  return blockLookup[key].shape
}

function getFormFromObjectID(key) {
  return blockLookup[key].form
}

function getMaterialFromObjectID(key) {
  return blockLookup[key].material
}

function generatePredicate(name, ...args) {
  return `${name}(${args
    .map((val) => {
      console.log(val)
      if (typeof val === "undefined" || val === "") {
        return "undefined"
      }
      if (typeof val === "object" && val.length === 0) {
        return "[]"
      }
      return val
    })
    .join(",")}).`
}

function canvasMouseDown(e) {
  var mx = e.pageX - cvs.offsetLeft
  var my = e.pageY - cvs.offsetTop

  buttonClicked = e.button
  sloc = untransform(mx, my)
  startmx = mx
  startmy = my
  var selObj = getObjectByPixel(mx, my)
  if (selObj == null) {
    if (!ctrlKeyPressed) {
      selectedObjs = []
      selObjInitVals = []
    }
    selectionInProgress = true
  } else if (selectedObjs.length > 1 && !ctrlKeyPressed) {
    syncObjInitValsWithSelObjs()
  } else {
    if (ctrlKeyPressed) {
      if (isObjectSelected(selObj)) {
        deleteObjectFromArray(selectedObjs, selObj)
        syncObjInitValsWithSelObjs()
      } else {
        selectedObjs.push(selObj)
        syncObjInitValsWithSelObjs()
      }
    } else {
      selObjInitVals[0] = {}
      selObjInitVals[0].x = levelData.world[selObj].x
      selObjInitVals[0].y = levelData.world[selObj].y
      selObjInitVals[0].angle = levelData.world[selObj].angle
      selectedObjs = [selObj]
    }
  }
  if (selObj) {
    console.log(tableElements)
    const { x, y, s } = levelData.world[selObj]
    tableElements.x.value = x
    tableElements.x.onchange = (event) =>
      (levelData.world[selObj].x = event.target.value)

    tableElements.y.value = y
    tableElements.y.onchange = (event) =>
      (levelData.world[selObj].y = event.target.value)

    tableElements.s.value = s ?? 1
    tableElements.s.onchange = (event) =>
      (levelData.world[selObj].s = event.target.value)

    tableElements.id.innerText = selObj
  } else {
    tableElements.x.value = undefined
    tableElements.y.value = undefined
    tableElements.s.value = undefined
    tableElements.id.innerText = "None"
  }
  cvs.onmousemove = canvasMouseMove
  return false
}

function canvasMouseMove(e) {
  var mx = e.pageX - cvs.offsetLeft
  var my = e.pageY - cvs.offsetTop
  var mouseOffsetX = mx - startmx
  var mouseOffsetY = my - startmy
  var loc = untransform(mx, my)

  if (selectionInProgress) {
    ctx.strokeStyle = "rgba(255,0,0,0.5)"
    ctx.strokeRect(startmx, startmy, mouseOffsetX, mouseOffsetY)
    var rectObjs = getObjectsByRect(
      startmx,
      startmy,
      mouseOffsetX,
      mouseOffsetY
    )
    if (ctrlKeyPressed) {
      for (var i in rectObjs) {
        var obj = rectObjs[i]
        if (!isObjectSelected(obj)) selectedObjs.push(obj)
      }
    } else {
      selectedObjs = rectObjs
    }
    //console.info(selectedObjs);
  } else if (selectedObjs[0] != null) {
    if (buttonClicked == 2) {
      for (var i in selectedObjs) {
        levelData.world[selectedObjs[i]].angle = canvasAngleToABAngle(
          abAngleToCanvasAngle(selObjInitVals[i].angle) + (loc.y - sloc.y) / 5
        )
      }
    } else {
      if (selectedObjs.length === 1) {
        const selObj = [selectedObjs]
        if (selObj) {
          console.log(tableElements)
          const { x, y } = levelData.world[selObj]
          tableElements.x.value = x
          tableElements.y.value = y
          tableElements.id.innerText = selObj
        } else {
          tableElements.x.value = undefined
          tableElements.y.value = undefined
          tableElements.id.innerText = "None"
        }
      }
      for (var i in selectedObjs) {
        const objName = selectedObjs[i]
        levelData.world[objName].x = selObjInitVals[i].x + (loc.x - sloc.x)
        levelData.world[objName].y = selObjInitVals[i].y + (loc.y - sloc.y)
      }
    }
  }
  return false
}

function syncObjInitValsWithSelObjs() {
  selObjInitVals = []
  for (var i in selectedObjs) {
    const objName = selectedObjs[i]
    selObjInitVals[i] = {}
    selObjInitVals[i].x = levelData.world[objName].x
    selObjInitVals[i].y = levelData.world[objName].y
    selObjInitVals[i].angle = levelData.world[objName].angle
  }
}

function deleteObjectFromArray(arr, obj) {
  for (var i in arr) {
    if (arr[i] === obj) delete arr[i]
  }
}

function isObjectSelected(obj) {
  for (var i in selectedObjs) {
    if (selectedObjs[i] === obj) return true
  }
  return false
}

function getObjectsByRect(x, y, w, h) {
  const minX = Math.min(x, x + w)
  const minY = Math.min(y, y + h)
  const maxX = Math.max(x, x + w)
  const maxY = Math.max(y, y + h)
  var result = []
  for (var obname in levelData.world) {
    var obj = levelData.world[obname]
    let loc
    if (obname == "bird_1") {
      loc = transform(obj.x, obj.y - 7, 0, 0)
    } else {
      loc = transform(obj.x, obj.y, 0, 0)
    }
    if (!spriteData[obj.id]) continue
    if (loc.x > minX && loc.y > minY && loc.x < maxX && loc.y < maxY) {
      result.push(obname)
    }
  }
  return result
}

function getObjectByPixel(x, y) {
  gctx.clearRect(0, 0, MaxX, MaxY)
  //alert(levelData.world['ExtraBlockTNT_1'].name);
  for (var objname in levelData.world) {
    var obj = levelData.world[objname]
    var sprd = spriteData[obj.id]
    if (!sprd) continue
    let tr
    if (objname == "bird_1") {
      tr = transform(obj.x, obj.y - 7, sprd.data.width, sprd.data.height)
    } else {
      tr = transform(obj.x, obj.y, sprd.data.width, sprd.data.height)
    }

    gctx.save()
    gctx.translate(tr.x, tr.y)
    gctx.rotate(abAngleToCanvasAngle(obj.angle))

    const scale = obj.s ?? 1

    gctx.fillRect(
      -(tr.w * scale) / 2,
      -(tr.h * scale) / 2,
      tr.w * scale,
      tr.h * scale
    )
    gctx.restore()
    //console.info(x,y);
    var imageData = gctx.getImageData(x, y, 1, 1)
    if (imageData.data[3] > 0) {
      return objname
    }
  }
  return null
}

function canvasMouseUp(e) {
  cvs.onmousemove = null
  selectionInProgress = false
  buttonClicked = undefined
}

function canvasKeyDown(e) {
  ctrlKeyPressed = e.ctrlKey
  var catchKeyPress = true
  var canDeleteObject = false
  var canMakeJoint = false
  var canDeleteJoint = false
  //console.info(e.keyCode);
  if (selectedObjs.length == 0) {
    switch (e.keyCode) {
      case 38: //up
        chgval("zoom", -1)
        return false
        break
      case 40: //down
        chgval("zoom", 1)
        return false
        break
      case 37: //left
        chgval("delta", 30)
        return false
        break
      case 39: //right
        chgval("delta", -30)
        return false
        break
    }
  } else {
    var angleDelta = 0
    var xDelta = 0
    var yDetla = 0
    switch (e.keyCode) {
      case 38: //up
        yDetla = -0.1
        catchKeyPress = false
        break
      case 40: //down
        yDetla = 0.1
        catchKeyPress = false
        break
      case 37: //left
        xDelta = -0.1
        catchKeyPress = false
        break
      case 39: //right
        xDelta = 0.1
        catchKeyPress = false
        break
      case 81: //q
        angleDelta = -1
        catchKeyPress = false
        break
      case 87: //w
        angleDelta = 1
        catchKeyPress = false
        break
      case 46: //delete key
        canDeleteObject = true
        break
      case 74: // j
        canMakeJoint = true
        break
      case 82: // r
        canDeleteJoint = true
        break
      case 68: // d
        copySelectedObjects()
        pasteClipboardObjects()
        return false
        break
    }
    for (var i in selectedObjs) {
      if (canDeleteObject) {
        deleteObject(selectedObjs[i])
        delete selectedObjs[i]
        catchKeyPress = false
      } else {
        if (levelData.world[selectedObjs[i]] == null) continue
        levelData.world[selectedObjs[i]].x += xDelta
        levelData.world[selectedObjs[i]].y += yDetla
        const currentAngle = levelData.world[selectedObjs[i]].angle
        let newAngle = currentAngle + angleDelta
        newAngle = (newAngle < 0 ? newAngle + 360 : newAngle) % 360
        levelData.world[selectedObjs[i]].angle = newAngle
      }
    }

    if (selectedObjs.length == 2) {
      if (canMakeJoint) {
        makeJoint(selectedObjs[0], selectedObjs[1], 1)
      } else if (canDeleteJoint) {
        deleteJoint(selectedObjs[0], selectedObjs[1])
      }
    }
  }
  return catchKeyPress
}

function makeJoint(obj1, obj2, type) {
  if (!typeof levelData["joints"] === Object) levelData["joints"] = {}
  levelData.joints[obj1 + obj2] = {
    coordType: 2,
    name: obj1 + obj2,
    end1: obj1,
    end2: obj2,
    type: type,
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
  }
}

function deleteJoint(obj1, obj2) {
  if (!typeof levelData["joints"] === Object) return false
  var joints = levelData.joints
  for (var jName in levelData.joints) {
    if (
      (joints[jName].end1 == obj1.name && joints[jName].end2 == obj2.name) ||
      (joints[jName].end2 == obj1.name && joints[jName].end1 == obj2.name)
    )
      return delete joints[jName]
  }
  return false
}

function drawJoints() {
  if (!typeof levelData["joints"] === Object) return
  var joints = levelData.joints

  ctx.strokeStyle = "rgba(255,0,255,0.5)"

  for (var jName in joints) {
    var obj1 = levelData.world[joints[jName].end1]
    var obj2 = levelData.world[joints[jName].end2]
    var loc1 = transform(obj1.x, obj1.y, 0, 0)
    var loc2 = transform(obj2.x, obj2.y, 0, 0)
    ctx.beginPath()
    ctx.moveTo(loc1.x, loc1.y)
    ctx.lineTo(loc2.x, loc2.y)
    ctx.closePath()
    ctx.stroke()
  }
}

function deleteJointByObj(obj) {
  if (!typeof levelData["joints"] === Object) return false
  var joints = levelData.joints
  for (var jName in levelData.joints) {
    if (joints[jName].end1 == obj.name || joints[jName].end2 == obj.name)
      delete joints[jName]
  }
  return true
}

function copySelectedObjects() {
  clipboardObjs = []
  for (var i in selectedObjs) {
    clipboardObjs.push(selectedObjs[i])
  }
}

function pasteClipboardObjects() {
  selectedObjs = []
  for (var i in clipboardObjs) {
    var obj = levelData.world[clipboardObjs[i]]
    selectedObjs.push(
      addNewObject(obj.id, obj.x - 5, obj.y - 5, clipboardObjs[i].angle)
    )
  }
}

function canvasKeyUp(e) {
  ctrlKeyPressed = false
}

function deleteObject(objName) {
  const obj = levelData.world[objName]
  const type = getObjectType(obj.id)
  const lastObjectName = getLastObjectName(type)
  if (delete levelData.world[objName] == false) {
    alert("Failed to delete " + objName + " miserably. Please contact creator.")
  }
  if (objName != lastObjectName) {
    if (!levelData.world[lastObjectName]) {
      alert(
        `Failed to update ${lastObjectName} to ${objName}. Please check if your object count is the same as the number of objects.`
      )
      return
    }
    levelData.world[objName] = levelData.world[lastObjectName]
    if (delete levelData.world[lastObjectName] == false) {
      alert(
        `Failed to update ${lastObjectName} to ${objName}. Please check if your object count is the same as the number of objects.`
      )
      return
    }
  }
  deleteJointByObj(objName)

  const typeCounter = type + "s"
  levelData.counts[typeCounter] -= 1
  if (levelData.counts[typeCounter] == 0) delete levelData.counts[typeCounter]
}

function drawCanvas() {
  boxZoom = parseInt(document.getElementById("zoom").value)
  boxDelta = parseInt(document.getElementById("delta").value)
  clearScreen()

  if (levelData != null && levelData.world) {
    for (var obname in levelData.world) {
      if (obname == "bird_1") {
        drawBirdInSling(levelData.world[obname])
      } else {
        drawObject(levelData.world[obname])
      }
    }
    drawJoints()
    drawGround()
  }
}

function drawGround() {
  var y = 5
  var theme = "FOREGROUND_1_LAYER_1"
  //alert(theme);
  var img = images.grounds.img
  var iD = images.grounds[theme]
  var tr = transform(0, 5, iD.width, iD.height)
  //console.info(imageData.img);
  ctx.save()
  ctx.translate(0, MaxY - 54 + y * (boxZoom / ratio))
  for (var w = 0; w < MaxX; w += tr.w) {
    //console.info(imageData.img);
    ctx.drawImage(img, iD.pvrX, iD.pvrY, iD.width, iD.height, w, 0, tr.w, tr.h)
    //ctx.drawImage(img,w,y*boxZoom,imageData.width,imageData.height);
    //console.info(img,w,tr.y,w,w)
  }
  ctx.restore()
}

function transform(objx, objy, width, height) {
  var ret = {}
  ret.x = boxDelta + objx * boxZoom
  ret.y = MaxY - ydelta + objy * boxZoom
  ret.w = width * (boxZoom / ratio)
  ret.h = height * (boxZoom / ratio)
  return ret
}

function transformRelative(objx, objy, width, height) {
  var ret = {}
  ret.x = objx * boxZoom
  ret.y = objy * boxZoom
  ret.w = width * (boxZoom / ratio)
  ret.h = height * (boxZoom / ratio)
  return ret
}

function untransform(cx, cy) {
  var ret = {}
  ret.x = (cx - boxDelta) / boxZoom
  ret.y = (cy - (MaxY - ydelta)) / boxZoom
  return ret
}

function untransformRelative(cx, cy) {
  var ret = {}
  ret.x = cx / boxZoom
  ret.y = cy / boxZoom
  return ret
}

function abAngleToCanvasAngle(angle) {
  return ((angle * Math.PI) / 180 + 360) % 360
}

function canvasAngleToABAngle(angle) {
  return ((angle * 180) / Math.PI + 360) % 360
}

function drawBirdInSling(obj) {
  var angle = abAngleToCanvasAngle(obj.angle)
  var sprd = spriteData[obj.id]
  if (!sprd) return
  const sling_back_sprite = spriteData["SLINGSHOT_BACK"]
  const sling_front_sprite = spriteData["SLINGSHOT_FRONT"]
  // TODO: The -50 needs to be evaluated
  var tr = transform(obj.x, obj.y - 7, sprd.data.width, sprd.data.height)
  var tr_back = transformRelative(
    0,
    -1.8,
    sling_back_sprite.data.width,
    sling_back_sprite.data.height
  )
  var tr_front = transformRelative(
    -1.5,
    -2.3,
    sling_front_sprite.data.width,
    sling_front_sprite.data.height
  )

  ctx.save()
  ctx.translate(tr.x, tr.y)
  ctx.rotate(angle)

  with (sling_back_sprite) {
    ctx.drawImage(
      img,
      sling_back_sprite.data.pvrX,
      sling_back_sprite.data.pvrY,
      sling_back_sprite.data.width,
      sling_back_sprite.data.height,
      tr_back.x,
      tr_back.y,
      tr_back.w,
      tr_back.h
    )
  }
  with (sprd) {
    ctx.drawImage(
      img,
      data.pvrX,
      data.pvrY,
      data.width,
      data.height,
      -tr.w / 2,
      -tr.h / 2,
      tr.w,
      tr.h
    )
  }
  with (sling_front_sprite) {
    ctx.drawImage(
      img,
      sling_front_sprite.data.pvrX,
      sling_front_sprite.data.pvrY,
      sling_front_sprite.data.width,
      sling_front_sprite.data.height,
      tr_front.x,
      tr_front.y,
      tr_front.w,
      tr_front.h
    )
  }
  for (var i in selectedObjs) {
    if (obj == levelData.world[selectedObjs[i]]) {
      ctx.fillStyle = "rgba(255,0,0,0.5)"
      ctx.fillRect(-tr.w / 2, -tr.h / 2, tr.w, tr.h)
    }
  }
  //ctx.drawImage()
  ctx.restore()
}

function drawObject(obj) {
  var angle = abAngleToCanvasAngle(obj.angle)
  var sprd = spriteData[obj.id]
  if (!sprd) return

  var tr = transform(obj.x, obj.y, sprd.data.width, sprd.data.height)

  ctx.save()
  ctx.translate(tr.x, tr.y)
  ctx.rotate(angle)

  const scale = obj.s ?? 1

  with (sprd) {
    ctx.drawImage(
      img,
      data.pvrX,
      data.pvrY,
      data.width,
      data.height,
      -(tr.w * scale) / 2,
      -(tr.h * scale) / 2,
      tr.w * scale,
      tr.h * scale
    )
  }
  for (var i in selectedObjs) {
    if (obj == levelData.world[selectedObjs[i]]) {
      ctx.fillStyle = "rgba(255,0,0,0.5)"
      ctx.fillRect(
        -(tr.w * scale) / 2,
        -(tr.h * scale) / 2,
        tr.w * scale,
        tr.h * scale
      )
    }
  }
  //ctx.drawImage()
  ctx.restore()
}

function chgval(id, i) {
  if (parseInt(d.getElementById(id).value) + i == 1) return
  d.getElementById(id).value = parseInt(d.getElementById(id).value) + i
}

function clearScreen() {
  cvs.clear = true
  ctx.clearRect(0, 0, MaxX, MaxY)
}
