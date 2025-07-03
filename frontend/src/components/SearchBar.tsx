import { useState, useEffect } from 'react';
import { getSeccionesMasActivas, getAutores } from '../services/api';
import type { Section, TopAuthor } from '../services/api';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { section?: string; author?: string; institution?: string }) => void;
}

export default function SearchBar({ onSearch, onFilterChange }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'article' | 'author' | 'institution' | 'keywords'>('article');
  const [sections, setSections] = useState<Section[]>([]);
  const [authors, setAuthors] = useState<TopAuthor[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>(undefined);

  useEffect(() => {
    Promise.all([getSeccionesMasActivas(), getAutores()])
      .then(([sectionsRes, authorsRes]) => {
        setSections(sectionsRes);
        setAuthors(authorsRes);
      })
      .catch((error) => {
        console.error('Error loading search data:', error);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let query = searchTerm;

    switch (searchType) {
      case 'article':
        query = `articulo:${searchTerm}`;
        break;
      case 'author':
        query = `autor:${searchTerm}`;
        break;
      case 'institution':
        query = `institucion:${searchTerm}`;
        break;
      case 'keywords':
        query = `keywords:${searchTerm}`;
        break;
    }

    onSearch(query);
  };

  const handleFilterChange = () => {
    onFilterChange({
      section: selectedSection,
      author: selectedAuthor
    });
  };

  return (
    <form className="mb-3" onSubmit={handleSearch}>
      <div className="row g-2 align-items-end">
        <div className="col-sm-3 col-md-2">
          <label className="form-label">Tipo</label>
          <select
            className="form-select"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as typeof searchType)}
          >
            <option value="article">Artículos</option>
            <option value="author">Autores</option>
            <option value="institution">Institución</option>
            <option value="keywords">Palabras clave</option>
          </select>
        </div>

        <div className="col-sm-5 col-md-4">
          <label className="form-label">Término de búsqueda</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="col-sm-4 col-md-3">
          <label className="form-label">Filtrar por sección</label>
          <select
            className="form-select"
            value={selectedSection ?? ''}
            onChange={(e) => {
              setSelectedSection(e.target.value || undefined);
              handleFilterChange();
            }}
          >
            <option value="">Todas</option>
            {sections.map((section) => (
              <option key={section.seccion} value={section.seccion}>
                {section.seccion}
              </option>
            ))}
          </select>
        </div>

        <div className="col-sm-4 col-md-3">
          <label className="form-label">Filtrar por autor</label>
          <select
            className="form-select"
            value={selectedAuthor ?? ''}
            onChange={(e) => {
              setSelectedAuthor(e.target.value || undefined);
              handleFilterChange();
            }}
          >
            <option value="">Todos</option>
            {authors.map((author) => (
              <option key={author.autor} value={author.autor}>
                {author.autor}
              </option>
            ))}
          </select>
        </div>

        <div className="col-auto">
          <button type="submit" className="btn btn-primary w-100">
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}
