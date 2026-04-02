"use client";

import { useEffect, useRef } from "react";

class Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  density: number;
  alpha: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.baseX = this.x;
    this.baseY = this.y;
    this.size = Math.random() * 1.5 + 0.5;
    this.alpha = Math.random() * 0.4 + 0.1;
    
    // Mix of brand teal, purple, and pure white stars
    const colorRoll = Math.random();
    if (colorRoll > 0.8) {
      this.color = `rgba(0, 245, 212, ${this.alpha})`; // #00F5D4
    } else if (colorRoll > 0.6) {
      this.color = `rgba(139, 92, 246, ${this.alpha * 0.8})`; // Purple
    } else {
      this.color = `rgba(255, 255, 255, ${this.alpha})`;
    }
    
    this.density = (Math.random() * 15) + 1;
  }

  update(mouse: { x: number; y: number; radius: number }) {
    // Distance from mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Wave/Repulsion effect
    if (distance < mouse.radius) {
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const force = (mouse.radius - distance) / mouse.radius;
      
      // Gentle wave pushing away from cursor
      const directionX = forceDirectionX * force * this.density;
      const directionY = forceDirectionY * force * this.density;
      
      this.x -= directionX;
      this.y -= directionY;
    } else {
      // Return to original base position slowly (elasticity)
      if (this.x !== this.baseX) {
        const dx = this.x - this.baseX;
        this.x -= dx / 25;
      }
      if (this.y !== this.baseY) {
        const dy = this.y - this.baseY;
        this.y -= dy / 25;
      }
    }

    // Drifting effect (universe expansion/drift upwards)
    this.baseY -= 0.15 * (this.size * 0.5); // Parallax effect based on size
    if (this.baseY < -10) {
      this.baseY = window.innerHeight + 10;
      this.baseX = Math.random() * window.innerWidth;
      this.y = this.baseY;
      this.x = this.baseX;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}

export default function DeepSpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let animationFrameId: number;

    const mouse = {
      x: -1000, // Offscreen initially
      y: -1000,
      radius: 180 // The size of the "space-time wave"
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseOut = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseout", handleMouseOut);
    }

    const init = () => {
      particlesArray = [];
      // Hyper-optimized density: max 120 particles to guarantee 60fps on potato devices
      const numberOfParticles = Math.min(Math.floor((canvas.width * canvas.height) / 10000), 120);
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(mouse);
        particlesArray[i].draw(ctx);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    handleResize();
    animate();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseout", handleMouseOut);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0D0F14]" style={{ willChange: "transform" }}>
      {/* Hyper-optimized Nebulas using native radial-gradient instead of heavy CSS blur() */}
      <div 
        className="absolute top-[20%] left-[15%] w-[600px] h-[600px] rounded-full opacity-40 animate-[spin_50s_linear_infinite]" 
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" }}
      />
      <div 
        className="absolute bottom-[20%] right-[10%] w-[700px] h-[700px] rounded-full opacity-30 animate-[spin_40s_linear_infinite_reverse]" 
        style={{ background: "radial-gradient(circle, rgba(0,245,212,0.1) 0%, transparent 60%)" }}
      />
      <div 
        className="absolute top-[60%] left-[40%] w-[400px] h-[400px] rounded-full opacity-20 animate-[spin_60s_linear_infinite]" 
        style={{ background: "radial-gradient(circle, rgba(0,245,212,0.08) 0%, transparent 60%)" }}
      />
      
      {/* Subtle Space-Time Grid Layer */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} 
      />

      {/* Reactive Particle Grid Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ willChange: "transform" }} />
    </div>
  );
}
