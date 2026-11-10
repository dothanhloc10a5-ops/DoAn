import React, { useRef, useEffect } from 'react';

const GridCanvas = ({ qTable, agentPos, gridSize = { rows: 3, cols: 4 }, cellSize = 120, lastActionInfo }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let row = 0; row < gridSize.rows; row++) {
            for (let col = 0; col < gridSize.cols; col++) {
                const x = col * cellSize;
                const y = row * cellSize;
                const cellData = qTable[row][col]; 
                
                drawCell(ctx, x, y, cellSize, cellData.qValues, cellData.type);

                if (agentPos.row === row && agentPos.col === col) {
                    drawAgent(ctx, x, y, cellSize, lastActionInfo);
                }
            }
        }
    }, [qTable, agentPos, gridSize, cellSize, lastActionInfo]);

    return (
        <canvas 
            ref={canvasRef} 
            width={gridSize.cols * cellSize} 
            height={gridSize.rows * cellSize}
            style={{ border: '2px solid #333', background: '#f5f5f5' }}
        />
    );
};

// Hàm phụ trợ vẽ từng ô vuông
function drawCell(ctx, x, y, size, qValues, cellType) {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Vẽ tường
    if (cellType === 'wall') {
        ctx.fillStyle = '#555';
        ctx.fillRect(x, y, size, size);
        return;
    }
    
    // Vẽ đích hoặc bẫy
    if (cellType === 'goal' || cellType === 'trap') {
        ctx.fillStyle = cellType === 'goal' ? '#4caf50' : '#f44336';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(cellType === 'goal' ? '+1' : '-1', cx, cy);
        return;
    }

    // Vẽ 4 tam giác Q-value cho các trạng thái bình thường
    const drawTriangle = (p1, p2, p3, value) => {
        const color = value > 0 ? `rgba(76, 175, 80, ${Math.min(value, 1)})` : 
                      value < 0 ? `rgba(244, 67, 54, ${Math.min(Math.abs(value), 1)})` : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
    };

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    const topLeft = { x, y }, topRight = { x: x + size, y }, 
          bottomLeft = { x, y: y + size }, bottomRight = { x: x + size, y: y + size }, 
          center = { x: cx, y: cy };

    drawTriangle(topLeft, topRight, center, qValues.up);
    drawTriangle(topRight, bottomRight, center, qValues.right);
    drawTriangle(bottomRight, bottomLeft, center, qValues.down);
    drawTriangle(bottomLeft, topLeft, center, qValues.left);

    // In giá trị Q-value dạng số
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Courier New';
    const formatQ = (val) => val.toFixed(2);

    ctx.fillText(formatQ(qValues.up), cx, y + size / 4);
    ctx.fillText(formatQ(qValues.right), x + (size * 3) / 4, cy);
    ctx.fillText(formatQ(qValues.down), cx, y + (size * 3) / 4);
    ctx.fillText(formatQ(qValues.left), x + size / 4, cy);
}

function drawAgent(ctx, x, y, size, lastActionInfo) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    
    ctx.beginPath();
    ctx.arc(cx, cy, size / 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#2196F3';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    if (!lastActionInfo) return;

    const drawArrow = (direction, isDashed) => {
        ctx.beginPath();
        ctx.setLineDash(isDashed ? [4, 4] : []);
        ctx.strokeStyle = isDashed ? 'rgba(0,0,0,0.5)' : '#FF9800'; 
        ctx.lineWidth = 3;
        ctx.moveTo(cx, cy);
        
        let dx = 0, dy = 0;
        const len = size / 2.5;
        if (direction === 'up') dy = -len;
        else if (direction === 'down') dy = len;
        else if (direction === 'left') dx = -len;
        else if (direction === 'right') dx = len;
        
        ctx.lineTo(cx + dx, cy + dy);
        ctx.stroke();
        ctx.setLineDash([]);
    };

    if (lastActionInfo.action) drawArrow(lastActionInfo.action, true);
    if (lastActionInfo.actualAction) drawArrow(lastActionInfo.actualAction, false);

    if (lastActionInfo.slipped) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 16px Arial';
        ctx.fillText("Bị trượt!", cx, cy - size / 3);
    }
}

export default GridCanvas;