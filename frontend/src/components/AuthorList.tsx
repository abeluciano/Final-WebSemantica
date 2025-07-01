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

  useEffect(() => {
    // Cargar detalles adicionales de ORCID para cada autor
    const loadAuthorDetails = async () => {
      const details: { [key: string]: AuthorDetails } = {};
      for (const author of authors) {
        try {
          const response = await axios.get(`https://pub.orcid.org/v3.0/${author.autor}`, {
            headers: { 'Accept': 'application/json' }
          });
          details[author.autor] = {
            country: response.data.person?.addresses?.content?.[0]?.country?.value,
            biography: response.data.person?.biography?.content
          };
        } catch (error) {
          console.error(`Error loading ORCID data for ${author.autor}:`, error);
        }
      }
      setAuthorDetails(details);
    };

    loadAuthorDetails();
  }, [authors]);

  const handleAuthorClick = (author: TopAuthor) => {
    if (onAuthorClick) {
      onAuthorClick(author.autor);
    }
  };

  return (
    <div className="author-list">
      <h3>Autores más prolíficos</h3>
      <div className="authors-container">
        {authors.map((author) => (
          <div 
            key={author.autor} 
            className="author-card"
            onClick={() => handleAuthorClick(author)}
          >
            <div className="author-info">
              <h4>{author.autor}</h4>
              <p className="publications">📝 Publicaciones: <b>{author.publicaciones}</b></p>
              {authorDetails[author.autor] && (
                <div className="orcid-details">
                  {authorDetails[author.autor].country && (
                    <p>🌎 <b>País:</b> {authorDetails[author.autor].country}</p>
                  )}
                  {authorDetails[author.autor].biography && (
                    <p>📖 <b>Biografía:</b> {authorDetails[author.autor].biography}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}