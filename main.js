const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

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

let width, height;
let particles = [];
let mouse = { x: -1000, y: -1000, radius: 120 }; // 把排斥半径稍微改小一点
let isHoveringHint = false;

// 获取触发框
const particleTrigger = document.getElementById('particleTrigger');
if (particleTrigger) {
    particleTrigger.addEventListener('mouseenter', () => {
        isHoveringHint = true;
    });
    particleTrigger.addEventListener('mouseleave', () => {
        isHoveringHint = false;
    });
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initParticles();
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseout', () => {
    mouse.x = -1000;
    mouse.y = -1000;
});

// 解析文本像素的函数
function getTextCoordinates() {
    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCanvas.width = width;
    offCanvas.height = height;
    
    // 基础排版
    let fontSize = Math.min(width * 0.08, 150); // 根据屏幕响应式调整字体
    offCtx.font = "900 " + fontSize + "px Montserrat, sans-serif"
    offCtx.fillStyle = 'white';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    
    // 渲染在右侧
    let txtX = width >= 1000 ? width * 0.85 : width * 0.8;
    let txtY = height * 0.5;
    
    // 为了让字母立起来更有感觉，我们可以加一点旋转，或者直接横放
    offCtx.translate(txtX, txtY);
    offCtx.rotate(Math.PI / 2); // 变成垂直文字排在右边，非常极客
    offCtx.fillText('MARSPER', 0, 0);
    offCtx.setTransform(1, 0, 0, 1, 0, 0); // reset
    
    let pixels = offCtx.getImageData(0, 0, width, height).data;
    let coords = [];
    
    // 步长越大，点越稀疏
    for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
            let alpha = pixels[(y * width + x) * 4 + 3];
            if (alpha > 128) {
                coords.push({ x: x, y: y });
            }
        }
    }
    return coords;
}

class Particle {
    constructor(textCoord) {
        // --- 球体基础形态 ---
        let angle = Math.random() * Math.PI * 2;
        let r = Math.random() * 250; 
        
        this.baseOffsetX = Math.cos(angle) * r;
        this.baseOffsetY = Math.sin(angle) * r;
        
        // 分配文字目标坐标
        this.textTargetX = textCoord.x;
        this.textTargetY = textCoord.y;
        
        // 初始生成在球体
        this.sphereCenterX = width * 0.85;
        this.sphereCenterY = height * 0.5;
        
        this.x = this.sphereCenterX + this.baseOffsetX;
        this.y = this.sphereCenterY + this.baseOffsetY;
        
        this.size = Math.random() * 2 + 1; 
        
        // 赛博紫光配色
        const rColor = 120 + Math.random() * 60; 
        const gColor = 50 + Math.random() * 80;  
        const bColor = 220 + Math.random() * 35; 
        const alpha = 0.6 + Math.random() * 0.4; 
        
        this.color = 'rgba(' + rColor + ',' + gColor + ',' + bColor + ',' + alpha + ')';
        
        this.vx = 0;
        this.vy = 0;
        this.randomOffset = Math.random() * 100;
        // 文字呼吸效果的偏移系数
        this.textFloatSpeed = 0.02 + Math.random() * 0.03;
        this.textFloatAmp = Math.random() * 15;
    }

    update(time) {
        // 更新视口改变时的中心点
        this.sphereCenterX = width >= 1000 ? width * 0.85 : width * 0.9;
        this.sphereCenterY = height * 0.5;

        // 【呼吸效果】球体缩放振幅 (scale)
        let scale = 1 + 0.1 * Math.sin(time * 0.0015 + this.randomOffset);
        
        let targetX, targetY;
        
        if (isHoveringHint) {
            // 当鼠标悬停时，目标变成文字坐标，带有轻微的流动呼吸感
            let floatY = Math.sin(time * this.textFloatSpeed + this.randomOffset) * this.textFloatAmp;
            let floatX = Math.cos(time * this.textFloatSpeed + this.randomOffset) * (this.textFloatAmp / 2);
            targetX = this.textTargetX + floatX;
            targetY = this.textTargetY + floatY;
        } else {
            // 否则，目标就是呼吸中的球体
            targetX = this.sphereCenterX + this.baseOffsetX * scale;
            targetY = this.sphereCenterY + this.baseOffsetY * scale;
        }

        // 【鼠标碰撞散开效果】
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
            let force = (mouse.radius - dist) / mouse.radius;
            let angle = Math.atan2(dy, dx);
            let pushForce = force * 6; // 被鼠标推开的力度
            this.vx += Math.cos(angle) * pushForce;
            this.vy += Math.sin(angle) * pushForce;
        }

        // 引力（弹簧力）：拉回目标位置。可以调整摩擦力和引力实现丝滑变形
        let txDistX = targetX - this.x;
        let txDistY = targetY - this.y;
        this.vx += txDistX * 0.08; 
        this.vy += txDistY * 0.08;

        // 摩擦力：慢慢停止
        this.vx *= 0.80;
        this.vy *= 0.80;

        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = this.color;
        
        if (this.size > 1.2 && isHoveringHint) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
        } else if (this.size > 1.8) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    
    // 提取文字坐标，生成映射
    let textCoords = getTextCoordinates();
    
    // 如果没有采到坐标（防报错），给一个随机数组
    if (textCoords.length === 0) {
        textCoords = [{x: width*0.85, y: height*0.5}];
    }

    // 根据像素点的数量生成粒子，尽量复用或者打乱以获得更好效果
    // 我们限制一下最大粒子数，并在数组里随机抽样分配
    let maxParticles = 3000;
    let actualCount = Math.min(textCoords.length, maxParticles);
    
    // 打乱坐标数组，让粒子随机飞向各个位置
    textCoords.sort(() => Math.random() - 0.5);

    for (let i = 0; i < actualCount; i++) {
        // 如果想保留大量粒子，但文字坐标不够，可以用取模循环分配
        let coord = textCoords[i % textCoords.length];
        particles.push(new Particle(coord));
    }
}

function animate(time) {
    ctx.clearRect(0, 0, width, height); 
    for (let p of particles) {
        p.update(time);
        p.draw();
    }
    requestAnimationFrame(animate);
}

resize();
requestAnimationFrame(animate);

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

// --- REINSTATED PRELOADER LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const loaderCanvas = document.getElementById('matrixCanvas');
    if(!loaderCanvas) return;
    const lctx = loaderCanvas.getContext('2d');
    
    // Independent width/height setup
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
                    // Re-trigger global resize to ensure background particle canvas resets properly
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

// --- MUSIC PLAYER LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const iconOn = document.querySelector('.music-icon-on');
    const iconOff = document.querySelector('.music-icon-off');

    if (bgMusic && musicToggle) {
        musicToggle.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play();
                iconOff.style.display = 'none';
                iconOn.style.display = 'block';
            } else {
                bgMusic.pause();
                iconOff.style.display = 'block';
                iconOn.style.display = 'none';
            }
        });
    }
});
