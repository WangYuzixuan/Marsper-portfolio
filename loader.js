const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
const fontSize = 14;
const columns = canvas.width / fontSize;

const drops = [];
for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

function drawMatrix() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#6a4c9c'; // Purple Matrix effect
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);

// Resize handler
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Loading Logic
let progress = 0;
const percentageElement = document.getElementById('percentage');
const progressBar = document.getElementById('progress-bar');
const loadingContainer = document.querySelector('.loading-container');

function updateProgress() {
    let increment = Math.random() * 2 + 0.5;
    progress += increment;

    if (progress >= 100) {
        progress = 100;
        percentageElement.innerText = Math.floor(progress);
        progressBar.style.width = progress + '%';
        
        // Redirect completely to main page when done tracking
        setTimeout(() => {
            document.body.style.transition = 'opacity 1s ease';
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
        }, 800);
        
        return;
    }

    percentageElement.innerText = Math.floor(progress);
    progressBar.style.width = progress + '%';

    let interval = Math.random() * 150 + 50;
    setTimeout(updateProgress, interval);
}

setTimeout(updateProgress, 500);
