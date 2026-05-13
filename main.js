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

// --- AUDIO VISUALIZER LOGIC (Replaces Particles) ---
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
        analyser.fftSize = 256; 
        
        // Connect taking care of potential CORS issues locally
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
                drawVisualizer(); // start loop
            } else {
                bgMusic.pause();
                iconOff.style.display = 'block';
                iconOn.style.display = 'none';
            }
        });
    }

    function drawVisualizer() {
        if(bgMusic.paused) return; // Stop drawing if paused
        requestAnimationFrame(drawVisualizer);

        if(analyser) analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);

        // Center on the right side of the screen
        const centerX = width >= 1000 ? width * 0.8 : width * 0.5;
        const centerY = height * 0.5;
        const baseRadius = width < 800 ? 100 : 180;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const bars = analyser ? analyser.frequencyBinCount : 128;
        const angleStep = (Math.PI * 2) / bars;

        for (let i = 0; i < bars; i++) {
            const amplitude = analyser ? dataArray[i] : 0;
            const barHeight = (amplitude / 255) * 200; 
            
            const angle = i * angleStep;

            const x0 = Math.cos(angle) * baseRadius;
            const y0 = Math.sin(angle) * baseRadius;
            
            const x1 = Math.cos(angle) * (baseRadius + barHeight + 5);
            const y1 = Math.sin(angle) * (baseRadius + barHeight + 5);

            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            
            if(i % 2 === 0) {
                ctx.strokeStyle = `rgba(180, 150, 255, ${0.4 + (amplitude/255)*0.6})`;
                ctx.shadowColor = 'rgba(180, 150, 255, 0.8)';
            } else {
                ctx.strokeStyle = `rgba(138, 43, 226, ${0.4 + (amplitude/255)*0.6})`;
                ctx.shadowColor = 'rgba(138, 43, 226, 0.8)';
            }
            
            ctx.lineWidth = 4;
            ctx.shadowBlur = 10;
            ctx.stroke();
            
            if (amplitude > 200 && Math.random() > 0.8) {
                ctx.beginPath();
                ctx.arc(x1 + Math.cos(angle)*15, y1 + Math.sin(angle)*15, Math.random()*3, 0, Math.PI*2);
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'white';
                ctx.fill();
            }
        }

        let avgAmplitude = 0;
        if(analyser) {
            for(let i=0; i<bars; i++) avgAmplitude += dataArray[i];
            avgAmplitude /= bars;
        }

        ctx.beginPath();
        ctx.arc(0, 0, baseRadius - 10 + (avgAmplitude / 255) * 30, 0, Math.PI*2);
        ctx.fillStyle = `rgba(20, 10, 30, ${0.8 + (avgAmplitude/255)*0.2})`;
        ctx.strokeStyle = `rgba(180, 150, 255, ${0.5 + (avgAmplitude/255)*0.5})`;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20 + (avgAmplitude / 255) * 50;
        ctx.shadowColor = '#6a4c9c';
        ctx.fill();
        ctx.stroke();

        ctx.restore();
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

