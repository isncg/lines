(function () {
  function onChildMoved(rect, child) {
    let childIndex = rect.children.indexOf(child);
    if (childIndex < 4) {
      if (childIndex >= 2)
        rect.children[childIndex - 2].x = child.x;
      else
        rect.children[childIndex + 2].x = child.x;
      if (childIndex % 2 == 0)
        rect.children[childIndex + 1].y = child.y;
      else
        rect.children[childIndex - 1].y = child.y;
      rect.x = (rect.children[0].x + rect.children[3].x) / 2;
      rect.y = (rect.children[0].y + rect.children[3].y) / 2;
    }
  }

  let meta = app.createPointMeta({
    fillEnable: { tag: "填充", type: "bool", get: shape => shape.fillInfo.enabled, set: (shape, v) => shape.fillInfo.enabled = v, group: "fill" },
    fillColor: { type: "color", get: shape => shape.fillInfo.color, set: (shape, v) => shape.fillInfo.color = v, group: "fill" },
  })

  function createShape(x, y, points, segments) {
    let width = 240;
    let height = 180;
    let fillInfo = { color: "#d1e7ff", enabled: true, };
    let center = { x, y, parent: null, children: null, onChildMoved: onChildMoved, fillInfo: fillInfo, meta: meta, fill: fill, hit: hit };
    let children = [
      { x: x - width / 2, y: y - height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
      { x: x + width / 2, y: y - height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
      { x: x - width / 2, y: y + height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
      { x: x + width / 2, y: y + height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta }
    ];
    center.children = children;

    points.push(center);
    points.push(children[0])
    points.push(children[1])
    points.push(children[2])
    points.push(children[3])

    segments.push({ p1: children[0], p2: children[1] });
    segments.push({ p1: children[2], p2: children[3] });
    segments.push({ p1: children[0], p2: children[2] });
    segments.push({ p1: children[1], p2: children[3] });

    return center;
  }

  function fill(center, ctx) {
    let fillInfo = center.fillInfo;
    let fillColor = null
    if (fillInfo && fillInfo.enabled)
      fillColor = fillInfo.color;
    if (fillColor) {
      const children = center.children;
      if (children && children.length >= 4) {
        ctx.beginPath();
        ctx.moveTo(children[0].x, children[0].y);
        ctx.lineTo(children[1].x, children[1].y);
        ctx.lineTo(children[3].x, children[3].y);
        ctx.lineTo(children[2].x, children[2].y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
    }
  }

  function hit(center, x, y) {
    const children = center.children;
    if (children && children.length >= 4) {
      return x > children[0].x && x < children[3].x && y > children[0].y && y < children[3].y;
    }
  }

  function createIcon() {
    return [
      { rect: { x: 7, y: 7, width: 18, height: 18, rx: 2, fill: "none" } },
      { circle: { cx: 7, cy: 7, r: 3 } },
      { circle: { cx: 25, cy: 7, r: 3 } },
      { circle: { cx: 7, cy: 25, r: 3 } },
      { circle: { cx: 25, cy: 25, r: 3 } },
    ]
  }

  app.addExtension('rect', { name: "矩形", createShape: createShape, createIcon: createIcon })
})()

