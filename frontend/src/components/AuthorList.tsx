import { useState, useEffect } from 'react';
import axios from 'axios';
import type { TopAuthor } from '../services/api';

interface AuthorDetails {
  country?: string;
  biography?: string;
}

interface AuthorListProps {
  authors: TopAuthor[];
  onAuthorClick?: (author: string) => void;
}

export default function AuthorList({ authors, onAuthorClick }: AuthorListProps) {
  const [authorDetails, setAuthorDetails] = useState<{ [key: string]: AuthorDetails }>({});
  const [visibleCount, setVisibleCount] = useState(5);
  const [expandedBios, setExpandedBios] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const loadDetails = async () => {
      const details: { [key: string]: AuthorDetails } = {};
      for (const author of authors.slice(0, visibleCount)) {
        try {
          const response = await axios.get(`https://pub.orcid.org/v3.0/${author.autor}`, {
            headers: { Accept: 'application/json' },
          });
          details[author.autor] = {
            country: response.data.person?.addresses?.content?.[0]?.country?.value,
            biography: response.data.person?.biography?.content,
          };
        } catch (error) {
          console.warn(`No ORCID info for ${author.autor}`);
        }
      }
      setAuthorDetails((prev) => ({ ...prev, ...details }));
    };

    loadDetails();
  }, [authors, visibleCount]);

  const handleShowMore = () => setVisibleCount((prev) => prev + 5);

  const handleToggleBio = (author: string) => {
    setExpandedBios((prev) => ({ ...prev, [author]: !prev[author] }));
  };

  const handleClick = (author: TopAuthor) => {
    onAuthorClick?.(author.autor);
  };

  return (
    <div className="mt-4">
      <h5 className="mb-3">Autores más prolíficos</h5>
      {authors.slice(0, visibleCount).map((author) => (
        <div key={author.autor} className="card mb-3 shadow-sm">
          <div className="card-body">
            <h6
              className="card-title mb-1 text-primary"
              style={{ cursor: 'pointer' }}
              onClick={() => handleClick(author)}
            >
              {author.autor}
            </h6>
            <p className="mb-1">
              📝 <strong>Publicaciones:</strong> {author.publicaciones}
            </p>
            {authorDetails[author.autor]?.country && (
              <p className="mb-1">🌎 <strong>País:</strong> {authorDetails[author.autor].country}</p>
            )}
            {authorDetails[author.autor]?.biography && (
              <p className="mb-1">
                📖 <strong>Biografía:</strong>{' '}
                {expandedBios[author.autor] || authorDetails[author.autor].biography!.length <= 100
                  ? authorDetails[author.autor].biography
                  : `${authorDetails[author.autor].biography!.slice(0, 100)}... `}
                {authorDetails[author.autor].biography!.length > 100 && (
                  <button
                    className="btn btn-sm btn-link p-0"
                    onClick={() => handleToggleBio(author.autor)}
                  >
                    {expandedBios[author.autor] ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </p>
            )}
            <div className="mt-2">
              <a
                href={`https://orcid.org/${author.autor}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary"
              >
                Ver en ORCID
              </a>
            </div>
          </div>
        </div>
      ))}
      {visibleCount < authors.length && (
        <div className="d-grid">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleShowMore}>
            Mostrar más autores
          </button>
        </div>
      )}
    </div>
  );
}
