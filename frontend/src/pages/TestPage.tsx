import React from 'react'

const TestPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a', 
      color: '#00ffff', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px' }}>
        🎮 GameVerse Test Page 🎮
      </h1>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
        <h2 style={{ color: '#ff00ff', marginBottom: '15px' }}>✅ Frontend Status</h2>
        <ul style={{ marginBottom: '30px' }}>
          <li>✅ React is working</li>
          <li>✅ TypeScript is compiling</li>
          <li>✅ Vite dev server is running</li>
          <li>✅ Components are loading</li>
        </ul>

        <h2 style={{ color: '#ff00ff', marginBottom: '15px' }}>🎯 Test Results</h2>
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '20px', 
          borderRadius: '8px',
          border: '2px solid #00ffff'
        }}>
          <p>If you can see this page, the frontend is working correctly!</p>
          <p>Current URL: {window.location.href}</p>
          <p>Current Time: {new Date().toLocaleString()}</p>
        </div>

        <h2 style={{ color: '#ff00ff', marginTop: '30px', marginBottom: '15px' }}>🎮 Available Games</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {[
            '🏎️ Car Racing',
            '♟️ Chess', 
            '🃏 UNO',
            '🎴 Rummy',
            '🎲 Ludo',
            '💭 Truth or Dare',
            '😂 Meme Battle',
            '🫧 Bubble Blast',
            '👊 Fighting',
            '🧮 Math Master'
          ].map((game, index) => (
            <div key={index} style={{
              backgroundColor: '#2a2a2a',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #444'
            }}>
              {game}
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '40px', 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '2px solid #00ff41'
        }}>
          <h3 style={{ color: '#00ff41', marginBottom: '10px' }}>🚀 Next Steps</h3>
          <p>This test page confirms the frontend is working.</p>
          <p>The blank page issue was likely due to a component loading problem.</p>
          <p>Let's switch back to the full landing page!</p>
        </div>
      </div>
    </div>
  )
}

export default TestPage