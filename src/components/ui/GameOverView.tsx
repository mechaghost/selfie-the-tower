import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './GameOverView.css';
import { Skull } from 'lucide-react';

export const GameOverView: React.FC = () => {
    const { floor, initializeRun, seed } = useGameStore();

    const handleRestart = () => {
        // Generate a new seed or let them replay the same one
        // For standard rogue logic, replay with a fresh seed
        const newSeed = Math.random().toString(36).substring(7);
        initializeRun(newSeed);
    };

    return (
        <div className="game-over-container">
            <div className="game-over-content">
                <Skull size={80} className="game-over-icon" />
                <h1 className="game-over-title">YOU DIED</h1>
                <p className="game-over-stats">
                    Floor Reached: <strong>{floor}</strong>
                </p>
                <div className="game-over-actions">
                    <button className="restart-button" onClick={handleRestart}>
                        Play Again
                    </button>
                    <button className="retry-seed-button" onClick={() => initializeRun(seed)}>
                        Retry Seed
                    </button>
                </div>
            </div>
        </div>
    );
};
