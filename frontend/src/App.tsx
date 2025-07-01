import KnowledgeNetwork from "./components/KnowledgeNetwork";
import "./index.css";
import "./components/styles.css";

function App() {
  return (
    <div className="app-bg">
      <header className="main-header">
        <div className="header-content full-width">
          <h1 className="main-title">Red de Conocimiento OJS</h1>
        </div>
      </header>
      <main className="main-layout full-width">
        <KnowledgeNetwork />
      </main>
    </div>
  );
}

export default App;
