window.addEventListener('load', () => {
    const canvas = document.getElementById('attractorCanvas');
    const ctx = canvas.getContext('2d');
    resizeCanvas();

    // Attractors definitions
    const attractors = {
        'clifford': {
            formula: `
            \\[
            x_{n+1} = \\sin(a y_n) + c \\cos(a x_n), \\
            y_{n+1} = \\sin(b x_n) + d \\cos(b y_n)
            \\]`,
            params: {
                a: {min:-2.5, max:2.5, step:0.01, value:-1.4},
                b: {min:-2.5, max:2.5, step:0.01, value:1.6},
                c: {min:-2.5, max:2.5, step:0.01, value:1.0},
                d: {min:-2.5, max:2.5, step:0.01, value:0.7}
            },
            iterate: (x, y, p) => {
                const xNew = Math.sin(p.a*y) + p.c*Math.cos(p.a*x);
                const yNew = Math.sin(p.b*x) + p.d*Math.cos(p.b*y);
                return [xNew, yNew];
            },
            reset: () => [0.1,0.0],
            dimension: 2,
            defaultScale: 1.0
        },
        'peterdejong': {
            formula: `
            \\[
            x_{n+1} = \\sin(a y_n) - \\cos(b x_n), \\
            y_{n+1} = \\sin(c x_n) - \\cos(d y_n)
            \\]`,
            params: {
                a: {min:-3, max:3, step:0.01, value:1.4},
                b: {min:-3, max:3, step:0.01, value:-2.3},
                c: {min:-3, max:3, step:0.01, value:2.4},
                d: {min:-3, max:3, step:0.01, value:-2.1}
            },
            iterate: (x, y, p) => {
                const xNew = Math.sin(p.a*y) - Math.cos(p.b*x);
                const yNew = Math.sin(p.c*x) - Math.cos(p.d*y);
                return [xNew, yNew];
            },
            reset: () => [0.0,0.0],
            dimension: 2,
            defaultScale: 1.0
        },
        'lorenz': {
            formula: `
            \\[
            \\frac{dx}{dt} = \\sigma (y - x), \\
            \\frac{dy}{dt} = x(\\rho - z) - y, \\
            \\frac{dz}{dt} = xy - \\beta z
            \\]`,
            params: {
                sigma: {min:0, max:20, step:0.01, value:10},
                rho: {min:0, max:50, step:0.1, value:28},
                beta: {min:0, max:10, step:0.01, value:2.6667}
            },
            dt: 0.01,
            iterate: (x, y, z, p, dt) => {
                const dx = p.sigma*(y - x);
                const dy = x*(p.rho - z)-y;
                const dz = x*y - p.beta*z;
                return [x+dx*dt, y+dy*dt, z+dz*dt];
            },
            reset: () => [0.1,0.0,0.0],
            dimension: 3,
            defaultScale: 1.0
        },
        'rossler': {
            formula: `
            \\[
            \\frac{dx}{dt} = -y - z, \\
            \\frac{dy}{dt} = x + a y, \\
            \\frac{dz}{dt} = b + z(x - c)
            \\]`,
            params: {
                a: {min:-1, max:1, step:0.001, value:0.2},
                b: {min:0, max:1, step:0.001, value:0.2},
                c: {min:1, max:30, step:0.1, value:5.7}
            },
            dt: 0.01,
            iterate: (x, y, z, p, dt) => {
                const dx = -y - z;
                const dy = x + p.a*y;
                const dz = p.b + z*(x - p.c);
                return [x+dx*dt, y+dy*dt, z+dz*dt];
            },
            reset: () => [0.1,0.0,0.0],
            dimension: 3,
            defaultScale: 1.0
        }
    };

    // UI elements
    const attractorSelect = document.getElementById('attractorSelect');
    const paramSlidersDiv = document.getElementById('paramSliders');
    const equationBlock = document.getElementById('equationBlock');
    const particleColorInput = document.getElementById('particleColor');
    const bgColorInput = document.getElementById('bgColor');
    const colorModeSelect = document.getElementById('colorMode');
    const intensitySlider = document.getElementById('intensitySlider');
    const intensityVal = document.getElementById('intensityVal');
    const scaleSlider = document.getElementById('scaleSlider');
    const scaleVal = document.getElementById('scaleVal');
    const resetScaleBtn = document.getElementById('resetScaleBtn');

    let currentAttractor = 'clifford';
    let params = {};
    let state;
    let particleColor = particleColorInput.value;
    let bgColor = bgColorInput.value;
    let intensity = parseInt(intensitySlider.value);
    let scale = parseFloat(scaleSlider.value);
    let hue = 0;
    let frameCount = 0;
    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
    });

    document.addEventListener('keydown', (e) => {
        const step = 0.1;
        // Arrow keys tweak parameters
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
            const keys = Object.keys(params);
            if (keys.length > 0) {
                if (e.key==='ArrowUp') params[keys[0]] += step;
                if (e.key==='ArrowDown') params[keys[0]] -= step;
                if (keys.length>1) {
                    if (e.key==='ArrowRight') params[keys[1]] += step;
                    if (e.key==='ArrowLeft') params[keys[1]] -= step;
                }
            }
            updateSlidersUI();
            updateEquation();
        }

        // Space: randomize parameters
        if (e.key === ' ') randomizeParams();

        // Enter: reset position
        if (e.key === 'Enter') {
            resetAttractor();
            clearCanvas();
        }
    });

    particleColorInput.addEventListener('input', () => {
        particleColor = particleColorInput.value;
    });

    bgColorInput.addEventListener('input', () => {
        bgColor = bgColorInput.value;
        clearCanvas();
    });

    intensitySlider.addEventListener('input', () => {
        intensity = parseInt(intensitySlider.value);
        intensityVal.textContent = intensity;
    });
    intensityVal.textContent = intensity;

    scaleSlider.addEventListener('input', () => {
        scale = parseFloat(scaleSlider.value);
        scaleVal.textContent = scale.toFixed(1);
    });
    scaleVal.textContent = scale.toFixed(1);

    resetScaleBtn.addEventListener('click', () => {
        scale = attractors[currentAttractor].defaultScale;
        scaleSlider.value = scale;
        scaleVal.textContent = scale.toFixed(1);
    });

    attractorSelect.addEventListener('change', () => {
        currentAttractor = attractorSelect.value;
        setupAttractor();
    });

    function setupAttractor() {
        const att = attractors[currentAttractor];
        params = {};
        for (let p in att.params) {
            params[p] = att.params[p].value;
        }
        buildSliders();
        resetAttractor();
        clearCanvas();
        updateEquation();
        scale = att.defaultScale;
        scaleSlider.value = scale;
        scaleVal.textContent = scale.toFixed(1);
    }

    function buildSliders() {
        paramSlidersDiv.innerHTML = '';
        const att = attractors[currentAttractor];
        for (let p in att.params) {
            const group = document.createElement('div');
            group.className = 'param-group';

            const label = document.createElement('label');
            label.innerText = p;
            group.appendChild(label);

            const range = document.createElement('input');
            range.type = 'range';
            range.min = att.params[p].min;
            range.max = att.params[p].max;
            range.step = att.params[p].step;
            range.value = params[p];
            range.addEventListener('input', (e) => {
                params[p] = parseFloat(e.target.value);
                valSpan.innerText = params[p].toFixed(4);
                updateEquation();
            });
            group.appendChild(range);

            const valSpan = document.createElement('span');
            valSpan.className = 'param-value';
            valSpan.innerText = params[p].toFixed(4);
            group.appendChild(valSpan);

            paramSlidersDiv.appendChild(group);
        }
    }

    function updateSlidersUI() {
        const att = attractors[currentAttractor];
        const groups = paramSlidersDiv.querySelectorAll('.param-group');
        let i = 0;
        for (let p in att.params) {
            const range = groups[i].querySelector('input[type="range"]');
            const valSpan = groups[i].querySelector('.param-value');
            range.value = params[p];
            valSpan.innerText = params[p].toFixed(4);
            i++;
        }
    }

    function updateEquation() {
        equationBlock.innerHTML = attractors[currentAttractor].formula;
        MathJax.typesetPromise();
    }

    function resetAttractor() {
        state = attractors[currentAttractor].reset();
    }

    function randomizeParams() {
        const att = attractors[currentAttractor];
        for (let p in att.params) {
            const r = att.params[p];
            params[p] = r.min + Math.random()*(r.max - r.min);
        }
        updateSlidersUI();
        updateEquation();
    }

    function clearCanvas() {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth - 300;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        clearCanvas();
    });

    // Start app
    clearCanvas();
    setupAttractor();

    function draw() {
        const att = attractors[currentAttractor];

        // Mouse perturbation
        const mxp = (mouseX - 0.5)*0.01;
        const myp = (mouseY - 0.5)*0.01;
        let pCopy = {...params};
        const keys = Object.keys(pCopy);
        if (keys.length > 0) {
            pCopy[keys[0]] += mxp;
            if (keys.length > 1) pCopy[keys[1]] += myp;
        }

        // Rainbow mode
        if (colorModeSelect.value === 'rainbow') {
            hue = (hue + 1) % 360;
        }

        // Draw points
        if (att.dimension === 2) {
            for (let i=0; i<intensity; i++) {
                state = att.iterate(state[0], state[1], pCopy);
                plotPoint2D(state[0], state[1]);
            }
        } else {
            for (let i=0; i<Math.min(intensity,500); i++) {
                state = att.iterate(state[0], state[1], state[2], pCopy, att.dt);
                plotPoint3D(state[0], state[1], state[2]);
            }
        }

        // Fade occasionally
        frameCount++;
        if (frameCount % 50 === 0) fadeCanvas();

        requestAnimationFrame(draw);
    }

    function plotPoint2D(x, y) {
        const localScale = Math.min(canvas.width, canvas.height)/4 * scale;
        const px = canvas.width/2 + x*localScale;
        const py = canvas.height/2 + y*localScale;
        setParticleColor();
        ctx.fillRect(px, py, 2, 2);
    }

    function plotPoint3D(x, y, z) {
        const localScale = Math.min(canvas.width, canvas.height)/30 * scale;
        const px = canvas.width/2 + x*localScale;
        const py = canvas.height/2 + y*localScale;
        setParticleColor();
        ctx.fillRect(px, py, 2, 2);
    }

    function setParticleColor() {
        if (colorModeSelect.value === 'rainbow') {
            ctx.fillStyle = `hsl(${hue},100%,70%)`;
        } else {
            ctx.fillStyle = particleColor;
        }
    }

    function fadeCanvas() {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.globalAlpha = 1.0;
    }

    draw();
});
