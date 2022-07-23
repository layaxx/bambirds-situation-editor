var $situationfile
var $container
var $tableElements
var $output
var objects
var selectedObject
var scene
const defaultRadius = 10000
const gridSize = 10

function init() {
  $situationfile = document.getElementById("situationfile")
  $container = document.getElementById("container")
  $output = document.getElementById("output")

  const slider = document.getElementById("zoomRange")
  const zoomValue = document.getElementById("zoomValue")

  $tableElements = {
    id: document.getElementById("selected-object-id"),
    x: document.getElementById("selected-object-x"),
    y: document.getElementById("selected-object-y"),
    s: document.getElementById("selected-object-s"),
    a: document.getElementById("selected-object-a"),
  }

  slider.oninput = function () {
    zoomValue.innerText = `${this.value}%`
    $container.style.transform = `scale(${this.value / 100})`
  }

  const update = () => {
    const loadResult = loadFile($situationfile.value)
    objects = loadResult.objects
    scene = loadResult.scene

    redrawAll()
  }

  $situationfile.onblur = () => update()

  update()
}

function redrawAll() {
  while ($container.lastChild) {
    $container.removeChild($container.lastChild)
  }
  drawGrid()
  drawHorizontalLine(scene.groundY)
  objects.forEach(drawShape)
  updateTable(selectedObject)
}

function redrawObjects(...objects) {
  for (var object of objects) {
    if (!object) continue
    try {
      $container.removeChild(document.querySelector("#svg-" + object.id))
    } catch {}
    drawShape(object)
  }
  updateTable(objects[objects.length - 1])
}

function updateTable(obj) {
  $tableElements.id.innerText = (obj && obj.id) || "None selected"
  $tableElements.x.value = obj ? obj.x : ""
  $tableElements.x.onchange = (event) => {
    if (!obj) return
    obj.x = parseFloat(event.target.value)
    redrawObjects(obj)
  }
  $tableElements.y.value = obj ? obj.y : ""
  $tableElements.y.onchange = (event) => {
    if (!obj) return
    obj.y = parseFloat(event.target.value)
    redrawObjects(obj)
  }
  $tableElements.s.value = obj ? obj.scale : ""
  $tableElements.s.onchange = (event) => {
    if (!obj) return
    obj.scale = parseFloat(event.target.value)
    _scaleObject(obj)
    redrawObjects(obj)
  }
  $tableElements.a.value = obj && obj.shape === "rect" ? obj.params[2] : ""
  $tableElements.a.onchange = (event) => {
    if (!obj) return
    if (!obj.params || obj.params[2] === undefined) {
      console.error("Cannot rotate Object", obj)
      return
    }

    obj.params[2] = parseFloat(event.target.value)

    redrawObjects(obj)
  }
}

function exportFile(keepDerivedInformation = false) {
  const predicates = [
    ...scene.commonPredicates,
    ...(keepDerivedInformation ? scene.derivedPredicates : []),
  ]

  for (var obj of objects) {
    if (obj.isPig) {
      predicates.push(`pig(${obj.id}, 1, 1, 1, 1).`)
    }
    if (obj.isBird) {
      predicates.push(`bird(${obj.id}).`)
      predicates.push(`hasColor(${obj.id}, ${obj.color}).`)
    }
    if (!(obj.isBird || obj.isPig)) {
      predicates.push(`hasForm(${obj.id}, ${obj.form ?? "cube"}).`)
    }
    if (!obj.isBird) {
      predicates.push(
        `hasMaterial(${obj.id}, ${obj.material ?? "purple"}, 1, 1, 1, 1).`
      )
    }
    predicates.push(
      `shape(${obj.id}, ${obj.shape}, ${obj.x}, ${obj.y}, ${getArea(
        obj
      )}, ${JSON.stringify(obj.params)}).`
    )
  }

  const text = predicates.sort((a, b) => a.localeCompare(b)).join("\n")

  $output.value = text
}

function getArea(object) {
  if (object.shape === "rect") {
    return object.params[0] * object.params[1]
  }
  if (object.shape === "ball") {
    return Math.pow(object.params[0], 2) * Math.PI
  }
  return object.area
}

function loadFile(text) {
  const predicates = {}

  text.split("\n").forEach((line) => {
    line = line.trim()
    if (!line || !line.endsWith(".")) return

    const predicateName = getPredicateName(line)
    if (!predicates[predicateName]) {
      predicates[predicateName] = [line]
    } else {
      predicates[predicateName].push(line)
    }
  })

  const parsedMaterialPredicates = (predicates.hasMaterial ?? []).map(
    parseMaterialPredicate
  )

  const parsedFormPredicates = (predicates.hasForm ?? []).map(
    parseFormPredicate
  )

  const objs = (predicates.shape ?? []).map((shapePredicate) => {
    const { id, x, y, shape, area, params } =
      parseShapePredicate(shapePredicate)
    const material = getMaterialFor(id, parsedMaterialPredicates)
    const form = getFormFor(id, parsedFormPredicates)
    return {
      id,
      x,
      y,
      shape,
      material,
      params,
      area,
      form,
      scale: 1,
      unscaledParams: JSON.parse(JSON.stringify(params)),
    }
  })

  ;(predicates.bird ?? []).forEach((birdPredicate) => {
    const birdID = getID(birdPredicate)
    const obj = objs.find(({ id }) => id === birdID)
    if (obj) {
      obj.isBird = true
    } else {
      console.error("Failed to set isBird property", birdPredicate, birdID)
    }
  })
  ;(predicates.pig ?? []).forEach((pigPredicate) => {
    const pigID = getID(pigPredicate)
    const obj = objs.find(({ id }) => id === pigID)
    if (obj) {
      obj.isPig = true
    } else {
      console.error("Failed to set isPig property", pigPredicate, pigID)
    }
  })
  ;(predicates.hasColor ?? []).forEach((hasColorPredicate) => {
    const [_, objID, color] = getGenericValues(hasColorPredicate)
    const obj = objs.find(({ id }) => id === objID)
    if (obj) {
      obj.color = color
    } else {
      console.error("Failed to set hasColor property", hasColorPredicate, objID)
    }
  })

  return {
    objects: objs,
    scene: {
      groundY: getGenericValues(predicates["ground_plane"][0])[1],
      derivedPredicates: [
        ...(predicates.belongsTo ?? []),
        ...(predicates.collapsesInDirection ?? []),
        ...(predicates.hasOrientation ?? []),
        ...(predicates.hasSize ?? []),
        ...(predicates.isAnchorPointFor ?? []),
        ...(predicates.isBelow ?? []),
        ...(predicates.isCollapsable ?? []),
        ...(predicates.isLeft ?? []),
        ...(predicates.isOn ?? []),
        ...(predicates.isOver ?? []),
        ...(predicates.isRight ?? []),
        ...(predicates.isTower ?? []),
        ...(predicates.protects ?? []),
        ...(predicates.structure ?? []),
        ...(predicates.supports ?? []),
      ],
      commonPredicates: [
        ...(predicates.hill ?? []),
        ...(predicates.ground_plane ?? []),
        ...(predicates.birdOrder ?? []),
        ...(predicates.sceneRepresentation ?? []),
        ...(predicates.scene_scale ?? []),
        ...(predicates.slingshotPivot ?? []),
        "situation_name('edited_situation').",
      ],
    },
  }
}

function getMaterialFor(idParam, materialPredicates) {
  const { material } = materialPredicates.find(({ id }) => id === idParam) ?? {
    material: undefined,
  }

  return material
}

function getFormFor(idParam, formPredicates) {
  const { form } = formPredicates.find(({ id }) => id === idParam) ?? {
    form: undefined,
  }

  return form
}

function getGenericValues(predicate) {
  if (!predicate) {
    console.error("Cannot determine values of undefined")
    return undefined
  }

  const name = predicate.split("(")[0]

  predicate = "[" + predicate.replace(name + "(", "").replace(").", "") + "]"

  const args = JSON.parse(
    predicate.replace(/(['"])?([a-zA-Z][a-zA-Z0-9_]+)(['"])?/g, '"$2"')
  )

  return [name.trim(), ...args]
}

function getID(predicate) {
  const [_, id] = getGenericValues(predicate)
  return id
}

function parseShapePredicate(predicate) {
  if (!predicate || getPredicateName(predicate) !== "shape") {
    console.error("Failed to parse Shape Predicate", predicate)
    return {}
  }

  const [_, id, shape, x, y, area, params] = getGenericValues(predicate)

  return { id, shape, x, y, area, params }
}

function parseMaterialPredicate(predicate) {
  if (!predicate || getPredicateName(predicate) !== "hasMaterial") {
    console.error("Failed to parse hasMaterial Predicate", predicate)
    return {}
  }

  const [_, id, material] = getGenericValues(predicate)

  return { id, material }
}

function parseFormPredicate(predicate) {
  if (!predicate || getPredicateName(predicate) !== "hasForm") {
    console.error("Failed to parse hasForm Predicate", predicate)
    return {}
  }

  const [_, id, form] = getGenericValues(predicate)

  return { id, form }
}

function getColorFromMaterial(material) {
  switch (material) {
    case "ice":
      return "#99B3FF"
    case "stone":
      return "#808080"
    case "wood":
      return "#E6991A"
    case "pork":
      return "#1AFF1A"
    case "tnt":
      return "#E6E600"
    default:
      return material
  }
}

function getPredicateName(predicate) {
  if (!predicate) {
    return undefined
  }
  return predicate.split("(")[0]
}

function drawPoly(id, color, points, cx, cy, a) {
  //   <polygon points="200,10 250,190 160,210" style="fill:lime;stroke:purple;stroke-width:1" />
  const $polygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  )
  $polygon.setAttribute(
    "points",
    points.map((point) => point.x + "," + point.y).join(" ")
  )
  $polygon.style = `fill:${
    selectedObject && selectedObject.id === id ? "red" : color
  };stroke:rgb(0,0,0);stroke-width:0.5`
  $polygon.setAttribute("id", "svg-" + id)
  configureEventHandlers($polygon, id)

  $container.appendChild($polygon)
}

function configureEventHandlers($element, id) {
  const obj = objects.find(({ id: id_ }) => id === id_)
  $element.onmousedown = () => {
    if (obj === selectedObject) return
    const oldSelectedObject = selectedObject
    selectedObject = obj
    redrawObjects(oldSelectedObject, obj)
  }
}

function drawGrid() {
  const style = "stroke:rgb(50,50,50);stroke-width:0.1"

  for (var y = gridSize; y < $container.clientWidth; y += gridSize) {
    const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    $line.setAttribute("x1", y)
    $line.setAttribute("y1", 0)
    $line.setAttribute("x2", y)
    $line.setAttribute("y2", $container.clientHeight)
    $line.style = style
    $container.appendChild($line)
  }

  for (var y = gridSize; y < $container.clientHeight; y += gridSize) {
    const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    $line.setAttribute("x1", 0)
    $line.setAttribute("y1", y)
    $line.setAttribute("x2", $container.clientWidth)
    $line.setAttribute("y2", y)
    $line.style = style
    $container.appendChild($line)
  }
}

function drawHorizontalLine(y) {
  const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
  $line.setAttribute("x1", 0)
  $line.setAttribute("y1", y)
  $line.setAttribute("x2", $container.clientWidth)
  $line.setAttribute("y2", y)
  $line.style = "stroke:rgb(255,0,0);stroke-width:2"

  $container.appendChild($line)
}

function drawCircle(id, color, cx, cy, radius) {
  const $circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  )
  $circle.setAttribute("cx", cx)
  $circle.setAttribute("cy", cy)
  $circle.setAttribute("r", radius)
  $circle.setAttribute("id", "svg-" + id)
  $circle.style = `fill:${
    selectedObject && selectedObject.id === id ? "red" : color
  };stroke:rgb(0,0,0);stroke-width:0.5`
  configureEventHandlers($circle, id)

  $container.appendChild($circle)
}

function rotShift(angle, cx, cy, list) {
  const [[x, y], ...remainingList] = list
  const xr = x * Math.cos(angle) - y * Math.sin(angle)
  const yr = x * Math.sin(angle) + y * Math.cos(angle)
  const xrs = xr + cx
  const yrs = yr + cy
  if (!remainingList || !remainingList.length) {
    return [[xrs, yrs]]
  }
  return [[xrs, yrs], ...rotShift(angle, cx, cy, remainingList)]
}

function drawShape(obj) {
  switch (obj.shape) {
    case "rect":
      const [w, h, angle] = obj.params

      const XRa = h * 0.5 // TODO: not sure why but needs this scaling factor to work
      const YRa = w * 0.5 // TODO: not sure why but needs this scaling factor to work
      const points_ = rotShift(angle, obj.x, obj.y, [
        [-XRa, -YRa],
        [-XRa, YRa],
        [XRa, YRa],
        [XRa, -YRa],
      ]).map(([x, y]) => ({ x, y }))
      drawPoly(
        obj.id,
        getColorFromMaterial(obj.material) ?? "lightgray",
        points_,
        obj.x,
        obj.y,
        angle
      )
      break
    case "ball":
      drawCircle(
        obj.id,
        getColorFromMaterial(obj.material) ?? obj.color,
        obj.x,
        obj.y,
        obj.params[0] ?? defaultRadius
      )
      break
    case "poly":
      const [_, ...points] = obj.params
      console.log(points)
      drawPoly(
        obj.id,
        getColorFromMaterial(obj.material) ?? "lightgray",
        points.map(([x, y]) => ({ x, y })),
        obj.x,
        obj.y,
        0
      )
      break
    case "unknown":
      console.log("draw unknown shape")
      drawCircle(obj.id, obj.material, obj.x, obj.y, defaultRadius)
      break
    default:
      console.log("Not sure how to draw", obj)
  }
}

function handleMoveObject(key, isHighSpeed) {
  const offset = 1 * (isHighSpeed ? 10 : 1)
  var xOffset = 0
  var yOffset = 0
  switch (key) {
    case "ArrowUp":
      yOffset = -offset // y = 0 is at the top
      break
    case "ArrowDown":
      yOffset = offset
      break
    case "ArrowLeft":
      xOffset = -offset
      break
    case "ArrowRight":
      xOffset = offset
      break
    default:
      console.log("Unknown moving direction: ", key, " ignoring.")
      return
  }

  translatePolyObject(selectedObject, xOffset, yOffset)

  selectedObject.x += xOffset
  selectedObject.y += yOffset

  redrawObjects(selectedObject)
}

function translatePolyObject(obj, xOffset, yOffset) {
  if (obj.shape === "poly") {
    const [first, ...rest] = obj.unscaledParams
    obj.unscaledParams = [
      first,
      ...rest.map(([x, y]) => [x + xOffset, y + yOffset]), // y=0 is at top
    ]
    _scaleObject(obj) // needed to translate unscaledParams to actual params
  }
}

function handleRotateObject(key, isHighSpeed) {
  const offset = 0.1 * (isHighSpeed ? 10 : 1)
  if (!selectedObject.params || selectedObject.params[2] === undefined) {
    console.error("Cannot rotate Object", selectedObject)
    return
  }
  if (selectedObject.shape === "poly") {
    console.error("Cannot rotate poly objects")
  }
  switch (key) {
    case "ArrowLeft":
      selectedObject.params[2] -= offset
      break
    case "ArrowRight":
      selectedObject.params[2] += offset
      break
    default:
      console.log("Unknown rotation direction: ", key, " ignoring.")
      return
  }

  redrawObjects(selectedObject)
}

function handleScaleObject(key, isHighSpeed) {
  const offset = 0.1 * (isHighSpeed ? 10 : 1)

  switch (key) {
    case "ArrowUp":
      selectedObject.scale += offset
      _scaleObject(selectedObject)
      break
    case "ArrowDown":
      selectedObject.scale -= offset
      _scaleObject(selectedObject)
      break
    default:
      console.log("Unknown scaling direction: ", key, " ignoring.")
      return
  }

  redrawObjects(selectedObject)
}

function _scaleObject(obj) {
  // TODO: does not work for poly shapes
  switch (obj.shape) {
    case "rect":
      obj.params[0] = obj.unscaledParams[0] * obj.scale
      obj.params[1] = obj.unscaledParams[1] * obj.scale
      break
    case "ball":
      obj.params[0] = obj.unscaledParams[0] * obj.scale
      break
    case "poly":
      function func(input, scaleFactor) {
        if (typeof input === "number") {
          return (input *= scaleFactor)
        }
        return input.map((value) => func(value, scaleFactor))
      }
      const [first, ...rest] = obj.unscaledParams
      obj.params = [first, ...rest.map((value) => func(value, obj.scale))]
      break
    default:
      console.log("Not sure how to scale", obj)
  }
}

function setUpEventHandlers(loadEvent) {
  var svg = loadEvent.target
  /* CONTROLS */

  document.addEventListener("keydown", handleKeyPress)

  var count = 0
  function handleKeyPress(event) {
    if (new Set(["TEXTAREA", "INPUT"]).has(event.path[0].tagName)) {
      return
    }
    event.preventDefault()
    if (!selectedObject) {
      return
    }
    switch (event.key) {
      case "Delete":
        const index = objects.findIndex(({ id }) => id === selectedObject.id)
        objects.splice(index, 1)
        redrawObjects({ id: selectedObject.id })
        selectedObject = undefined
        updateTable()
        break
      case "ArrowLeft":
      case "ArrowRight":
        if (event.altKey) {
          // Rotate
          handleRotateObject(event.key, event.ctrlKey)
          break
        }
      case "ArrowUp":
      case "ArrowDown":
        if (event.altKey) {
          // Scale
          handleScaleObject(event.key, event.ctrlKey)
          break
        }
        handleMoveObject(event.key, event.ctrlKey)
        break
      case "d":
        if (event.ctrlKey) {
          const newObject = {
            ...selectedObject,
            id: selectedObject.id + "d" + count,
          }
          count++
          objects.push(newObject)
          redrawObjects(newObject, selectedObject)
        }
        break
    }
  }

  /* DRAGGABLE SVG ELEMENTS */
  svg.addEventListener("mousedown", startDrag)
  svg.addEventListener("mousemove", drag)
  svg.addEventListener("mouseup", endDrag)
  svg.addEventListener("touchstart", startDrag)
  svg.addEventListener("touchmove", drag)
  svg.addEventListener("touchend", endDrag)
  svg.addEventListener("touchcancel", endDrag)

  function getMousePosition(event) {
    var CTM = svg.getScreenCTM()
    if (event.touches) {
      event = event.touches[0]
    }
    return {
      x: (event.clientX - CTM.e) / CTM.a,
      y: (event.clientY - CTM.f) / CTM.d,
    }
  }

  var mouseStartPosition, isDrag, preDragCoordinates

  function startDrag(event) {
    if (!event.target || event.target.tagName === "svg" || !selectedObject)
      return

    console.log("start drag")
    const { x, y } = selectedObject
    preDragCoordinates = { x, y }
    isDrag = true
    mouseStartPosition = getMousePosition(event)
  }

  function drag(event) {
    if (selectedObject && isDrag) {
      event.preventDefault()
      var currentMousePosition = getMousePosition(event)

      var newX =
        preDragCoordinates.x + (currentMousePosition.x - mouseStartPosition.x)
      var newY =
        preDragCoordinates.y + (currentMousePosition.y - mouseStartPosition.y)

      if (event.ctrlKey) {
        newX = snapToGrid(newX)
        newY = snapToGrid(newY)
      }

      const xOffset = newX - selectedObject.x
      const yOffset = newY - selectedObject.y
      selectedObject.x = newX
      selectedObject.y = newY
      if (selectedObject.shape === "poly") {
        translatePolyObject(selectedObject, xOffset, yOffset)
      }
      redrawObjects(selectedObject)
    }
  }

  function snapToGrid(coordinate) {
    const rest = coordinate % gridSize
    if (rest < gridSize / 2) {
      return coordinate - rest
    }
    return coordinate + (gridSize - rest)
  }

  function endDrag() {
    isDrag = false
  }
}
