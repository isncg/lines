(function () {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // 用于区分点击和拖拽
    let isLeftButtonDown = false;

    // 拖拽相关
    let draggedPoint = null;
    // 网格设置
    const GRID_SIZE = 20;
    // 绘制网格
    function drawGrid() {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // 吸附到网格
    function snapToGrid(value) {
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    }

    function moveAttachedPoint(point) {
        app.foreachPoints(p => {
            if (p.attach == point) {
                p.x = point.x;
                p.y = point.y;
                let parent = p.parent;
                if (parent != null && parent.onChildMoved != null) {
                    parent.onChildMoved(parent, p, true);
                    moveAttachedPoint(parent)
                }
            }
        });
    }

    // 递归移动子点
    function movePoint(point, dx, dy, byParent) {
        point.x += dx;
        point.y += dy;
        for (const child of point.children)
            movePoint(child, dx, dy, true);

        app.foreachPoints(p => {
            if (!p.parent && p.attach == point)
                movePoint(p, dx, dy, false);
        });


        let parent = point.parent;
        if (!byParent && parent && parent.onChildMoved != null) {
            parent.onChildMoved(parent, point)
            for (let child of parent.children)
                moveAttachedPoint(child);

        }
        else
            moveAttachedPoint(point);

    }

    // 绘制所有内容
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制网格
        drawGrid();

        // 绘制填充
        app.foreachPoints(p => {
            if (p.fill) {
                p.fill(p, ctx);
            }
        });

        // 绘制线段
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        app.foreachSegments(seg => {
            ctx.beginPath();
            ctx.moveTo(seg.p1.x, seg.p1.y);
            ctx.lineTo(seg.p2.x, seg.p2.y);
            ctx.stroke();
        });

        app.foreachArcs(arc => {
            let c = arc.center
            ctx.beginPath();
            ctx.arc(c.x, c.y, arc.radius, arc.start, arc.end);
            ctx.stroke();
        })

        // 绘制点
        const pointRadius = 4;
        ctx.font = "20px serif"
        ctx.textAlign = 'center';
        app.foreachPoints(p => {
            let color = p.color || '#000';
            ctx.beginPath();
            ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#000';
            let tag = p.tag
            if (tag && tag.length > 0) {
                ctx.fillText(tag, p.x, p.y - 12);
            }
        })

        // 高亮显示连线模式下选中的第一个点
        let p = app.getCurrentSelectedPoint();
        if (p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, pointRadius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function onDragStart(clickedPoint) {
        // 开始拖拽
        draggedPoint = clickedPoint;
        isLeftButtonDown = false; // 防止在 mouseup 中添加点
    }

    // 处理鼠标按下
    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let clickedPoint = app.findNearbyPoint(x, y);
        let curPoint = app.getCurrentSelectedPoint()
        app.setCurrentSelectedPoint(clickedPoint);
        if (e.button === 0) {
            if (clickedPoint) {
                while (clickedPoint.attach)
                    clickedPoint = clickedPoint.attach;
                if (!app.connectPoints(curPoint, clickedPoint))
                    onDragStart(clickedPoint);
            }
            else {
                let parent = null;
                if (e.ctrlKey && curPoint)
                    parent = curPoint;
                app.createNewShapeAt(x, y, parent);
            }
        }
        selectPoint(app.getCurrentSelectedPoint());
        app.updateStatus();
        draw();
    }



    // 处理鼠标移动
    function handleMouseMove(e) {
        // 左键拖拽
        if (draggedPoint) {
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // 如果按下 Ctrl 键，吸附到网格
            if (e.ctrlKey) {
                let snapToPoint = null;
                let snapToPointDistanceSqr = 64;

                app.foreachPoints(p => {
                    if (p != draggedPoint && p.attach != draggedPoint) {
                        let dx = p.x - x;
                        let dy = p.y - y;
                        let distanceSqr = dx * dx + dy * dy;
                        if (distanceSqr < snapToPointDistanceSqr) {
                            snapToPoint = p;
                            snapToPointDistanceSqr = distanceSqr;
                        }
                    }
                })

                if (snapToPoint) {
                    while (snapToPoint.attach)
                        snapToPoint = snapToPoint.attach
                    x = snapToPoint.x;
                    y = snapToPoint.y;
                }
                else {
                    x = snapToGrid(x);
                    y = snapToGrid(y);
                }
                draggedPoint.attach = snapToPoint;
                if (snapToPoint) {
                    let parent = draggedPoint.parent;
                    if (parent) {
                        let callback = parent.onChildAttached;
                        if (callback) {
                            callback(parent, draggedPoint);
                        }
                    }
                }
            }

            // 计算位移
            const dx = x - draggedPoint.x;
            const dy = y - draggedPoint.y;

            movePoint(draggedPoint, dx, dy);
            draw();
            return;
        }
    }

    function clearBrokenAttach() {
        app.foreachPoints(p => {
            if (p.attach && (p.attach.x != p.x || p.attach.y != p.y))
                p.attach = null;
        })
    }

    // 处理鼠标松开
    function handleMouseUp(e) {
        clearBrokenAttach();
        const wasDragging = draggedPoint !== null;
        if (draggedPoint) {
            draggedPoint = null;
        }
        // 只在鼠标松开发生在画布上或拖拽结束时重绘，避免点击属性面板时重建面板导致输入框失去焦点
        if (e.target === canvas || wasDragging) {
            draw();
            app.updateStatus();
            app.updatePropertyPanel(inspectTarget, inspectTargetMeta);
        }
    }

    function deletePoint(point) {
        // 从父点的子列表中移除
        let parent = point.parent
        if (parent) {
            if (point.deleteParent) {
                deletePoint(parent);
                return;
            }
            const idx = point.parent.children.indexOf(point);
            if (idx !== -1) {
                point.parent.children.splice(idx, 1);
            }
        }
        // 从 points 中移除
        const idx = points.indexOf(point);
        if (idx !== -1) {
            points.splice(idx, 1);
        }
        // 删除所有包含该点的线段
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i];
            if (seg.p1 === point || seg.p2 === point) {
                segments.splice(i, 1);
            }
        }
        for (const child of point.children) {
            child.parent = null;
            deletePoint(child)
        }
    }

    let inspectTarget = null;
    let inspectTargetMeta = null;
    function selectPoint(point) {
        if (point) {
            inspectTarget = point;
            inspectTargetMeta = point.meta || app.inspectTargetMetaDefault;
        } else {
            inspectTarget = null;
            inspectTargetMeta = null;
        }
        app.updatePropertyPanel(inspectTarget, inspectTargetMeta);
    }




    // 阻止右键菜单
    canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    // 绑定鼠标事件
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // 键盘事件：删除选中的点
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Delete') {
            if (app.getCurrentSelectedPoint()) {
                e.preventDefault();
                deletePoint(app.getCurrentSelectedPoint());
                selectPoint(null);
                draw();
                app.updateStatus();
            }
        }
    });

    // 初始绘制
    draw();
    app.updateStatus();
    app.updatePropertyPanel(inspectTarget, inspectTargetMeta);
    app.onPropertySubmit = draw
})();

