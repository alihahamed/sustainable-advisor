// Variation 1: Triple Bounce
function LoadingBouncingBoxes1() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-200 to-pink-200">
      <div className="flex gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-16 h-16 bg-cyan-400 border-4 border-black"
            style={{
              boxShadow: '6px 6px 0px #000',
              animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-40px); }
        }
      `}</style>
    </div>
  );
}

// Variation 2: Rotating Squares
function LoadingBouncingBoxes2() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-lime-200 to-cyan-200">
      <div className="relative w-32 h-32">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-12 h-12 bg-pink-400 border-4 border-black"
            style={{
              boxShadow: '4px 4px 0px #000',
              top: '50%',
              left: '50%',
              animation: `spin 2s linear infinite`,
              animationDelay: `${i * 0.2}s`,
              transformOrigin: 'center'
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(40px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(40px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}

// Variation 3: Stacking Boxes
function LoadingBouncingBoxes3() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-200 to-yellow-200">
      <div className="relative">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-20 h-20 bg-orange-400 border-4 border-black mb-2"
            style={{
              boxShadow: '8px 8px 0px #000',
              animation: `stack 1.5s ease-in-out ${i * 0.3}s infinite`
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes stack {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(0.8) rotate(5deg); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// Variation 1: Pulsing "LOADING" Text
function LoadingTextMorph1() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-200 to-lime-200">
      <div className="relative">
        <div 
          className="bg-yellow-400 border-4 border-black px-8 py-4"
          style={{ 
            boxShadow: '12px 12px 0px #000',
            animation: 'pulse 1s ease-in-out infinite'
          }}
        >
          <h1 className="text-5xl font-black uppercase tracking-wider">
            LOADING...
          </h1>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-black"
              style={{
                animation: `dot 1s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.05) rotate(2deg); }
        }
        @keyframes dot {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

// Variation 2: Glitchy Progress Bar
function LoadingTextMorph2() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 to-orange-200">
      <div className="w-80">
        <div className="bg-white border-4 border-black p-6" style={{ boxShadow: '10px 10px 0px #000' }}>
          <h2 className="text-3xl font-black uppercase mb-4 -rotate-1">Loading!</h2>
          <div className="relative h-12 bg-gray-200 border-4 border-black">
            <div 
              className="absolute h-full bg-lime-400 border-r-4 border-black"
              style={{
                animation: 'progress 2s ease-in-out infinite',
                boxShadow: 'inset -4px 0px 0px #000'
              }}
            />
          </div>
          <p className="text-sm font-black uppercase mt-4 text-center">PLEASE WAIT...</p>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

// Variation 3: Spinning Badge
function LoadingTextMorph3() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-200 to-purple-200">
      <div className="flex flex-col items-center gap-6">
        <div 
          className="w-32 h-32 bg-cyan-400 border-4 border-black flex items-center justify-center"
          style={{
            boxShadow: '8px 8px 0px #000',
            animation: 'rotate 2s linear infinite'
          }}
        >
          <span className="text-5xl">⚡</span>
        </div>
        <div className="bg-yellow-300 border-4 border-black px-6 py-3" style={{ boxShadow: '6px 6px 0px #000' }}>
          <p className="text-2xl font-black uppercase">Loading</p>
        </div>
      </div>
      <style>{`
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Variation 1: Grid Flip
function LoadingGeometric1() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 bg-purple-600 border-4 border-black"
              style={{
                boxShadow: '4px 4px 0px #000',
                animation: `flip 1.5s ease-in-out ${i * 0.1}s infinite`
              }}
            />
          ))}
        </div>
        <div className="mt-6 text-center bg-white border-4 border-black px-4 py-2" style={{ boxShadow: '6px 6px 0px #000' }}>
          <p className="text-xl font-black uppercase">Processing...</p>
        </div>
      </div>
      <style>{`
        @keyframes flip {
          0%, 100% { transform: rotateY(0deg); background-color:red ; }
          50% { transform: rotateY(180deg); background-color: #facc15; }
        }
      `}</style>
    </div>
  );
}

// Variation 2: Concentric Squares
function LoadingGeometric2() {
  return (
    <div className="flex items-center justify-center bg-transparent">
      <div className="relative w-50 h-50 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute bg-green-500 border-4 border-black"
            style={{
              width: `${200 - i * 40}px`,
              height: `${200 - i * 40}px`,
              boxShadow: '8px 8px 0px #000',
              animation: `pulse-square 2s ease-in-out ${i * 0.2}s infinite`
            }}
          />
        ))}
        <div className="relative z-10 bg-white border-4 border-black px-2 py-2" style={{ boxShadow: '4px 4px 0px #000' }}>
          <p className="text-lg font-black uppercase">Loading</p>
        </div>
      </div>
      <style>{`
        @keyframes pulse-square {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(0.9) rotate(45deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// Variation 3: Diagonal Bars
function LoadingGeometric3() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-42 h-42   overflow-hidden border-4 border-black bg-white" style={{ boxShadow: '10px 10px 0px #000' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute h-full bg-orange-400 border-r-4 border-black"
              style={{
                width: '30px',
                left: `${i * 40}px`,
                animation: `slide 1.5s ease-in-out ${i * 0.1}s infinite`
              }}
            />
          ))}
        </div>
        <div className="bg-lime-400 border-4 border-black px-8 py-3 -rotate-2" style={{ boxShadow: '6px 6px 0px #000' }}>
          <p className="text-2xl font-black uppercase tracking-wide">LOADING</p>
        </div>
      </div>
      <style>{`
        @keyframes slide {
          0%, 100% { transform: translateY(0) skewX(-20deg); }
          50% { transform: translateY(-100%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}

export  {LoadingBouncingBoxes1, LoadingBouncingBoxes2, LoadingBouncingBoxes3, LoadingTextMorph1, LoadingTextMorph2, LoadingTextMorph3, LoadingGeometric1, LoadingGeometric2, LoadingGeometric3}
