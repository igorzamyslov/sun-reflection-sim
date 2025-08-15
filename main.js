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
        { wall: 'top', position: 0.5, width: 100, orientation: 'horizontal' }
    ],
    monitor: {
        x: 400,
        y: 300,
        width: 150,
        height: 10,
        rotation: 0,
    },
    head: {
        x: 400,
        y: 350,
        radius: 15,
    },
    dragging: null, 
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
    state.windows.push({ wall: 'top', position: 0.5, width: 100, orientation: 'horizontal' });
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

function getStandPoints() {
    const m = state.monitor;
    const angle = m.rotation * Math.PI / 180;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const standWidth = m.width / 3;
    const standDepth = m.height * 1.5;
    const hw = standWidth / 2;
    const hh_start = m.height / 2;
    const hh_end = hh_start + standDepth;

    return [
        { x: m.x - hw * c + hh_start * s, y: m.y - hw * s - hh_start * c },
        { x: m.x + hw * c + hh_start * s, y: m.y + hw * s - hh_start * c },
        { x: m.x + hw * c + hh_end * s,   y: m.y + hw * s - hh_end * c },
        { x: m.x - hw * c + hh_end * s,   y: m.y - hw * s - hh_end * c },
    ];
}


function getMonitorScreenLine() {
    const points = getMonitorPoints();
    return { p1: points[0], p2: points[1] };
}

function getWindowLine(win) {
    let center, p1, p2;
    const hw = win.width / 2;

    if (win.x !== undefined && win.y !== undefined) {
        center = { x: win.x, y: win.y };
    } else {
        switch (win.wall) {
            case 'top': center = { x: state.room.width * win.position, y: 0 }; break;
            case 'bottom': center = { x: state.room.width * win.position, y: state.room.height }; break;
            case 'left': center = { x: 0, y: state.room.height * win.position }; break;
            case 'right': center = { x: state.room.width, y: state.room.height * win.position }; break;
        }
    }

    if (win.orientation === 'horizontal') {
        p1 = { x: center.x - hw, y: center.y };
        p2 = { x: center.x + hw, y: center.y };
    } else { // vertical
        p1 = { x: center.x, y: center.y - hw };
        p2 = { x: center.x, y: center.y + hw };
    }
    return { p1, p2 };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    state.windows.forEach((win, index) => {
        const line = getWindowLine(win);
        ctx.strokeStyle = state.selectedWindowIndex === index ? 'red' : 'blue';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(line.p1.x, line.p1.y);
        ctx.lineTo(line.p2.x, line.p2.y);
        ctx.stroke();
    });

    drawOmniLight();

    // Draw Monitor
    ctx.save();
    const m = state.monitor;
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rotation * Math.PI / 180);
    const standWidth = m.width / 3;
    const standDepth = m.height * 1.5;
    ctx.fillStyle = '#555555';
    ctx.fillRect(-standWidth / 2, m.height / 2, standWidth, standDepth);
    ctx.fillStyle = 'darkgrey';
    ctx.fillRect(-m.width / 2, -m.height / 2, m.width, m.height);
    const bezel = 2;
    ctx.fillStyle = 'black';
    ctx.fillRect(-m.width / 2 + bezel, -m.height / 2 + bezel, m.width - bezel * 2, m.height - bezel * 2);
    ctx.restore();

    // Draw Head
    const h = state.head;
    ctx.fillStyle = '#f0d2b6'; // A skin tone
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Nose
    ctx.beginPath();
    ctx.moveTo(h.x, h.y - h.radius * 0.5);
    ctx.lineTo(h.x, h.y - h.radius * 1.2);
    ctx.stroke();


    // Draw rotation handle
    const handleOffset = 20;
    const angle = state.monitor.rotation * Math.PI / 180;
    const handleX = state.monitor.x + (state.monitor.width / 2 + handleOffset) * Math.cos(angle);
    const handleY = state.monitor.y + (state.monitor.width / 2 + handleOffset) * Math.sin(angle);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(handleX, handleY, 5, 0, 2 * Math.PI);
    ctx.fill();
}

function drawOmniLight() {
    // 1. Draw all light sources first
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.windows.forEach(win => {
        const winLine = getWindowLine(win);
        const lightSource = { x: (winLine.p1.x + winLine.p2.x) / 2, y: (winLine.p1.y + winLine.p2.y) / 2 };
        const lightPolygon = createLightPolygon(win, lightSource);
        
        const gradient = ctx.createRadialGradient(lightSource.x, lightSource.y, win.width / 2, lightSource.x, lightSource.y, state.room.height);
        gradient.addColorStop(0, 'rgba(255, 165, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill(lightPolygon);

        // Reflections
        const monitorScreen = getMonitorScreenLine();
        const monitorCenter = {x: (monitorScreen.p1.x + monitorScreen.p2.x)/2, y: (monitorScreen.p1.y + monitorScreen.p2.y)/2};
        if (ctx.isPointInPath(lightPolygon, monitorCenter.x, monitorCenter.y)) {
            const rayToCenter = {x: monitorCenter.x - lightSource.x, y: monitorCenter.y - lightSource.y};
            const intersection = getIntersection(lightSource, monitorCenter, monitorScreen.p1, monitorScreen.p2);
            if (intersection) {
                const screenNormal = { x: monitorScreen.p2.y - monitorScreen.p1.y, y: monitorScreen.p1.x - monitorScreen.p2.x };
                const len = Math.hypot(screenNormal.x, screenNormal.y);
                screenNormal.x /= len; screenNormal.y /= len;
                const rayToCenterMag = Math.hypot(rayToCenter.x, rayToCenter.y);
                const rayToCenterDir = {x: rayToCenter.x / rayToCenterMag, y: rayToCenter.y / rayToCenterMag};
                const dot = rayToCenterDir.x * screenNormal.x + rayToCenterDir.y * screenNormal.y;
                const reflectedDir = { x: rayToCenterDir.x - 2 * dot * screenNormal.x, y: rayToCenterDir.y - 2 * dot * screenNormal.y };
                const reflectionPoly = new Path2D();
                reflectionPoly.moveTo(monitorScreen.p1.x, monitorScreen.p1.y);
                reflectionPoly.lineTo(monitorScreen.p1.x + reflectedDir.x * 2000, monitorScreen.p1.y + reflectedDir.y * 2000);
                reflectionPoly.lineTo(monitorScreen.p2.x + reflectedDir.x * 2000, monitorScreen.p2.y + reflectedDir.y * 2000);
                reflectionPoly.lineTo(monitorScreen.p2.x, monitorScreen.p2.y);
                reflectionPoly.closePath();
                const reflectionGradient = ctx.createRadialGradient(intersection.x, intersection.y, 0, intersection.x, intersection.y, state.room.height);
                reflectionGradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
                reflectionGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = reflectionGradient;
                ctx.fill(reflectionPoly);
            }
        }
    });
    ctx.restore();

    // 2. Draw all shadows
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(40, 40, 40, 0.7)';
    state.windows.forEach(win => {
        const winLine = getWindowLine(win);
        const lightSource = { x: (winLine.p1.x + winLine.p2.x) / 2, y: (winLine.p1.y + winLine.p2.y) / 2 };

        const monitorPoints = getMonitorPoints();
        const monitorShadow = createShadowPolygon(lightSource, monitorPoints);
        ctx.fill(monitorShadow);

        const head = state.head;
        const distToHead = Math.hypot(head.x - lightSource.x, head.y - lightSource.y);
        if (distToHead > head.radius) { // only cast shadow if not inside the head
            const angleToHead = Math.atan2(head.y - lightSource.y, head.x - lightSource.x);
            const tangentSpread = Math.asin(head.radius / distToHead);
            const p1 = {
                x: head.x + head.radius * Math.cos(angleToHead - tangentSpread + Math.PI/2),
                y: head.y + head.radius * Math.sin(angleToHead - tangentSpread + Math.PI/2)
            };
            const p2 = {
                x: head.x + head.radius * Math.cos(angleToHead + tangentSpread - Math.PI/2),
                y: head.y + head.radius * Math.sin(angleToHead + tangentSpread - Math.PI/2)
            };
            const headShadow = createShadowPolygon(lightSource, [p1, p2]);
            ctx.fill(headShadow);
        }
    });
    ctx.restore();
}

function createLightPolygon(win, lightSource) {
    const winLine = getWindowLine(win);
    const lightPolygon = new Path2D();
    lightPolygon.moveTo(winLine.p1.x, winLine.p1.y);
    const numFanRays = 20;
    for (let i = 0; i <= numFanRays; i++) {
        let angle;
        if (win.wall === 'top')    angle = (i / numFanRays) * Math.PI;
        if (win.wall === 'bottom') angle = (i / numFanRays) * Math.PI + Math.PI;
        if (win.wall === 'left')   angle = (i / numFanRays) * Math.PI - Math.PI / 2;
        if (win.wall === 'right')  angle = (i / numFanRays) * Math.PI + Math.PI / 2;
        const rayDir = { x: Math.cos(angle), y: Math.sin(angle) };
        const wallT = intersectRayWithRoom(lightSource, rayDir);
        lightPolygon.lineTo(lightSource.x + rayDir.x * wallT, lightSource.y + rayDir.y * wallT);
    }
    lightPolygon.closePath();
    return lightPolygon;
}

function createShadowPolygon(lightSource, points) {
    const shadowPolygon = new Path2D();
    const shadowLength = 2000;
    const angles = points.map(p => Math.atan2(p.y - lightSource.y, p.x - lightSource.x));
    let minAngle = angles[0], maxAngle = angles[0];
    let minPoint = points[0], maxPoint = points[0];
    for(let i=1; i<angles.length; i++) {
        if(angles[i] < minAngle) { minAngle = angles[i]; minPoint = points[i]; }
        if(angles[i] > maxAngle) { maxAngle = angles[i]; maxPoint = points[i]; }
    }
    shadowPolygon.moveTo(minPoint.x, minPoint.y);
    shadowPolygon.lineTo(minPoint.x + Math.cos(minAngle) * shadowLength, minPoint.y + Math.sin(minAngle) * shadowLength);
    shadowPolygon.lineTo(maxPoint.x + Math.cos(maxAngle) * shadowLength, maxPoint.y + Math.sin(maxAngle) * shadowLength);
    shadowPolygon.lineTo(maxPoint.x, maxPoint.y);
    shadowPolygon.closePath();
    return shadowPolygon;
}

function intersectRayWithRoom(rayOrigin, rayDir) {
    let t = Infinity;
    if (rayDir.y > 0) t = Math.min(t, (state.room.height - rayOrigin.y) / rayDir.y);
    if (rayDir.y < 0) t = Math.min(t, (0 - rayOrigin.y) / rayDir.y);
    if (rayDir.x > 0) t = Math.min(t, (state.room.width - rayOrigin.x) / rayDir.x);
    if (rayDir.x < 0) t = Math.min(t, (0 - rayOrigin.x) / rayDir.x);
    return t;
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

window.addEventListener('resize', updateRoomSize);


canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    state.selectedWindowIndex = null;
    removeWindowBtn.disabled = true;
    draw();
    
    const handleOffset = 20;
    const angle = state.monitor.rotation * Math.PI / 180;
    const handleX = state.monitor.x + (state.monitor.width / 2 + handleOffset) * Math.cos(angle);
    const handleY = state.monitor.y + (state.monitor.width / 2 + handleOffset) * Math.sin(angle);
    if (Math.hypot(pos.x - handleX, pos.y - handleY) < 25) { // Increased hitbox
        state.dragging = { type: 'rotate', initialPos: pos, initialObj: { ...state.monitor } };
        return;
    }

    if (Math.hypot(pos.x - state.head.x, pos.y - state.head.y) < state.head.radius + 20) { // Increased hitbox
        state.dragging = { type: 'head', initialPos: pos, initialObj: { ...state.head } };
        return;
    }

    const monitorPath = new Path2D();
    const monitorPoints = getMonitorPoints();
    monitorPath.moveTo(monitorPoints[0].x, monitorPoints[0].y);
    for (let i = 1; i < monitorPoints.length; i++) monitorPath.lineTo(monitorPoints[i].x, monitorPoints[i].y);
    monitorPath.closePath();

    const standPath = new Path2D();
    const standPoints = getStandPoints();
    standPath.moveTo(standPoints[0].x, standPoints[0].y);
    for (let i = 1; i < standPoints.length; i++) standPath.lineTo(standPoints[i].x, standPoints[i].y);
    standPath.closePath();

    // Add a general circular hitbox for the whole monitor for easier grabbing
    if (ctx.isPointInPath(monitorPath, pos.x, pos.y) 
        || ctx.isPointInPath(standPath, pos.x, pos.y) 
        || Math.hypot(pos.x - state.monitor.x, pos.y - state.monitor.y) < state.monitor.width * 0.75) 
    {
        state.dragging = { type: 'monitor', initialPos: pos, initialObj: { ...state.monitor } };
        return;
    }

    for (let i = 0; i < state.windows.length; i++) {
        const win = state.windows[i];
        const line = getWindowLine(win);
        const dist = Math.abs((line.p2.x-line.p1.x)*(line.p1.y-pos.y) - (line.p1.x-pos.x)*(line.p2.y-line.p1.y)) / Math.hypot(line.p2.x-line.p1.x, line.p2.y-line.p1.y);
        if (dist < 30) { // Increased hitbox
             state.dragging = { type: 'window', index: i, initialPos: pos, initialObj: { ...win } };
             state.selectedWindowIndex = i;
             removeWindowBtn.disabled = false;
             draw();
             return;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!state.dragging) return;
    const pos = getMousePos(e);
    const dx = pos.x - state.dragging.initialPos.x;
    const dy = pos.y - state.dragging.initialPos.y;
    if (state.dragging.type === 'monitor') {
        state.monitor.x = state.dragging.initialObj.x + dx;
        state.monitor.y = state.dragging.initialObj.y + dy;
    } else if (state.dragging.type === 'head') {
        state.head.x = state.dragging.initialObj.x + dx;
        state.head.y = state.dragging.initialObj.y + dy;
    } else if (state.dragging.type === 'rotate') {
        const angle = Math.atan2(pos.y - state.monitor.y, pos.x - state.monitor.x);
        const degrees = angle * 180 / Math.PI;
        state.monitor.rotation = Math.round(degrees / 15) * 15;
    } else if (state.dragging.type === 'window') {
        const win = state.windows[state.dragging.index];
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
        const dists = [ pos.y, state.room.height - pos.y, pos.x, state.room.width - pos.x ];
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
        if (win.wall === 'top' || win.wall === 'bottom') win.orientation = 'horizontal';
        else win.orientation = 'vertical';
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

updateRoomSize();
