(function () {
    function onChildMoved(center, child) {
        let control = center.children[0];
        if (control != child)
            return;
        let radius = Math.sqrt(Math.pow(control.x - center.x, 2) + Math.pow(control.y - center.y, 2));
        center.arc.radius = radius;
    }

    let meta = app.createPointMeta({
        fillEnable: { tag: "是否填充", type: "bool", get: shape => shape.fillInfo.enabled, set: (shape, v) => shape.fillInfo.enabled = v },
        fillColor: { tag: "填充颜色", type: "color", get: shape => shape.fillInfo.color, set: (shape, v) => shape.fillInfo.color = v },
    })

    function createShape(x, y, points, segments, arcs) {
        let initRadius = 50;
        let fillInfo = { color: "#fcffd1", enabled: true, };
        let center = { x, y, onChildMoved, fillInfo, meta, fill }
        let control = { x: x + initRadius, y, children: [], parent: center, fillInfo, meta }
        let arc = { center, start: 0, end: 2 * Math.PI, radius: initRadius }
        center.children = [control]
        center.arc = arc

        points.push(center)
        points.push(control)
        arcs.push(arc)

        return center;
    }
    function createIcon() {
        return [
            { circle: { cx: 16, cy: 16, r: 14, fill: "none" } },
            { circle: { cx: 16, cy: 16, r: 3 } },
            { circle: { cx: 26, cy: 6, r: 3 } },
        ]
    }

    function fill(center, ctx) {
        let fillInfo = center.fillInfo;
        let fillColor = null
        if (fillInfo && fillInfo.enabled)
            fillColor = fillInfo.color;
        if (fillColor) {
            const arc = center.arc;
            ctx.beginPath();
            ctx.arc(arc.center.x, arc.center.y, arc.radius, arc.start, arc.end);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            // const children = center.children;
            // if (children && children.length >= 3) {
            //     ctx.beginPath();
            //     ctx.moveTo(children[0].x, children[0].y);
            //     ctx.lineTo(children[1].x, children[1].y);
            //     ctx.lineTo(children[2].x, children[2].y);
            //     ctx.closePath();
            //     ctx.fillStyle = fillColor;
            //     ctx.fill();
            // }
        }
    }

    app.addExtension('circle', { name: "圆形", createShape: createShape, createIcon: createIcon });
})()