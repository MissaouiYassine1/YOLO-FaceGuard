const Results = () => {
    // Données simulées
    const detectionResults = [
      { id: 1, image: "detection1.jpg", faces: 3, timestamp: "2023-05-15" },
      { id: 2, image: "detection2.jpg", faces: 1, timestamp: "2023-05-16" }
    ];
  
    return (
      <div className="page results-page">
        <h2>Résultats de détection</h2>
        
        <div className="results-summary">
          <p>Total détections : {detectionResults.length}</p>
        </div>
  
        <div className="results-list">
          {detectionResults.map(result => (
            <div key={result.id} className="result-item">
              <h3>Image #{result.id}</h3>
              <img src={`/images/${result.image}`} alt={`Détection ${result.id}`} />
              <p>Visages détectés: {result.faces}</p>
              <p>Date: {result.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default Results;