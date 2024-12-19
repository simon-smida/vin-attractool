let canvas, ctx;
let paused = false;
let rotationX = 0;
let rotationY = 0;
let lastMouseX = null;
let lastMouseY = null;
let mouseDown = false;
let speed = 1;
let particleCount = 1000;
let particles = [];
let colorScheme = "rainbow";
let bgColor = "#000000";
let attractorType = "lorenz";
let sidebarOpen = false;

const attractorParams = {
    lorenz: { sigma: 10, rho: 28, beta: 2.667 },
    rossler: { a: 0.2, b: 0.2, c: 5.7 },
    halvorsen: { a: 1.4 },
    chen: { a: 35, b: 3, c: 28 },
    aizawa: { a: 0.95, b: 0.7, c: 0.6, d: 3.5 },
    dadras: { p: 3, q: 2.7 }
};

const prettyParameters = {
    lorenz: { sigma: 10, rho: 28, beta: 2.667 },
    rossler: { a: 0.2, b: 0.2, c: 5.7 },
    halvorsen: { a: 1.4 },
    chen: { a: 35, b: 3, c: 28 },
    aizawa: { a: 0.95, b: 0.7, c: 0.6, d: 3.5 },
    dadras: { p: 3, q: 2.7 }
};

const paramRanges = {
    lorenz: {
        sigma: { min: 0, max: 50, step: 0.1 },
        rho: { min: 0, max: 50, step: 0.1 },
        beta: { min: 0, max: 10, step: 0.1 }
    },
    rossler: {
        a: { min: 0, max: 1, step: 0.01 },
        b: { min: 0, max: 1, step: 0.01 },
        c: { min: 0, max: 10, step: 0.1 }
    },
    halvorsen: {
        a: { min: 0, max: 5, step: 0.1 }
    },
    chen: {
        a: { min: 0, max: 50, step: 0.5 },
        b: { min: 0, max: 10, step: 0.1 },
        c: { min: 0, max: 50, step: 0.5 }
    },
    aizawa: {
        a: { min: 0, max: 2, step: 0.01 },
        b: { min: 0, max: 2, step: 0.01 },
        c: { min: 0, max: 2, step: 0.01 },
        d: { min: 0, max: 5, step: 0.1 }
    },
    dadras: {
        p: { min: 0, max: 10, step: 0.1 },
        q: { min: 0, max: 10, step: 0.1 }
    }
};

window.onload = () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();

    initParticles();
    initUI();
    updateParametersUI();
    updateEquations();

    animate();
};

function initUI() {
    document.getElementById('particleCount').addEventListener('input', e => {
        particleCount = parseInt(e.target.value);
        document.getElementById('particleCountVal').textContent = particleCount;
        initParticles();
    });
    document.getElementById('speed').addEventListener('input', e => {
        speed = parseFloat(e.target.value);
        document.getElementById('speedVal').textContent = speed + "x";
    });
    document.getElementById('colorScheme').addEventListener('change', e => {
        colorScheme = e.target.value;
    });

    document.getElementById('attractorType').addEventListener('change', e => {
        attractorType = e.target.value;
        setPredefinedParameters();
        updateParametersUI();
        resetParticles();
        updateEquations();
    });

    document.getElementById('resetBtn').addEventListener('click', resetParticles);
    document.getElementById('pauseBtn').addEventListener('click', () => {
        paused = !paused;
        const pauseBtn = document.getElementById('pauseBtn');
        if (paused) {
            pauseBtn.innerHTML = '▶';
            pauseBtn.title = 'Resume Simulation';
        } else {
            pauseBtn.innerHTML = '⏸';
            pauseBtn.title = 'Pause Simulation';
        }
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
        const helpOverlay = document.getElementById('helpOverlay');
        helpOverlay.style.display = (helpOverlay.style.display === 'none' ? 'block' : 'none');
    });

    document.getElementById('equationsBtn').addEventListener('click', () => {
        let eqOverlay = document.getElementById('equationsOverlay');
        updateEquations();
        eqOverlay.style.display = (eqOverlay.style.display === 'none' ? 'block' : 'none');
    });

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('mousedown', e => { mouseDown = true; lastMouseX = e.clientX; lastMouseY = e.clientY; });
    canvas.addEventListener('mouseup', () => { mouseDown = false; });
    canvas.addEventListener('mousemove', mouseMove);
    window.addEventListener('resize', resizeCanvas);

    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    menuToggleBtn.addEventListener('click', () => {
        sidebarOpen = !sidebarOpen;
        if (sidebarOpen) {
            sidebar.classList.add('open');
        } else {
            sidebar.classList.remove('open');
        }
    });
}

function updateEquations() {
    let eqDiv = document.getElementById('equationsContent');
    let eqText = "";

    if (attractorType === 'lorenz') {
        eqText = `
        \\[
        \\frac{dx}{dt} = \\sigma(y - x)
        \\]
        \\[
        \\frac{dy}{dt} = x(\\rho - z) - y
        \\]
        \\[
        \\frac{dz}{dt} = xy - \\beta z
        \\]`;
    } else if (attractorType === 'rossler') {
        eqText = `
        \\[
        \\frac{dx}{dt} = -y - z
        \\]
        \\[
        \\frac{dy}{dt} = x + a y
        \\]
        \\[
        \\frac{dz}{dt} = b + z(x - c)
        \\]`;
    } else if (attractorType === 'halvorsen') {
        eqText = `
        \\[
        \\frac{dx}{dt} = -a x - y - z(y + x)
        \\]
        \\[
        \\frac{dy}{dt} = -a y - z - x(z + y)
        \\]
        \\[
        \\frac{dz}{dt} = -a z - x - y(x + z)
        \\]`;
    } else if (attractorType === 'chen') {
        eqText = `
        \\[
        \\frac{dx}{dt} = a(y - x)
        \\]
        \\[
        \\frac{dy}{dt} = (c - a)x - xz + c y
        \\]
        \\[
        \\frac{dz}{dt} = xy - b z
        \\]`;
    } else if (attractorType === 'aizawa') {
        eqText = `
        \\[
        \\frac{dx}{dt} = (z - b)x - d y
        \\]
        \\[
        \\frac{dy}{dt} = d x + (z - b) y
        \\]
        \\[
        \\frac{dz}{dt} = c + z(a - z^{2}) + \\frac{x^{2} + y^{2}}{2}
        \\]`;
    } else if (attractorType === 'dadras') {
        eqText = `
        \\[
        \\frac{dx}{dt} = y - x
        \\]
        \\[
        \\frac{dy}{dt} = x z + p y
        \\]
        \\[
        \\frac{dz}{dt} = q z + x y
        \\]`;
    }

    eqDiv.innerHTML = eqText;
    if (window.MathJax && window.MathJax.typeset) {
        MathJax.typeset();
    }
}

function setPredefinedParameters() {
    Object.assign(attractorParams[attractorType], prettyParameters[attractorType]);
    updateParametersUI();
}

function updateParametersUI() {
    const container = document.getElementById('paramContainer');
    container.innerHTML = "";
    const params = attractorParams[attractorType];
    const ranges = paramRanges[attractorType];

    for (let key in params) {
        let val = params[key];
        let rangeSpec = ranges[key];
        if (!rangeSpec) continue;

        let group = document.createElement('div');
        group.className = 'param-group';

        let labelRow = document.createElement('div');
        labelRow.className = 'label-row';

        let label = document.createElement('label');
        label.textContent = key;

        let span = document.createElement('span');
        span.id = key + "Val";
        span.textContent = val.toFixed(3);

        let input = document.createElement('input');
        input.type = 'range';
        input.id = key;
        input.min = rangeSpec.min;
        input.max = rangeSpec.max;
        input.step = rangeSpec.step;
        input.value = val;
        input.addEventListener('input', e => {
            const newVal = parseFloat(e.target.value);
            attractorParams[attractorType][key] = newVal;
            span.textContent = newVal.toFixed(3);
        });

        labelRow.appendChild(label);
        labelRow.appendChild(span);
        group.appendChild(labelRow);
        group.appendChild(input);
        container.appendChild(group);
    }
}

function handleKey(e) {
    let step = e.shiftKey ? 1.0 : 0.1;

    if (e.code === 'Escape') {
        const helpOverlay = document.getElementById('helpOverlay');
        const eqOverlay = document.getElementById('equationsOverlay');

        if (helpOverlay.style.display === 'block') {
            helpOverlay.style.display = 'none';
        }
        if (eqOverlay.style.display === 'block') {
            eqOverlay.style.display = 'none';
        }
    } else if (e.code === 'Space') {
        paused = !paused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.innerHTML = paused ? '▶' : '⏸';
        pauseBtn.title = paused ? 'Resume Simulation' : 'Pause Simulation';
    } else if (e.code === 'Enter') {
        setPredefinedParameters();
        updateParametersUI();
    } else {
        let p = attractorParams[attractorType];
        if (!p) return;
        const keys = Object.keys(p);
        if (keys.length === 0) return;

        let primaryParam = keys[0];
        if (attractorType === 'lorenz') {
            if (e.code === 'ArrowUp') { p.rho += step; }
            else if (e.code === 'ArrowDown') { p.rho -= step; }
            else if (e.code === 'ArrowLeft') { p.sigma -= step; }
            else if (e.code === 'ArrowRight') { p.sigma += step; }
        } else {
            if (e.code === 'ArrowUp' || e.code === 'ArrowRight') p[primaryParam] += step;
            if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') p[primaryParam] -= step;
        }
        updateParametersUI();
    }
}

function mouseMove(e) {
    if (!mouseDown) return;
    let dx = e.clientX - lastMouseX;
    let dy = e.clientY - lastMouseY;
    rotationX += dy * 0.01;
    rotationY += dx * 0.01;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
}

function resizeCanvas() {
    // Adjust canvas size based on sidebar presence on larger screens
    const sidebar = document.querySelector('.sidebar');
    let sidebarWidth = window.innerWidth > 768 ? sidebar.offsetWidth : 0;
    canvas.width = window.innerWidth - sidebarWidth;
    canvas.height = (window.innerWidth <= 768) ? (window.innerHeight - 50) : window.innerHeight;
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        let hue = Math.random() * 360;
        let hueInc = 0.5 + Math.random();
        particles.push({
            x: Math.random() * 10 - 5,
            y: Math.random() * 10 - 5,
            z: Math.random() * 10 - 5,
            hue: hue,
            hueInc: hueInc
        });
    }
}

function resetParticles() {
    initParticles();
}

function stepLorenz(p) {
    let { sigma, rho, beta } = attractorParams.lorenz;
    let dx = sigma * (p.y - p.x);
    let dy = p.x * (rho - p.z) - p.y;
    let dz = p.x * p.y - beta * p.z;
    p.x += dx * 0.01 * speed;
    p.y += dy * 0.01 * speed;
    p.z += dz * 0.01 * speed;
}

function stepRossler(p) {
    let { a, b, c } = attractorParams.rossler;
    let dx = -p.y - p.z;
    let dy = p.x + a * p.y;
    let dz = b + p.z * (p.x - c);
    p.x += dx * 0.01 * speed;
    p.y += dy * 0.01 * speed;
    p.z += dz * 0.01 * speed;
}

function stepHalvorsen(p) {
    let { a } = attractorParams.halvorsen;
    let dx = -a * p.x - p.y - p.z * (p.y + p.x);
    let dy = -a * p.y - p.z - p.x * (p.z + p.y);
    let dz = -a * p.z - p.x - p.y * (p.x + p.z);
    p.x += dx * 0.005 * speed;
    p.y += dy * 0.005 * speed;
    p.z += dz * 0.005 * speed;
}

function stepChen(p) {
    let { a, b, c } = attractorParams.chen;
    let dx = a * (p.y - p.x);
    let dy = (c - a) * p.x - p.x * p.z + c * p.y;
    let dz = p.x * p.y - b * p.z;
    p.x += dx * 0.01 * speed;
    p.y += dy * 0.01 * speed;
    p.z += dz * 0.01 * speed;
}

function stepAizawa(p) {
    let { a, b, c, d } = attractorParams.aizawa;
    let dx = (p.z - b) * p.x - d * p.y;
    let dy = d * p.x + (p.z - b) * p.y;
    let dz = c + p.z * (a - p.z * p.z) + (p.x * p.x + p.y * p.y) / 2;
    p.x += dx * 0.01 * speed;
    p.y += dy * 0.01 * speed;
    p.z += dz * 0.01 * speed;
}

function stepDadras(p) {
    let { p: pp, q } = attractorParams.dadras;
    let dx = p.y - p.x;
    let dy = p.x * p.z + pp * p.y;
    let dz = q * p.z + p.x * p.y;
    p.x += dx * 0.01 * speed;
    p.y += dy * 0.01 * speed;
    p.z += dz * 0.01 * speed;
}

function animate() {
    requestAnimationFrame(animate);

    ctx.fillStyle = hexToRGBA(bgColor, 0.1);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let scale = 10;

    if (!paused) {
        for (let p of particles) {
            switch (attractorType) {
                case 'lorenz': stepLorenz(p); break;
                case 'rossler': stepRossler(p); break;
                case 'halvorsen': stepHalvorsen(p); break;
                case 'chen': stepChen(p); break;
                case 'aizawa': stepAizawa(p); break;
                case 'dadras': stepDadras(p); break;
            }
        }
    }

    for (let p of particles) {
        let X = p.x, Y = p.y, Z = p.z;

        let cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
        let cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);

        let xz = X * cosY - Z * sinY;
        let zz = Z * cosY + X * sinY;
        let yz = Y * cosX - zz * sinX;

        let px = xz * scale + centerX;
        let py = yz * scale + centerY;

        ctx.fillStyle = getColor(p);
        ctx.fillRect(px, py, 2, 2);
    }
}

function getColor(p) {
    p.hue += p.hueInc * speed;
    if (p.hue > 360) p.hue -= 360;
    let h = p.hue;
    switch (colorScheme) {
        case "rainbow":
            return `hsl(${h},100%,50%)`;
        case "fire":
            return `hsl(${(h % 60)},100%,50%)`;
        case "cool":
            return `hsl(${180 + (h % 60)},80%,60%)`;
        case "neon":
            return `hsl(${h},100%,50%)`;
        case "pastel":
            return `hsl(${h},50%,85%)`;
        case "grayscale":
            let val = Math.floor(h) % 255;
            return `rgb(${val},${val},${val})`;
        default:
            return `hsl(${h},100%,50%)`;
    }
}

function saveImage() {
    let link = document.createElement('a');
    link.download = 'attractool.png';
    link.href = canvas.toDataURL();
    link.click();
}

function hexToRGBA(hex, alpha) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
