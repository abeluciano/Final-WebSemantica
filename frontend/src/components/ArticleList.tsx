import type { Article } from '../services/api';

interface ArticleListProps {
  articles: Article[];
  onArticleClick?: (article: Article) => void;
}

export default function ArticleList({ articles, onArticleClick }: ArticleListProps) {
  return (
    <div className="article-list">
      <h3>Artículos</h3>
      <div className="articles-container">
        {articles.map((article) => (
          <div 
            key={article.doi} 
            className="article-card"
            onClick={() => onArticleClick?.(article)}
          >
            <div className="article-info">
              <h4>{article.titulo}</h4>
              <p className="author">👤 <b>Autor:</b> {article.autor}</p>
              <p className="doi">🔗 <b>DOI:</b> {article.doi}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
