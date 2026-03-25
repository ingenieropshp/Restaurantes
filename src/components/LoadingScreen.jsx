export default function LoadingScreen({ titulo }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h1 className="title">{titulo}<span><span className="neon-duck">🦆</span></span></h1>
        <div className="spinner"></div>
        <p className="loading-text">Preparando tu próxima experiencia...</p>
      </div>
    </div>
  );
}