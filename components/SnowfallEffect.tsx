import React, { useEffect, useRef } from 'react';

interface SnowfallEffectProps {
    duration?: number; // milliseconds, default 10000
    onEnd?: () => void;
}

export const SnowfallEffect: React.FC<SnowfallEffectProps> = ({ duration = 10000, onEnd }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const flakeCount = 150;
        const flakes = Array.from({ length: flakeCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height, // Start above the viewport
            radius: Math.random() * 3 + 1,
            speed: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.6 + 0.3,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.01
        }));

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            flakes.forEach(flake => {
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
                ctx.fill();

                // Move downward
                flake.y += flake.speed;
                // Add slight horizontal wobble for natural drift
                flake.x += Math.sin(flake.wobble) * 0.5;
                flake.wobble += flake.wobbleSpeed;

                // Reset to top when off screen
                if (flake.y > canvas.height) {
                    flake.y = -flake.radius;
                    flake.x = Math.random() * canvas.width;
                }
            });
            animationId = requestAnimationFrame(animate);
        };
        animate();

        const timer = setTimeout(() => {
            cancelAnimationFrame(animationId);
            if (onEnd) onEnd();
        }, duration);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
            clearTimeout(timer);
        };
    }, [duration, onEnd]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
        />
    );
};
