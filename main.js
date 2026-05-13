const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// --------------- 恢复鼠标聚光灯交互 ---------------
const cursor = document.querySelector('.cursor-spotlight');

document.addEventListener('mousemove', (e) => {
    // 鼠标移动光标跟随
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
let mouse = { x: -1000, y: -1000, radius: 150 };

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

class Particle {
    constructor() {
        // 利用极坐标随机生成一个球状分布
        let angle = Math.random() * Math.PI * 2;
        // 降低中心聚集度，分散粒子
        let r = Math.random() * 320; 
        
        this.baseOffsetX = Math.cos(angle) * r;
        this.baseOffsetY = Math.sin(angle) * r;
        
        // 球体更靠右侧
        this.sphereCenterX = width * 0.85;
        this.sphereCenterY = height * 0.5;
        
        this.x = this.sphereCenterX + this.baseOffsetX;
        this.y = this.sphereCenterY + this.baseOffsetY;
        
        // 恢复颗粒感，缩小粒子尺寸并提升单体亮度
        this.size = Math.random() * 2.5 + 0.5; 
        
        // 主要是紫色体系的色值随机
        const rColor = 120 + Math.random() * 50; 
        const gColor = 50 + Math.random() * 80;  
        const bColor = 220 + Math.random() * 35; 
        const alpha = 0.5 + Math.random() * 0.5; // 高透明度保证颗粒不至于由于模糊消失
        
        this.color = `rgba(${rColor}, ${gColor}, ${bColor}, ${alpha})`;
        
        // 用于弹开效果的物理速度
        this.vx = 0;
        this.vy = 0;
        
        // 用于每个粒子呼吸的错位时间差
        this.randomOffset = Math.random() * 100;
    }

    update(time) {
        // 更新视口大小时的中心点，保持靠右
        this.sphereCenterX = width >= 1000 ? width * 0.85 : width * 0.9;
        this.sphereCenterY = height * 0.5;

        // 【呼吸效果】球体缩放振幅 (scale) 
        let scale = 1 + 0.1 * Math.sin(time * 0.0015 + this.randomOffset);
        
        // 粒子的目标位置(自然呼吸时的位置)
        let targetX = this.sphereCenterX + this.baseOffsetX * scale;
        let targetY = this.sphereCenterY + this.baseOffsetY * scale;

        // 【鼠标碰撞散开效果】
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
            // 当鼠标靠近时，计算把粒子向外推的斥力
            let force = (mouse.radius - dist) / mouse.radius;
            let angle = Math.atan2(dy, dx);
            let pushForce = force * 15; // 散开力度
            this.vx += Math.cos(angle) * pushForce;
            this.vy += Math.sin(angle) * pushForce;
        }

        // 引力(弹簧力)：拉回原本该在的位置
        let txDistX = targetX - this.x;
        let txDistY = targetY - this.y;
        this.vx += txDistX * 0.06; // 拉回速度
        this.vy += txDistY * 0.06;

        // 摩擦力：慢慢停止
        this.vx *= 0.82;
        this.vy *= 0.82;

        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = this.color;
        
        // 我们给粒子加一点点原生的发光质感
        if (this.size > 1.5) {
            ctx.shadowBlur = 4;
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
    let numParticles = 2500; // 恢复大量粒子，创造繁星点点的球状
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function animate(time) {
    ctx.clearRect(0, 0, width, height); // 纯清空，不再有连线
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

