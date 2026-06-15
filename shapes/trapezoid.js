(function () {
  function onChildMoved(trapezoid, child) {
    let childIndex = trapezoid.children.indexOf(child);
    if (childIndex < 4) {
      if (childIndex === 0) {
        trapezoid.children[1].y = child.y;
      } else if (childIndex === 1) {
        trapezoid.children[0].y = child.y;
      } else if (childIndex === 2) {
        trapezoid.children[3].y = child.y;
      } else if (childIndex === 3) {
        trapezoid.children[2].y = child.y;
      }
      trapezoid.x = (trapezoid.children[0].x + trapezoid.children[1].x + trapezoid.children[2].x + trapezoid.children[3].x) / 4;
      trapezoid.y = (trapezoid.children[0].y + trapezoid.children[1].y + trapezoid.children[2].y + trapezoid.children[3].y) / 4;
    }
  }

  let meta = app.createPointMeta({
    fillEnable: { tag: "填充", type: "bool", get: shape => shape.fillInfo.enabled, set: (shape, v) => shape.fillInfo.enabled = v, group: "fill" },
    fillColor: { type: "color", get: shape => shape.fillInfo.color, set: (shape, v) => shape.fillInfo.color = v, group: "fill" },
  })

  function createShape(x, y, points, segments) {
    let topBase = 120;
    let bottomBase = 240;
    let height = 180;
    let fillInfo = { color: "#d1ffd1", enabled: true, };
    let center = { x, y, parent: null, children: null, onChildMoved: onChildMoved, fillInfo: fillInfo, meta: meta, fill: fill, hit: hit };
    let children = [
      { x: x - topBase / 2, y: y - height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
      { x: x + topBase / 2, y: y - height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
      { x: x - bottomBase / 2, y: y + height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
      { x: x + bottomBase / 2, y: y + height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta }
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
      // 使用向量叉乘判断点是否在凸四边形内部
      // 顶点顺序：0左上,1右上,3右下,2左下 (循环顺序 0->1->3->2->0)
      const edges = [
        { from: children[0], to: children[1] },
        { from: children[1], to: children[3] },
        { from: children[3], to: children[2] },
        { from: children[2], to: children[0] }
      ];
      let sign = null;
      for (let i = 0; i < edges.length; i++) {
        const from = edges[i].from;
        const to = edges[i].to;
        const edgeX = to.x - from.x;
        const edgeY = to.y - from.y;
        const pointX = x - from.x;
        const pointY = y - from.y;
        const cross = edgeX * pointY - edgeY * pointX;
        if (cross !== 0) {
          const currentSign = cross > 0 ? 1 : -1;
          if (sign === null) {
            sign = currentSign;
          } else if (sign !== currentSign) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  function createIcon() {
    return [
      { polygon: { points: "10,6 22,6 28,26 4,26", fill: "none" } },
      { circle: { cx: 10, cy: 6, r: 3 } },
      { circle: { cx: 22, cy: 6, r: 3 } },
      { circle: { cx: 4, cy: 26, r: 3 } },
      { circle: { cx: 28, cy: 26, r: 3 } },
    ]
  }

  app.addExtension('trapezoid', { name: "梯形", createShape: createShape, createIcon: createIcon })
})()

