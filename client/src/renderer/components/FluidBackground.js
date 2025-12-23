import React, { useEffect, useRef } from 'react';

const FluidBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    let blobs = [];

    // 颜色配置：粉、紫、白
    const colors = [
      { r: 255, g: 182, b: 193 }, // Pink
      { r: 221, g: 160, b: 221 }, // Plum (Purple)
      { r: 255, g: 255, b: 255 }, // White
      { r: 255, g: 192, b: 203 }, // Pink
      { r: 230, g: 230, b: 250 }  // Lavender
    ];

    class Blob {
      constructor() {
        this.init();
      }

      init() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5; // 缓慢流动
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.min(width, height) * (0.3 + Math.random() * 0.3); // 大光斑
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 0.3 + Math.random() * 0.3;
        this.angle = Math.random() * Math.PI * 2;
      }

      update(mouseX, mouseY) {
        // 自然流动
        this.x += this.vx;
        this.y += this.vy;

        // 边界反弹
        if (this.x < -this.radius) this.vx = Math.abs(this.vx);
        if (this.x > width + this.radius) this.vx = -Math.abs(this.vx);
        if (this.y < -this.radius) this.vy = Math.abs(this.vy);
        if (this.y > height + this.radius) this.vy = -Math.abs(this.vy);

        // 鼠标排斥
        if (mouseX !== null && mouseY !== null) {
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 400;

          if (distance < maxDist) {
            const force = (maxDist - distance) / maxDist;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * force * 2;
            this.y += Math.sin(angle) * force * 2;
          }
        }
      }

      draw(ctx) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        
        const { r, g, b } = this.color;
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha})`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initBlobs = () => {
      blobs = [];
      for (let i = 0; i < 6; i++) {
        blobs.push(new Blob());
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initBlobs();
    };

    let mouseX = null;
    let mouseY = null;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // 混合模式，产生梦幻叠加效果
      ctx.globalCompositeOperation = 'screen';

      blobs.forEach(blob => {
        blob.update(mouseX, mouseY);
        blob.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    handleResize();
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // 底色
        filter: 'blur(60px)', // 极致的高斯模糊
      }}
    />
  );
};

export default FluidBackground;
