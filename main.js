// --------------- 鼠标聚光灯交互 ---------------
const cursor = document.querySelector('.cursor-spotlight');

document.addEventListener('mousemove', (e) => {
    if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
});

const interactiveElements = document.querySelectorAll('a, .tag, .name-group, .project-card');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        if (cursor) {
            cursor.style.width = '600px';
            cursor.style.height = '600px';
            cursor.style.background = 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)';
        }
    });
    
    el.addEventListener('mouseleave', () => {
        if (cursor) {
            cursor.style.width = '400px';
            cursor.style.height = '400px';
            cursor.style.background = 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%)';
        }
    });
});

// 导航栏滚动模糊背景效果
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(5, 5, 5, 0.8)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.background = 'transparent';
        navbar.style.backdropFilter = 'none';
    }
});

// --- AUDIO VISUALIZER LOGIC (Symmetrical Smoke/Fluid) ---
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('visualizerCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });

    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const iconOn = document.querySelector('.music-icon-on');
    const iconOff = document.querySelector('.music-icon-off');

    let audioContext, analyser, dataArray;
    let isInitialized = false;

    function initAudio() {
        if (isInitialized) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; 
        
        const source = audioContext.createMediaElementSource(bgMusic);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isInitialized = true;
    }

    if (bgMusic && musicToggle) {
        musicToggle.addEventListener('click', () => {
            if (!isInitialized) {
                initAudio();
            }
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }

            if (bgMusic.paused) {
                bgMusic.play();
                iconOff.style.display = 'none';
                iconOn.style.display = 'block';
                drawVisualizer(); 
            } else {
                bgMusic.pause();
                iconOff.style.display = 'block';
                iconOn.style.display = 'none';
            }
        });
    }

    class Particle {
        constructor(x, y, vx, vy, life, color, size) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.life = life;
            this.maxLife = life;
            this.color = color;
            this.size = size;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            this.vx *= 0.98; // friction
            this.vy -= 0.05; // float upwards
        }
        draw(ctx, centerX) {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.fillStyle = this.color.replace('ALPHA', alpha);
            
            // Draw Right
            ctx.beginPath();
            ctx.arc(centerX + this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw Left (Symmetrical)
            ctx.beginPath();
            ctx.arc(centerX - this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    let particles = [];
    let time = 0;

    function drawVisualizer() {
        if(bgMusic.paused) return; 
        requestAnimationFrame(drawVisualizer);

        if(analyser) analyser.getByteFrequencyData(dataArray);

        // Fade background to create smoke trails
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(5, 5, 5, 0.12)';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'lighter';
        
        const centerX = width >= 1000 ? width * 0.75 : width * 0.5;
        const centerY = height * 0.6; // slightly below center

        time += 0.02;
        let bass = 0;
        let mid = 0;
        let high = 0;

        if (analyser) {
            for(let i=0; i<10; i++) bass += dataArray[i];
            for(let i=10; i<50; i++) mid += dataArray[i];
            for(let i=50; i<150; i++) high += dataArray[i];
            bass /= 10;
            mid /= 40;
            high /= 100;
        }

        // Spawn particles based on frequencies
        const spawnCount = Math.floor(bass / 30);
        for(let i=0; i<spawnCount; i++) {
            let px = Math.sin(time + Math.random()) * (50 + mid); // wandering base
            let py = centerY + Math.random() * 20 - 10;
            
            let vx = Math.cos(time*2 + Math.random()*2) * (2 + bass/100) + mid/50;
            let vy = -Math.random() * 3 - bass/50;
            
            // Purple to white gradient
            let r = Math.floor(180 + high);
            let g = Math.floor(150 + high);
            let b = 255;
            let color = "rgba($({r}), $({g}), $({b}), ALPHA)";
            
            let size = Math.random() * 3 + 1 + (bass/100);
            
            particles.push(new Particle(px, py, vx, vy, 100 + Math.random()*50, color, size));
        }

        // Update and draw particles
        for(let i=particles.length-1; i>=0; i--) {
            let p = particles[i];
            p.update();
            p.draw(ctx, centerX);
            if(p.life <= 0 || p.y < 0) {
                particles.splice(i, 1);
            }
        }
        
        // Draw some connecting wave lines for that "fluid" membrane look
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for(let i=0; i<30; i++) {
            let amp = analyser ? dataArray[i*2] : 0;
            let lx = i * 15 + Math.sin(time + i*0.1) * 20;
            let ly = centerY - amp * 2 - Math.cos(time + i*0.2) * 50;
            
            if(i===0) {
                ctx.moveTo(centerX + lx, ly);
            } else {
                ctx.lineTo(centerX + lx, ly);
            }
        }
        ctx.strokeStyle = '`rgba(180, 150, 255, 0.2)`';
        ctx.stroke();

        ctx.beginPath();
        for(let i=0; i<30; i++) {
            let amp = analyser ? dataArray[i*2] : 0;
            let lx = i * 15 + Math.sin(time + i*0.1) * 20;
            let ly = centerY - amp * 2 - Math.cos(time + i*0.2) * 50;
            
            if(i===0) {
                ctx.moveTo(centerX - lx, ly);
            } else {
                ctx.lineTo(centerX - lx, ly);
            }
        }
        ctx.stroke();
    }
});

// --- REINSTATED PRELOADER LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const loaderCanvas = document.getElementById('matrixCanvas');
    if(!loaderCanvas) return;
    const lctx = loaderCanvas.getContext('2d');
    
    let cw = window.innerWidth;
    let ch = window.innerHeight;
    loaderCanvas.width = cw;
    loaderCanvas.height = ch;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const fontSize = 14;
    let columns = cw / fontSize;
    let drops = [];
    for (let x = 0; x < columns; x++) { drops[x] = 1; }

    function drawMatrix() {
        lctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
        lctx.fillRect(0, 0, cw, ch);
        lctx.fillStyle = '#6a4c9c';
        lctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = letters.charAt(Math.floor(Math.random() * letters.length));
            lctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > ch && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    let matrixInterval = setInterval(drawMatrix, 50);

    window.addEventListener('resize', () => {
        if(!loaderCanvas) return;
        cw = window.innerWidth;
        ch = window.innerHeight;
        loaderCanvas.width = cw;
        loaderCanvas.height = ch;
        columns = cw / fontSize;
        drops = [];
        for (let x = 0; x < columns; x++) { drops[x] = 1; }
    });

    let progress = 0;
    const pEl = document.getElementById('percentage');
    const pBar = document.getElementById('progress-bar');
    const wrapper = document.getElementById('preloader-wrapper');

    function updateProgress() {
        let increment = Math.random() * 2 + 0.5;
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            pEl.innerText = Math.floor(progress);
            pBar.style.width = progress + '%';
            
            setTimeout(() => {
                wrapper.style.opacity = '0';
                setTimeout(() => {
                    clearInterval(matrixInterval);
                    wrapper.style.display = 'none';
                    window.dispatchEvent(new Event('resize')); 
                }, 1000);
            }, 800);
            return;
        }
        
        pEl.innerText = Math.floor(progress);
        pBar.style.width = progress + '%';
        let interval = Math.random() * 150 + 50;
        setTimeout(updateProgress, interval);
    }
    
    setTimeout(updateProgress, 500);
});

