// Import necessary modules
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const RedLightGreenLight = ({ goBack }) => {
    const [gameState, setGameState] = useState(null);
    const [gameMessage, setGameMessage] = useState("");
    const [progress, setProgress] = useState(0);
    const [isGreenLight, setIsGreenLight] = useState(true);
    const [isHolding, setIsHolding] = useState(false);

    useEffect(() => {
        let interval;
        if (isHolding && isGreenLight) {
            interval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 1, 100));
            }, 100);
        } else if (!isGreenLight && isHolding) {
            // Simulate the player being caught
            setGameMessage("Caught! You moved during Red Light!");
            setProgress(0);
            setIsHolding(false);
        }
        return () => clearInterval(interval);
    }, [isHolding, isGreenLight]);

    useEffect(() => {
        // Randomly switch between Green and Red Light every 2-5 seconds
        const switchLight = setInterval(() => {
            setIsGreenLight((prev) => !prev);
        }, Math.random() * (5000 - 2000) + 2000);

        return () => clearInterval(switchLight);
    }, []);

    const startGame = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/red-light-green-light/start');
            setGameState(response.data.gameState);
            setGameMessage("Game started! Hold the button to move.");
            setProgress(0);
        } catch (error) {
            console.error(error);
            setGameMessage("Error starting the game.");
        }
    };

    const finishGame = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/red-light-green-light/update', {
                gameId: 0, // Assuming a single game for simplicity
                action: 'move',
            });
            setGameState(response.data.game);
            setGameMessage(response.data.message);
            if (progress === 100) {
                setGameMessage("You made it to the finish line!");
            }
        } catch (error) {
            console.error(error);
            setGameMessage("Error updating the game.");
        }
    };

    const handleMouseDown = () => {
        if (isGreenLight) {
            setIsHolding(true);
        }
    };

    const handleMouseUp = () => {
        setIsHolding(false);
        if (progress === 100) {
            finishGame();
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Red Light, Green Light</h1>

            {!gameState && (
                <div>
                    <button onClick={startGame}>Start Game</button>
                    <button onClick={goBack}>Back to Menu</button>
                </div>
            )}

            {gameState && (
                <div>
                    <h3>Light: {isGreenLight ? 'Green Light' : 'Red Light'}</h3>
                    <h3>Player Position: {progress}%</h3>
                    <div
                        style={{
                            width: '80%',
                            height: '30px',
                            backgroundColor: '#ddd',
                            margin: '20px auto',
                            borderRadius: '15px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: isGreenLight ? 'green' : 'red',
                                transition: 'width 0.1s',
                            }}
                        ></div>
                    </div>

                    <button
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        style={{ padding: '10px 20px', fontSize: '16px' }}
                    >
                        Hold to Move
                    </button>
                    <h3>{gameMessage}</h3>
                    <button onClick={goBack}>Back to Menu</button>
                </div>
            )}
        </div>
    );
};


const DalgonaChallenge = () => {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasLost, setHasLost] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedShape, setSelectedShape] = useState("circle");
    const totalPathLength = useRef(0);
    const lastPosition = useRef({ x: 0, y: 0 });  // To store the previous mouse position

    useEffect(() => {
        setupCanvas();
        drawShape(selectedShape);
    }, [selectedShape]);

    // Initialize canvas context
    const setupCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = 370;
        canvas.height = 370;
        ctx.lineWidth = 15;
        ctx.strokeStyle = "rgb(66, 10, 0)";
        ctx.lineJoin = "round"; // Smooth out corners
        ctx.lineCap = "round";  // Smooth out endpoints
        ctxRef.current = ctx;
    };

    const shapePath = useRef(null); // Store the original shape

    const outlinePixels = useRef(null); // Store pixels of the shape outline
    const totalOutlinePixels = useRef(0); // Count total pixels in the shape outline

    const drawShape = (shape) => {
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, 400, 400);

        const path = new Path2D();
        ctx.strokeStyle = "rgb(66, 10, 0)";
        ctx.lineWidth = 15;

        if (shape === "circle") {
            path.arc(200, 200, 100, 0, Math.PI * 2, true);
        } else if (shape === "triangle") {
            path.moveTo(200, 100);
            path.lineTo(300, 300);
            path.lineTo(100, 300);
            path.closePath();
        } else if (shape === "star") {
            drawStar(path, 200, 200, 5, 100, 50);
        } else if (shape === "umbrella") {
            drawUmbrella(path);
        }

        ctx.stroke(path); 
        shapePath.current = path; 

        // Store the shape outline as pixel data
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const pixels = imageData.data;
        let outlineCount = 0;

        // Count black pixels (the outline)
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0) {
                outlineCount++;
            }
        }

        outlinePixels.current = pixels;
        totalOutlinePixels.current = outlineCount;
    };

    
    const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.closePath();
    };

    const drawUmbrella = (path) => {
        /* Draw umbrella parasol */
        path.arc(185, 165, 120, 0, Math.PI, true); // Large parasol
        path.moveTo(119, 165);
        path.arc(93, 165, 26, 0, Math.PI, true); // Small left parasol
        path.moveTo(172, 165);
        path.arc(146, 165, 26, 0, Math.PI, true); // Small middle parasol
        path.moveTo(254, 165);
        path.arc(228, 165, 26, 0, Math.PI, true); // Small right parasol
        path.moveTo(305, 165);
        path.arc(279, 165, 26, 0, Math.PI, true); // Small far-right parasol
    
        /* Draw handle */
        path.moveTo(172, 165);
        path.lineTo(172, 285);
        path.moveTo(172, 285);
        path.arc(222, 285, 50, Math.PI, 2 * Math.PI, true); // Large bottom curve
        path.moveTo(240, 285);
        path.arc(256, 285, 16, Math.PI, 2 * Math.PI, false); // Small right curve
        path.moveTo(202, 285);
        path.arc(221, 285, 19, Math.PI, 2 * Math.PI, true);  // Small left curve
        path.moveTo(202, 285);
        path.lineTo(202, 165);
    };
    

    const handleMouseDown = (e) => {
        if (hasLost) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = ctxRef.current;
    
        // Check against the stored shape path
        if (ctx.isPointInStroke(shapePath.current, offsetX, offsetY)) {
            setIsDrawing(true);
            lastPosition.current = { x: offsetX, y: offsetY };
            ctx.beginPath(); // Start a new path for user tracing
            ctx.moveTo(offsetX, offsetY);
        } else {
            setHasLost(true);
            alert("Game Over: You started outside the outline!");
        }
    };
     
    const progressScales = {
        circle: 14,    // Default speed
        triangle: 14,  // Slightly faster progress
        star: 15,      // Slightly slower progress
        umbrella: 8   // Slowest, since it's the hardest shape
    };
    
    const handleMouseMove = (e) => {
        if (!isDrawing || hasLost) return;
    
        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = ctxRef.current;
        ctx.lineWidth = 12;
    
        if (ctx.isPointInStroke(shapePath.current, offsetX, offsetY)) {
            ctx.strokeStyle = 'rgb(247, 226, 135)'; 
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
    
            // Check how many pixels are filled
            const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            const pixels = imageData.data;
            let filledPixels = 0;
    
            for (let i = 0; i < pixels.length; i += 4) {
                const isTracingColor = 
                    Math.abs(pixels[i] - 247) < 30 && 
                    Math.abs(pixels[i + 1] - 226) < 30 && 
                    Math.abs(pixels[i + 2] - 135) < 30;

                if (isTracingColor) {
                    filledPixels++;
                }
            }
    
            // Get progress scale based on the selected shape
            const shapeScale = progressScales[selectedShape] || 1.0;
    
            // Apply shape-specific scaling
            const newProgress = ((filledPixels / totalOutlinePixels.current) * 100) * shapeScale;
    
            setProgress(Math.min(newProgress, 100));
            
            lastPosition.current = { x: offsetX, y: offsetY };
        } else {
            setHasLost(true);
            setIsDrawing(false);
            alert("Game Over: You went out of bounds!");
        }
    };
      
    // Handle mouse up event
    const handleMouseUp = () => {
        setIsDrawing(false);
        if (progress >= 85) {
            alert("Congratulations! You traced the outline perfectly!");
        }
    };

    // Reset the game
    const resetGame = () => {
        setHasLost(false);
        setProgress(0);
        drawShape(selectedShape);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ border: "1px solid black", cursor: "crosshair" }}
            />
            <div style={{ marginTop: "10px" }}>
                <button onClick={resetGame}>Reset</button>
                <p>Progress: {progress.toFixed(2)}%</p>
                {hasLost && <p style={{ color: "red" }}>You lost! Try again!</p>}
                <div>
                    <button onClick={() => setSelectedShape("circle")}>Circle</button>
                    <button onClick={() => setSelectedShape("triangle")}>Triangle</button>
                    <button onClick={() => setSelectedShape("star")}>Star</button>
                    <button onClick={() => setSelectedShape("umbrella")}>Umbrella</button>
                </div>
            </div>
        </div>
    );
};



const GameMenu = ({ selectGame }) => {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Squid Game</h1>
            <h3>Select a Game</h3>
            <button onClick={() => selectGame('redLightGreenLight')}>Red Light, Green Light</button>
            <button onClick={() => selectGame('dalgonachallenge')}>Dalgona Challenge </button>
            <button disabled>Tug of War (Coming Soon)</button>
        </div>
    );
};


const App = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const goBackToMenu = () => {
      setSelectedGame(null);
  };

  return (
      <div>
          {!selectedGame && <GameMenu selectGame={setSelectedGame} />}

          {selectedGame === 'redLightGreenLight' && (
              <RedLightGreenLight goBack={goBackToMenu} />
          )}
          {selectedGame === 'dalgonachallenge' && (
              <DalgonaChallenge goBack={goBackToMenu} />
          )}
      </div>
  );
};


export default App;
