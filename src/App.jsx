import { useState, useCallback, useRef, useEffect } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";

extend({ Container, Graphics });

function App() {
  const [lines, setLines] = useState([createLine()]);

  const updateLine = (id, newLine) => {
    setLines(lines.map(l => (l.id === id ? newLine : l)));
  };

  const addLine = () => {
    setLines([...lines, createLine()]);
  };

  return (
    <>
      <Application>
        <pixiContainer x={200} y={200}>
          {lines.map(line => (
            <Spline key={line.id} line={line} onChange={updated => updateLine(line.id, updated)} />
          ))}
        </pixiContainer>
      </Application>

      {/* UI */}
      <div>
        {lines.map(line => (
          <LineEditor
            key={line.id}
            line={line}
            onChange={updated => updateLine(line.id, updated)}
          />
        ))}

        <button onClick={addLine}>+</button>
      </div>
    </>
  );
}


function DraggablePoint({ x, y, onMove }) {
  const onMoveRef = useRef(onMove);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  const draw = useCallback(g => {
    g.clear();
    g.setFillStyle({ color: 0xff0000 });
    g.circle(0, 0, 6);
    g.fill();
  }, []);

  const onPointerDown = useCallback(e => {
    e.stopPropagation(); // Prevent event bubbling
    
    const graphics = e.currentTarget;
    const parent = graphics.parent;
    const stage = graphics.stage; // Direct access to stage
    
    // Ensure stage can receive events
    if (stage) {
      stage.eventMode = "static";
    }

    const handleMove = (moveEvent) => {
      // FIX: Use toLocal() instead of deprecated getLocalPosition()
      const localPos = parent.toLocal(moveEvent.global);
      onMoveRef.current(localPos.x, localPos.y);
    };

    const handleUp = () => {
      if (stage) {
        stage.off("pointermove", handleMove);
        stage.off("pointerup", handleUp);
        stage.off("pointerupoutside", handleUp);
      }
    };

    // Attach listeners to stage for smooth dragging even when cursor leaves the point
    if (stage) {
      stage.on("pointermove", handleMove);
      stage.on("pointerup", handleUp);
      stage.on("pointerupoutside", handleUp);
    }
  }, []); // Stable callback - no deps needed thanks to onMoveRef

  return (
    <pixiGraphics
      x={x}
      y={y}
      draw={draw}
      eventMode="static"
      cursor="pointer"
      pointerdown={onPointerDown}
    />
  );
}



function LineEditor({ line, onChange }) {
  const updateColor = e => {
    const hex = parseInt(e.target.value.replace("#", "0x"));
    onChange({ ...line, color: hex });
  };

  const updatePoint = (index, axis, value) => {
    const newPoints = [...line.points];
    newPoints[index] = {
      ...newPoints[index],
      [axis]: Number(value)
    };

    onChange({ ...line, points: newPoints });
  };

  const addPoint = () => {
    const last = line.points[line.points.length - 1];
    const newPoint = { x: last.x + 50, y: last.y };

    onChange({
      ...line,
      points: [...line.points, newPoint]
    });
  };

  return (
    <div style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
      <label>
        Color:
        <input type="color" onChange={updateColor} />
      </label>

      <div>
        {line.points.map((p, i) => (
          <div key={i}>
            P{i}:
            <input
              type="number"
              value={p.x}
              onChange={e => updatePoint(i, "x", e.target.value)}
            />
            <input
              type="number"
              value={p.y}
              onChange={e => updatePoint(i, "y", e.target.value)}
            />
          </div>
        ))}
      </div>

      <button onClick={addPoint}>Add point</button>
    </div>
  );
}

const createLine = () => ({
  id: crypto.randomUUID(),
  color: 0xffffff,
  points: [
    { x: 0, y: 0 },
    { x: 50, y: -100 },
    { x: 100, y: 0 }
  ]
});

function Spline({ line, onChange }) {
  const draw = useCallback(graphics => {
    const { points, color } = line;

    graphics.clear();

    graphics.setStrokeStyle({ width: 3, color });
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
  }, [line]);

  const movePoint = (index, x, y) => {
    const newPoints = [...line.points];
    newPoints[index] = { x, y };

    onChange({ ...line, points: newPoints });
  };

  return (
    <pixiContainer>
      {/* curve */}
      <pixiGraphics draw={draw} />

      {/* draggable points */}
      {line.points.map((p, i) => (
        <DraggablePoint
          key={i}
          x={p.x}
          y={p.y}
          onMove={(x, y) => movePoint(i, x, y)}
        />
      ))}
    </pixiContainer>
  );
}

export default App;
