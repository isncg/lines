(function () {
    app = {};

    let menuList = [];
    let currentSelectedPoint = null;
    let extensions = {};
    let createFuncName = null;
    let shapes = [];
    let connectionSegments = [];

    app.createNewShapeAt = function (x, y, parent) {
        let points = [];
        let segments = [];
        let arcs = [];
        let shape = { points, segments, arcs };
        const newPoint = app.getCurrentExtension().createShape(x, y, points, segments, arcs);
        newPoint.shape = shape;
        if (parent) {
            parent.children.push(newPoint);
            connectionSegments.push({ p1: parent, p2: newPoint });
        }
        shapes.push(shape);
        app.setCurrentSelectedPoint(newPoint);
    }

    app.connectPoints = function (p1, p2) {
        if (!p1 || !p2)
            return false;
        if (p1 == p2)
            return false;
        this.foreachSegments(seg => {
            if (seg.p1 == p1 && seg.p2 == p2 || seg.p2 == p1 && seg.p1 == p2)
                return false;
        });
        connectionSegments.push({ p1, p2 });
        return true
    }

    app.foreachPoints = function (cb) {
        for (const s of shapes) {
            for (const p of s.points) {
                cb(p);
            }
        }
    }

    app.foreachSegments = function (cb) {
        for (const s of shapes) {
            for (const p of s.segments) {
                cb(p);
            }
        }

        for (const s of connectionSegments) {
            cb(s);
        }
    }

    app.foreachArcs = function (cb) {
        for (const s of shapes) {
            for (const a of s.arcs) {
                cb(a);
            }
        }
    }

    app.findNearbyPoint = function (x, y) {
        let minDistanceSqr = 64;
        let result = null;
        let customHitResult = null;
        let customHitDistanceSqr = null;
        this.foreachPoints(function (p) {
            const dx = p.x - x;
            const dy = p.y - y;
            const distanceSqr = dx * dx + dy * dy
            if (distanceSqr < minDistanceSqr) {
                minDistanceSqr = distanceSqr;
                result = p;
                customHitResult = null;
            }
            else if (p.hit && p.hit(p, x, y)) {
                if (customHitDistanceSqr == null || distanceSqr < customHitDistanceSqr) {
                    customHitResult = p;
                    customHitDistanceSqr = distanceSqr;
                }
            }
        });
        return result || customHitResult;
    }

    app.getExtension = function (key) {
        return extensions[key];
    }
    app.getCurrentExtension = function () {
        return extensions[createFuncName]
    }
    app.getCurrentExtensionKey = function () {
        return createFuncName
    }
    app.setCurrentExtensionKey = function (key) {
        createFuncName = key;
    }

    app.getCurrentSelectedPoint = function () {
        return currentSelectedPoint;
    }
    app.setCurrentSelectedPoint = function (point) {
        currentSelectedPoint = point;
    }

    // 更新状态显示
    app.updateStatus = function () {
        const curExt = this.getCurrentExtension()
        const toolName = curExt && curExt.name || this.getCurrentExtensionKey();
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = `工具: ${toolName}`;
    }
    app.addExtension = function (key, ext) {
        console.log('add extension', key, ext);
        console.assert(!this.getExtension(key));
        extensions[key] = ext;
        menuList.push({
            key: key,
            icon: ext.createIcon(),
        })
    }

    app.addExtension('point', {
        createShape: (x, y, points) => {
            const newPoint = { x, y, parent: null, children: [] };
            points.push(newPoint);
            return newPoint;
        },
        createIcon: () => {
            return [{ circle: { cx: 16, cy: 16, r: 3 } }]
        },
        name: "点"
    })

    app.inspectTargetMetaDefault = {
        x: { tag: "X", type: "int", set: function (p, v) { movePoint(p, v - p.x, 0); } },
        y: { tag: "Y", type: "int", set: function (p, v) { movePoint(p, 0, v - p.y); } },
        tag: { tag: "标签", type: "string" },
        color: { tag: "颜色", type: "color" },
    };

    app.createPointMeta = function (m) {
        let result = {}
        for (let k in this.inspectTargetMetaDefault) {
            result[k] = this.inspectTargetMetaDefault[k]
        }
        for (let k in m) {
            result[k] = m[k];
        }
        return result;
    }

    app.onPropertySubmit = function () { };

    app.updatePropertyPanel = function (inspectTarget, inspectTargetMeta) {
        const panel = document.getElementById('property-panel');
        if (!panel) return;
        panel.innerHTML = '';
        if (!inspectTarget || !inspectTargetMeta) {
            panel.innerHTML = '<div class="prop-empty">未选择对象</div>';
            return;
        }
        const target = inspectTarget;
        const meta = inspectTargetMeta;
        let rowDict = {}
        for (const key in meta) {
            const fieldMeta = meta[key];
            const tag = fieldMeta.tag;
            const type = fieldMeta.type || 'string';
            const getter = fieldMeta.get || ((obj) => obj[key]);
            const setter = fieldMeta.set || ((obj, val) => { obj[key] = val; });
            const value = getter(target);
            const groupId = fieldMeta.group
            let row = null;
            if (groupId)
                row = rowDict[groupId]
            if (!row) {
                row = document.createElement('div');
                panel.appendChild(row);
                if (groupId)
                    rowDict[groupId] = row
            }
            row.className = 'prop-row';
            if (tag) {
                const label = document.createElement('span');
                label.className = 'prop-label';
                label.textContent = tag;
                row.appendChild(label);
            }
            let input;
            if (type === 'int' || type === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.value = value;
                input.addEventListener('input', () => {
                    let newVal = type === 'int' ? parseInt(input.value, 10) : parseFloat(input.value);
                    if (isNaN(newVal)) newVal = 0;
                    setter(target, newVal);
                    this.onPropertySubmit();
                });
            } else if (type === 'string') {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
                input.addEventListener('input', () => {
                    setter(target, input.value);
                    this.onPropertySubmit();
                });
            } else if (type === 'bool') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
                input.addEventListener('change', () => {
                    setter(target, input.checked);
                    this.onPropertySubmit();
                });
            } else if (type === 'color') {
                input = document.createElement('input');
                input.type = 'color';
                input.value = value;
                input.addEventListener('input', () => {
                    setter(target, input.value);
                    this.onPropertySubmit();
                });
            } else {
                // read-only display
                input = document.createElement('span');
                input.className = 'prop-value';
                input.textContent = String(value);
            }
            if (input) {
                input.className = 'prop-input';
                row.appendChild(input);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // 工具箱按钮事件
        const toolbar = document.getElementById('toolbar');
        for (let menu of menuList) {
            if (!app.getCurrentExtensionKey())
                app.setCurrentExtensionKey(menu.key);
            const btn = document.createElement('button');
            btn.setAttribute("data-tool", menu.key)
            if (app.getCurrentExtensionKey() === menu.key) {
                btn.classList.add('active');
            }

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute("width", "32")
            svg.setAttribute("height", "32")
            svg.setAttribute("viewBox", "0 0 32 32")
            svg.setAttribute("fill", "currentColor")
            svg.setAttribute("stroke", "currentColor")
            svg.setAttribute("stroke-width", "2")
            for (let element of menu.icon) {
                for (let name in element) {
                    const shape = document.createElementNS('http://www.w3.org/2000/svg', name);
                    let params = element[name];
                    for (let param in params) {
                        shape.setAttribute(param, params[param]);
                    }
                    svg.appendChild(shape);
                }
            }
            btn.appendChild(svg);
            toolbar.appendChild(btn);
            btn.addEventListener('click', function (e) {
                app.setCurrentExtensionKey(menu.key);
                toolbar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                app.updateStatus();
            });
        }
        app.updateStatus();
    })
})();

