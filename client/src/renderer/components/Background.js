import React, { useEffect, useRef, useState } from 'react';
import '../styles/Background.css';

const Background = ({ theme = 'morning' }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  // Theme colors configuration
  const themes = {
    morning: { start: '#FFB6C1', end: '#87CEEB' },   // 晨曦希望
    afternoon: { start: '#FFCC99', end: '#A7C7E7' }, // 午后邂逅
    night: { start: '#D6BCFA', end: '#4A5568' }      // 星夜低语
  };

  const currentTheme = themes[theme] || themes.morning;

  // Track mouse for interaction
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const particleCount = 40; // 极少量

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -20;
        this.size = Math.random() * 60 + 20; // Large halo size
        this.baseSize = this.size;
        this.speedY = Math.random() * 0.2 + 0.05; // Very slow falling
        this.speedX = Math.random() * 0.2 - 0.1;
        this.opacity = 0;
        this.targetOpacity = Math.random() * 0.15 + 0.02; // Very transparent
        this.fadeSpeed = 0.002;
        this.life = 0;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.life++;

        // Fade in/out
        if (this.life < 100) {
            if (this.opacity < this.targetOpacity) this.opacity += this.fadeSpeed;
        }
        
        // Mouse interaction: slight flow disturbance
        const mx = mouseRef.current.x * width;
        const my = mouseRef.current.y * height;
        const dx = this.x - mx;
        const dy = this.y - my;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const maxDist = 400;
        
        if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            this.x += dx * force * 0.005;
            this.y += dy * force * 0.005;
        }

        // Reset if out of bounds
        if (this.y > height + 50 || this.x < -50 || this.x > width + 50) {
            this.reset();
        }
      }

      draw() {
        // Halo effect: radial gradient for each particle
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="artistic-background" style={{
        '--bg-start': currentTheme.start,
        '--bg-end': currentTheme.end
    }}>
      <div className="gradient-layer" />
      <canvas ref={canvasRef} className="particles-layer" />
    </div>
  );
};

export default Background;
