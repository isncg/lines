(function () {
    function onChildMoved(parent, child, byAttach) {
        let childIndex = parent.children.indexOf(child);
        if (childIndex >= 4)
            return;
        if (childIndex == 0)
            child.x = parent.children[3].x;
        else if (childIndex == 3)
            child.x = parent.children[0].x;
        else if (childIndex == 1)
            child.y = parent.children[2].y;
        else if (childIndex == 2)
            child.y = parent.children[1].y;

        parent.x = (parent.children[1].x + parent.children[2].x) / 2;
        parent.y = (parent.children[0].y + parent.children[3].y) / 2;

        parent.children[0].x = parent.x;
        parent.children[1].y = parent.y;
        parent.children[2].y = parent.y;
        parent.children[3].x = parent.x;

        if (byAttach) {
            let dx = child.attach.x - child.x;
            let dy = child.attach.y - child.y;
            if (dx != 0 || dy != 0) {
                for (let i = 0; i < 4; i++) {
                    if (i != childIndex)
                        parent.children[i].attach = null;
                    parent.children[i].x += dx;
                    parent.children[i].y += dy;
                }
                parent.x += dx;
                parent.y += dy;
            }
        }
    }

    function onChildAttached(parent, child) {
        let childIndex = parent.children.indexOf(child);
        if (childIndex >= 4)
            return;
        let dy = child.attach.y - child.y;
        let dx = child.attach.x - child.x;
        if (dx != 0 && dy != 0) {
            for (let i = 0; i < 4; i++) {
                if (i != childIndex) {
                    let child = parent.children[i];
                    child.x += dx;
                    child.y += dy;
                    // child.attach = null;
                }
            }
        }
    }

    let meta = app.createPointMeta({
        fillEnable: { tag: "是否填充", type: "bool", get: shape => shape.fillInfo.enabled, set: (shape, v) => shape.fillInfo.enabled = v },
        fillColor: { tag: "填充颜色", type: "color", get: shape => shape.fillInfo.color, set: (shape, v) => shape.fillInfo.color = v },
    })

    function createShape(x, y, points, segments) {
        let width = 240;
        let height = 180;
        let fillInfo = { color: "#e1d1ff", enabled: true, };
        let center = { x, y, parent: null, children: null, onChildMoved: onChildMoved, onChildAttached: onChildAttached, fillInfo: fillInfo, meta: meta, fill: fill, hit: hit };
        let children = [
            { x: x, y: y - height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
            { x: x + width / 2, y: y, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
            { x: x - width / 2, y: y, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta },
            { x: x, y: y + height / 2, parent: center, children: [], deleteParent: true, fillInfo: fillInfo, meta: meta }
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

    function createIcon() {
        return [
            { polygon: { points: "16,6 28,16 16,26 4,16", fill: "none" } },
            { circle: { cx: 16, cy: 6, r: 3 } },
            { circle: { cx: 28, cy: 16, r: 3 } },
            { circle: { cx: 16, cy: 26, r: 3 } },
            { circle: { cx: 4, cy: 16, r: 3 } },
        ]
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
        let hw = center.children[1].x - center.x
        let hh = center.children[0].y - center.y
        if (hw == 0 || hh == 0)
            return false
        return Math.abs((x - center.x) / hw) + Math.abs((y - center.y) / hh) < 1
    }

    app.addExtension("diamond", { name: "菱形", createShape: createShape, createIcon: createIcon })

})()