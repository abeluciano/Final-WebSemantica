import type { Article } from '../services/api';
import { useState } from 'react';

interface ArticleListProps {
  articles: Article[];
  onArticleClick?: (article: Article) => void;
}

export default function ArticleList({ articles, onArticleClick }: ArticleListProps) {
  const [visibleCount, setVisibleCount] = useState(5);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  const isValidDOIUrl = (doi: string) => {
    return doi.startsWith('http://') || doi.startsWith('https://');
  };

  return (
    <div className="mt-4">
      <h5 className="mb-3">Artículos</h5>
      {articles.slice(0, visibleCount).map((article) => (
        <div key={article.doi} className="card mb-3 shadow-sm">
          <div className="card-body">
            <h6
              className="card-title text-primary mb-2"
              style={{ cursor: 'pointer' }}
              onClick={() => onArticleClick?.(article)}
            >
              {article.titulo}
            </h6>
            <p className="mb-1">
              👤 <strong>Autor:</strong> {article.autor}
            </p>
            <p className="mb-2">
              🔗 <strong>DOI:</strong>{' '}
              {isValidDOIUrl(article.doi) ? (
                <a href={article.doi} target="_blank" rel="noopener noreferrer">
                  {article.doi}
                </a>
              ) : (
                article.doi
              )}
            </p>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onArticleClick?.(article)}
            >
              Ver detalles
            </button>
          </div>
        </div>
      ))}
      {visibleCount < articles.length && (
        <div className="d-grid">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleShowMore}>
            Mostrar más artículos
          </button>
        </div>
      )}
    </div>
  );
}
