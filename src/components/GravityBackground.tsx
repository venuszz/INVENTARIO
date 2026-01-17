"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface Point {
    x: number;
    y: number;
    originX: number;
    originY: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
}

export default function GravityBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isDarkMode } = useTheme();
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let points: Point[] = [];
        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Configuration - Minimalist & Simple
        const spacing = 50; // More space between dots
        const radius = 200; // Good interaction radius
        const force = 0.4; // Gentle repulsion
        const friction = 0.90; // Standard damping
        const ease = 0.08; // Smooth return

        const init = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            points = [];
            const cols = Math.ceil(width / spacing);
            const rows = Math.ceil(height / spacing);

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * spacing + (width - (cols - 1) * spacing) / 2;
                    const y = j * spacing + (height - (rows - 1) * spacing) / 2;

                    points.push({
                        x,
                        y,
                        originX: x,
                        originY: y,
                        vx: 0,
                        vy: 0,
                        size: 1.6, // Slightly larger for better visibility
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)' // More visible opacity
                    });
                }
            }
        };

        const update = () => {
            ctx.clearRect(0, 0, width, height);

            // Update mouse interaction
            for (const point of points) {
                const dx = mouseRef.current.x - point.x;
                const dy = mouseRef.current.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Repulsion
                if (distance < radius) {
                    const angle = Math.atan2(dy, dx);
                    // Smooth falloff
                    const f = Math.pow((radius - distance) / radius, 2);

                    const repX = Math.cos(angle) * f * force * -15;
                    const repY = Math.sin(angle) * f * force * -15;

                    point.vx += repX;
                    point.vy += repY;
                }

                // Spring back to origin
                const dxOrigin = point.originX - point.x;
                const dyOrigin = point.originY - point.y;

                point.vx += dxOrigin * ease;
                point.vy += dyOrigin * ease;

                // Friction
                point.vx *= friction;
                point.vy *= friction;

                // Update position
                point.x += point.vx;
                point.y += point.vy;

                // Draw
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                ctx.fillStyle = point.color;
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(update);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleResize = () => {
            init();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        init();
        update();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDarkMode]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none"
        />
    );
}
