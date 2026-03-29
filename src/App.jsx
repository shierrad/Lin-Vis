import { useState, useCallback } from 'react'
import './App.css'
import {Application, extend} from '@pixi/react'
import {Container, Graphics} from "pixi.js"

extend({Container, Graphics});


function App() {

  const points = [
    { x: 0, y: 0 },
    { x: 50, y: -100 },
    { x: 100, y: 0 },
    { x: 150, y: 100 },
    { x: 200, y: 0 }
  ];

  const drawCallback = useCallback(graphics => {
  graphics.clear();

  // ---- DRAW SPLINE ----
  graphics.setStrokeStyle({ width: 3, color: 0xffffff });
  graphics.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  graphics.stroke();

  // ---- DRAW POINTS ----
  graphics.setFillStyle({ color: 0xff0000 });

  points.forEach(p => {
    graphics.circle(p.x, p.y, 5); // radius = 5
    graphics.fill();
  });

}, []);
  
    return (
    <Application>
     <pixiContainer x={100} y={100}>
        <pixiGraphics draw={drawCallback} />
    </pixiContainer>
    </Application>
)
}


export default App
