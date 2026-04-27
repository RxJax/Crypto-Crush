import React from 'react';

export default function SettingsModal({ onResume, onRestart, onHome, isGameOver, isWin, score }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100
    }}>
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', minWidth: '250px' }}>
        {isGameOver ? (
          <>
            <h2 className="text-gradient" style={{ fontSize: '2rem', margin: '0 0 10px 0' }}>
              {isWin ? 'Level Cleared!' : 'Out of Moves!'}
            </h2>
            <p style={{ color: '#475569', marginBottom: '20px', fontWeight: 600 }}>Final Score: {score}</p>
          </>
        ) : (
          <h2 className="text-gradient" style={{ fontSize: '2rem', margin: '0 0 20px 0' }}>Paused</h2>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isGameOver && (
            <button className="glass-button" onClick={onResume}>Resume</button>
          )}
          <button className="glass-button" onClick={onRestart}>
            {isGameOver && isWin ? 'Next Level' : 'Restart Level'}
          </button>
          <button className="glass-button" onClick={onHome} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#b91c1c' }}>
            Quit to Home
          </button>
        </div>
      </div>
    </div>
  );
}
