(function () {
  function onChildMoved(triangle, child) {
    let children = triangle.children;
    triangle.x = (children[0].x + children[1].x + children[2].x) / 3;
    triangle.y = (children[0].y + children[1].y + children[2].y) / 3;
    // triangle.attach = null;
  }


  let meta = app.createPointMeta({
    fillEnable: { tag: "是否填充", type: "bool", get: shape => shape.fillInfo.enabled, set: (shape, v) => shape.fillInfo.enabled = v },
    fillColor: { tag: "填充颜色", type: "color", get: shape => shape.fillInfo.color, set: (shape, v) => shape.fillInfo.color = v },
  })

  function createShape(x, y, points, segments) {
    let width = 160;
    let height = 180;
    let fillInfo = { color: "#ffd1d1", enabled: true, };
    let center = { x, y, parent: null, children: null, onChildMoved: onChildMoved, fillInfo: fillInfo, meta: meta, fill: fill, hit: hit }
    let children = [
      { x: x - width / 2, y: y + height / 3, parent: center, children: [], fillInfo: fillInfo, meta: meta },
      { x: x + width / 2, y: y + height / 3, parent: center, children: [], fillInfo: fillInfo, meta: meta },
      { x: x, y: y - height * 2 / 3, parent: center, children: [], fillInfo: fillInfo, meta: meta }
    ]
    center.children = children;

    points.push(center)
    points.push(children[0])
    points.push(children[1])
    points.push(children[2])

    segments.push({ p1: children[0], p2: children[1] })
    segments.push({ p1: children[1], p2: children[2] })
    segments.push({ p1: children[0], p2: children[2] })
    return center
  }

  function createIcon() {
    return [
      { polygon: { points: "16,6 26,26 6,26", fill: "none" } },
      { circle: { cx: 16, cy: 6, r: 3 } },
      { circle: { cx: 26, cy: 26, r: 3 } },
      { circle: { cx: 6, cy: 26, r: 3 } }
    ]
  }

  function fill(center, ctx) {
    let fillInfo = center.fillInfo;
    let fillColor = null
    if (fillInfo && fillInfo.enabled)
      fillColor = fillInfo.color;
    if (fillColor) {
      const children = center.children;
      if (children && children.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(children[0].x, children[0].y);
        ctx.lineTo(children[1].x, children[1].y);
        ctx.lineTo(children[2].x, children[2].y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
    }
  }

  function hit(center, x, y) {
    let v0x = center.children[1].x - center.children[0].x
    let v0y = center.children[1].y - center.children[0].y
    let v1x = center.children[2].x - center.children[1].x
    let v1y = center.children[2].y - center.children[1].y
    let v2x = center.children[0].x - center.children[2].x
    let v2y = center.children[0].y - center.children[2].y

    let p0x = x - center.children[0].x
    let p0y = y - center.children[0].y
    let p1x = x - center.children[1].x
    let p1y = y - center.children[1].y
    let p2x = x - center.children[2].x
    let p2y = y - center.children[2].y

    let cross0 = v0x * p0y - v0y * p0x
    let cross1 = v1x * p1y - v1y * p1x
    let cross2 = v2x * p2y - v2y * p2x

    return cross0 >= 0 && cross1 >= 0 && cross2 >= 0 || cross0 <= 0 && cross1 <= 0 && cross2 <= 0
  }

  app.addExtension('triangle', { name: "三角形", createShape: createShape, createIcon: createIcon })
})()

