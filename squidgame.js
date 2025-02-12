// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const serverless = require("serverless-http");

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get("/", (req, res) => {
    res.json({ message: "Squid Game API is running!" });
});

// Export the app for AWS Lambda
module.exports.handler = serverless(app);

// Game Routes
const games = {
    redLightGreenLight: [],
    dalgonaChallenge: [],
    tugOfWar: [],
    marbles: [],
    glassBridge: [],
    squidGame: []
};

// 1. Red Light, Green Light
app.post('/api/red-light-green-light/start', (req, res) => {
    // Initialize game state
    const gameState = {
        playerPosition: 0,
        gameStatus: 'running', // 'running', 'stopped', 'finished'
        timeLeft: 30, // in seconds
    };
    games.redLightGreenLight.push(gameState);
    res.status(200).json({ message: 'Game started', gameState });
});

app.post('/api/red-light-green-light/update', (req, res) => {
    const { gameId, action } = req.body; // action: 'move', 'stop'
    const game = games.redLightGreenLight[gameId];

    if (!game) return res.status(404).json({ message: 'Game not found' });

    if (game.gameStatus !== 'running') {
        return res.status(400).json({ message: 'Game is not running' });
    }

    if (action === 'move') {
        game.playerPosition += 1; // Simulate player moving
        // Random chance of being caught
        if (Math.random() < 0.3) {
            game.gameStatus = 'stopped';
            return res.status(200).json({ message: 'Caught!', game });
        }
    } else if (action === 'stop') {
        // Check if player stopped in time
        if (Math.random() < 0.1) {
            game.gameStatus = 'stopped';
            return res.status(200).json({ message: 'Failed to stop in time!', game });
        }
    }

    if (game.playerPosition >= 10) {
        game.gameStatus = 'finished';
        return res.status(200).json({ message: 'You won!', game });
    }

    res.status(200).json({ game });
});

// 2. Dalgona Candy Challenge
// Dalgona Candy Challenge API
app.post('/api/dalgona/start', (req, res) => {
    // Initialize game state
    const gameState = {
        shape: ['circle', 'triangle', 'umbrella'][Math.floor(Math.random() * 3)], // Random shape
        progress: 0, // Player's progress
        gameStatus: 'running', // 'running', 'failed', 'finished'
    };
    games.dalgonaChallenge.push(gameState);
    const gameId = games.dalgonaChallenge.length - 1;
    res.status(200).json({ message: 'Game started', gameState, gameId }); // Ensure gameId is included
});

app.post('/api/dalgona/update', (req, res) => {
    const { gameId, userPath } = req.body;
    const game = games.dalgonaChallenge[gameId];

    if (!game) return res.status(404).json({ message: 'Game not found' });

    if (game.gameStatus !== 'running') {
        return res.status(400).json({ message: 'Game is not running' });
    }

    // Simulate shape path for testing (replace with actual shape logic)
    const targetShape = [
        { x: 250, y: 150 },
        { x: 350, y: 350 },
        { x: 150, y: 350 },
    ];

    let failed = false;
    userPath.forEach(({ x, y }) => {
        const isPointValid = targetShape.some(
            (point) => Math.hypot(point.x - x, point.y - y) < 10 // 10-pixel margin
        );
        if (!isPointValid) failed = true;
    });

    if (failed) {
        game.gameStatus = "failed";
        return res.status(200).json({ message: "Candy broke!", game });
    }

    // Update progress if tracing is successful
    game.progress += 20; // Example increment
    if (game.progress >= 100) {
        game.gameStatus = "finished";
        return res.status(200).json({ message: "Shape completed!", game });
    }

    res.status(200).json({ game });
});


// Additional game routes (Tug of War, Marbles, Glass Bridge, Squid Game)
// Can follow a similar pattern

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
