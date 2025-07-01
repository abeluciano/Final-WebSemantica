import { useState, useEffect } from 'react';
import { getSeccionesMasActivas, getAutores } from '../services/api';
import type { Section, TopAuthor } from '../services/api';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { section?: string, author?: string, institution?: string }) => void;
}

export default function SearchBar({ onSearch, onFilterChange }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'article' | 'author' | 'institution' | 'keywords'>('article');
  const [sections, setSections] = useState<Section[]>([]);
  const [authors, setAuthors] = useState<TopAuthor[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Cargar datos iniciales
    Promise.all([
      getSeccionesMasActivas(),
      getAutores()
    ]).then(([sectionsRes, authorsRes]) => {
      setSections(sectionsRes);
      setAuthors(authorsRes);
    }).catch((error) => {
      console.error('Error loading search data:', error);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleFilterChange = () => {
    onFilterChange({
      section: selectedSection,
      author: selectedAuthor
    });
  };

  return (
    <form className="search-bar-modern" style={{width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 6px rgba(33,150,243,0.08)', padding: '0.7rem 1.2rem', marginBottom: 0}} onSubmit={handleSearch}>
      <select 
        value={searchType} 
        onChange={(e) => setSearchType(e.target.value as typeof searchType)}
        style={{minWidth: 120}}
      >
        <option value="article">Artículos</option>
        <option value="author">Autores</option>
        <option value="institution">Institución</option>
        <option value="keywords">Palabras clave</option>
      </select>
      <input 
        type="text" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
        style={{flex: 2, minWidth: 180}}
      />
      <select 
        value={selectedSection ?? ''} 
        onChange={(e) => {
          setSelectedSection(e.target.value || undefined);
          handleFilterChange();
        }}
        style={{minWidth: 120}}
      >
        <option value="">Todas las secciones</option>
        {sections.map((section: Section) => (
          <option key={section.seccion} value={section.seccion}>
            {section.seccion}
          </option>
        ))}
      </select>
      <select 
        value={selectedAuthor ?? ''} 
        onChange={(e) => {
          setSelectedAuthor(e.target.value || undefined);
          handleFilterChange();
        }}
        style={{minWidth: 120}}
      >
        <option value="">Todos los autores</option>
        {authors.map((author: TopAuthor) => (
           <option key={author.autor} value={author.autor}>
             {author.autor}
           </option>
        ))}
      </select>
      <button type="submit" style={{padding: '0.5rem 1.2rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}>Buscar</button>
    </form>
  );
}
