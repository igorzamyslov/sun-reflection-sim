const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const roomWidthControl = document.getElementById('room-width');
const roomHeightControl = document.getElementById('room-height');
const addWindowBtn = document.getElementById('add-window');
const removeWindowBtn = document.getElementById('remove-window');

let state = {
    room: {
        width: 800,
        height: 600,
    },
    windows: [
        { wall: 'top', position: 0.5, width: 100 }
    ],
    monitor: {
        x: 400,
        y: 300,
        width: 150,
        height: 10,
        rotation: 0,
    },
    dragging: null, // { type: 'monitor' | 'window' | 'rotate', index?: number, initialPos, initialObj }
    selectedWindowIndex: null,
};

function updateRoomSize() {
    state.room.width = parseInt(roomWidthControl.value);
    state.room.height = parseInt(roomHeightControl.value);
    canvas.width = state.room.width;
    canvas.height = state.room.height;
    draw();
}

function addWindow() {
    state.windows.push({ wall: 'top', position: 0.5, width: 100 });
    draw();
}

function removeWindow() {
    if (state.selectedWindowIndex !== null) {
        state.windows.splice(state.selectedWindowIndex, 1);
        state.selectedWindowIndex = null;
        removeWindowBtn.disabled = true;
        draw();
    }
}

function getMonitorPoints() {
    const m = state.monitor;
    const angle = m.rotation * Math.PI / 180;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const hw = m.width / 2;
    const hh = m.height / 2;

    return [
        { x: m.x - hw * c + hh * s, y: m.y - hw * s - hh * c },
        { x: m.x + hw * c + hh * s, y: m.y + hw * s - hh * c },
        { x: m.x + hw * c - hh * s, y: m.y + hw * s + hh * c },
        { x: m.x - hw * c - hh * s, y: m.y - hw * s + hh * c },
    ];
}

function getMonitorScreenLine() {
    const points = getMonitorPoints();
    return { p1: points[0], p2: points[1] };
}

function getWindowLine(win) {
    // If window is being dragged freely, its line is at its temporary x/y
    if (win.x !== undefined && win.y !== undefined) {
        const hw = win.width / 2;
        return { p1: {x: win.x - hw, y: win.y }, p2: {x: win.x + hw, y: win.y }};
    }

    let p1, p2;
    const hw = win.width / 2;
    switch (win.wall) {
        case 'top':
            p1 = { x: state.room.width * win.position - hw, y: 0 };
            p2 = { x: state.room.width * win.position + hw, y: 0 };
            break;
        case 'bottom':
            p1 = { x: state.room.width * win.position - hw, y: state.room.height };
            p2 = { x: state.room.width * win.position + hw, y: state.room.height };
            break;
        case 'left':
            p1 = { x: 0, y: state.room.height * win.position - hw };
            p2 = { x: 0, y: state.room.height * win.position + hw };
            break;
        case 'right':
            p1 = { x: state.room.width, y: state.room.height * win.position - hw };
            p2 = { x: state.room.width, y: state.room.height * win.position + hw };
            break;
    }
    return { p1, p2 };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw room
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw windows
    state.windows.forEach((win, index) => {
        const line = getWindowLine(win);
        ctx.strokeStyle = state.selectedWindowIndex === index ? 'red' : 'lightblue';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(line.p1.x, line.p1.y);
        ctx.lineTo(line.p2.x, line.p2.y);
        ctx.stroke();
    });

    // Draw monitor
    const monitorPoints = getMonitorPoints();
    ctx.fillStyle = 'darkgrey';
    ctx.beginPath();
    ctx.moveTo(monitorPoints[0].x, monitorPoints[0].y);
    for (let i = 1; i < monitorPoints.length; i++) {
        ctx.lineTo(monitorPoints[i].x, monitorPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw rotation handle
    const handleOffset = 20;
    const angle = state.monitor.rotation * Math.PI / 180;
    const handleX = state.monitor.x + (state.monitor.width / 2 + handleOffset) * Math.cos(angle);
    const handleY = state.monitor.y + (state.monitor.width / 2 + handleOffset) * Math.sin(angle);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(handleX, handleY, 5, 0, 2 * Math.PI);
    ctx.fill();

    drawOmniLight();
}

function drawOmniLight() {
    const monitorScreen = getMonitorScreenLine();
    state.windows.forEach(win => {
        const winLine = getWindowLine(win);
        for (let i = 0; i <= 10; i++) {
            const source = {
                x: winLine.p1.x + (winLine.p2.x - winLine.p1.x) * (i / 10),
                y: winLine.p1.y + (winLine.p2.y - winLine.p1.y) * (i / 10),
            };

            for (let j = 0; j < 20; j++) {
                const fanSpread = Math.PI;
                let angle;

                if (win.wall === 'top')    angle = (j / 19) * fanSpread;
                if (win.wall === 'bottom') angle = (j / 19) * fanSpread + Math.PI;
                if (win.wall === 'left')   angle = (j / 19) * fanSpread - Math.PI / 2;
                if (win.wall === 'right')  angle = (j / 19) * fanSpread + Math.PI / 2;

                const rayDirection = { x: Math.cos(angle), y: Math.sin(angle) };
                const rayEnd = { x: source.x + rayDirection.x * 2000, y: source.y + rayDirection.y * 2000 };
                const intersection = getIntersection(source, rayEnd, monitorScreen.p1, monitorScreen.p2);

                ctx.strokeStyle = 'rgba(255, 165, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);

                if (intersection) {
                    ctx.lineTo(intersection.x, intersection.y);
                    ctx.stroke();

                    const normal = { x: monitorScreen.p2.y - monitorScreen.p1.y, y: monitorScreen.p1.x - monitorScreen.p2.x };
                    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
                    normal.x /= len;
                    normal.y /= len;

                    const dot = rayDirection.x * normal.x + rayDirection.y * normal.y;
                    const reflection = { x: rayDirection.x - 2 * dot * normal.x, y: rayDirection.y - 2 * dot * normal.y };

                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.beginPath();
                    ctx.moveTo(intersection.x, intersection.y);
                    ctx.lineTo(intersection.x + reflection.x * 2000, intersection.y + reflection.y * 2000);
                } else {
                    ctx.lineTo(rayEnd.x, rayEnd.y);
                }
                ctx.stroke();
            }
        }
    });
}

function getIntersection(a, b, c, d) {
    const tTop = (d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x);
    const uTop = (c.y - a.y) * (a.x - b.x) - (c.x - a.x) * (a.y - b.y);
    const bottom = (d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y);

    if (bottom !== 0) {
        const t = tTop / bottom;
        const u = uTop / bottom;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
        }
    }
    return null;
}

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    state.selectedWindowIndex = null;
    removeWindowBtn.disabled = true;

    const handleOffset = 20;
    const angle = state.monitor.rotation * Math.PI / 180;
    const handleX = state.monitor.x + (state.monitor.width / 2 + handleOffset) * Math.cos(angle);
    const handleY = state.monitor.y + (state.monitor.width / 2 + handleOffset) * Math.sin(angle);
    if (Math.hypot(pos.x - handleX, pos.y - handleY) < 10) {
        state.dragging = { type: 'rotate', initialPos: pos, initialObj: { ...state.monitor } };
        return;
    }

    const monitorPoints = getMonitorPoints();
    ctx.beginPath();
    ctx.moveTo(monitorPoints[0].x, monitorPoints[0].y);
    for (let i = 1; i < monitorPoints.length; i++) ctx.lineTo(monitorPoints[i].x, monitorPoints[i].y);
    ctx.closePath();
    if (ctx.isPointInPath(pos.x, pos.y)) {
        state.dragging = { type: 'monitor', initialPos: pos, initialObj: { ...state.monitor } };
        return;
    }

    for (let i = 0; i < state.windows.length; i++) {
        const win = state.windows[i];
        const line = getWindowLine(win);
        const dist = Math.abs((line.p2.x-line.p1.x)*(line.p1.y-pos.y) - (line.p1.x-pos.x)*(line.p2.y-line.p1.y)) / Math.hypot(line.p2.x-line.p1.x, line.p2.y-line.p1.y);
        if (dist < 10) {
             state.dragging = { type: 'window', index: i, initialPos: pos, initialObj: { ...win } };
             state.selectedWindowIndex = i;
             removeWindowBtn.disabled = false;
             return;
        }
    }
    draw();
});

canvas.addEventListener('mousemove', (e) => {
    if (!state.dragging) return;
    const pos = getMousePos(e);
    const dx = pos.x - state.dragging.initialPos.x;
    const dy = pos.y - state.dragging.initialPos.y;

    if (state.dragging.type === 'monitor') {
        state.monitor.x = state.dragging.initialObj.x + dx;
        state.monitor.y = state.dragging.initialObj.y + dy;
    } else if (state.dragging.type === 'rotate') {
        const angle = Math.atan2(pos.y - state.monitor.y, pos.x - state.monitor.x);
        state.monitor.rotation = angle * 180 / Math.PI;
    } else if (state.dragging.type === 'window') {
        const win = state.windows[state.dragging.index];
        // Allow free movement by setting temporary x/y
        const initialLine = getWindowLine(state.dragging.initialObj);
        win.x = (initialLine.p1.x + initialLine.p2.x) / 2 + dx;
        win.y = (initialLine.p1.y + initialLine.p2.y) / 2 + dy;
    }

    draw();
});

canvas.addEventListener('mouseup', (e) => {
    if (!state.dragging) return;

    if (state.dragging.type === 'window') {
        const win = state.windows[state.dragging.index];
        const pos = getMousePos(e);

        // Snap to the nearest wall
        const dists = [
            pos.y, // top
            state.room.height - pos.y, // bottom
            pos.x, // left
            state.room.width - pos.x // right
        ];
        const min_dist = Math.min(...dists);
        const closest_wall_index = dists.indexOf(min_dist);
        
        if (closest_wall_index === 0) {
            win.wall = 'top';
            win.position = pos.x / state.room.width;
        } else if (closest_wall_index === 1) {
            win.wall = 'bottom';
            win.position = pos.x / state.room.width;
        } else if (closest_wall_index === 2) {
            win.wall = 'left';
            win.position = pos.y / state.room.height;
        } else {
            win.wall = 'right';
            win.position = pos.y / state.room.height;
        }
        
        delete win.x;
        delete win.y;
    }

    state.dragging = null;
    draw();
});

roomWidthControl.addEventListener('input', updateRoomSize);
roomHeightControl.addEventListener('input', updateRoomSize);
addWindowBtn.addEventListener('click', addWindow);
removeWindowBtn.addEventListener('click', removeWindow);

// Initial setup
updateRoomSize();
