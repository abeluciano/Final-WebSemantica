import { useEffect, useState } from 'react';
import { 
  getArticulos, 
  getAutores, 
  getSeccionesMasActivas, 
  getAutoresTop
} from '../services/api';
import type { Article, Section, TopAuthor } from '../services/api';
import RDFGraph from './RDFGraph';
import SearchBar from './SearchBar';
import AuthorList from './AuthorList';
import ArticleList from './ArticleList';

interface Node {
  id: string;
  type: 'article' | 'author' | 'section';
  name: string;
  orcid?: string;
  doi?: string;
  titulo?: string;
  autor?: string;
}

export default function KnowledgeNetwork() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeSections, setActiveSections] = useState<Section[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [rdfData, setRdfData] = useState<any[]>([]);

  useEffect(() => {
    // Cargar datos iniciales
    const loadInitialData = async () => {
      const [articlesRes, sectionsRes, topAuthorsRes] = await Promise.all([
        getArticulos(),
        getSeccionesMasActivas(),
        getAutoresTop()
      ]);
      
      setArticles(articlesRes);
      setActiveSections(sectionsRes);
      setTopAuthors(topAuthorsRes);
      
      // Construir datos RDF iniciales usando el autor del artículo
      const rdf = await buildRDFGraph(articlesRes);
      setRdfData(rdf);
    };

    loadInitialData();
  }, []);

  const buildRDFGraph = (articles: Article[]): any[] => {
    const triples: any[] = [];

    // Añadir nodos de artículos
    articles.forEach(article => {
      triples.push({
        subject: `article:${article.doi}`,
        predicate: 'type',
        object: 'article',
        titulo: article.titulo,
        autor: article.autor
      });

      // Añadir relaciones entre artículos y autores
      triples.push({
        subject: `article:${article.doi}`,
        predicate: 'hasAuthor',
        object: `author:${article.autor}`
      });
    });

    return triples;
  };

  const handleNodeClick = (node: any) => {
    if (node.doi) {
      setSelectedNode({
        id: node.doi,
        type: 'article',
        name: node.title,
        orcid: undefined
      });
    } else if (node.id) {
      setSelectedNode({
        id: node.id,
        type: 'author',
        name: node.name,
        orcid: node.orcid
      });
    }
  };

  const handleSearch = async (query: string) => {
    try {
      // Aquí deberías implementar la lógica de búsqueda según el tipo de query
      // Por ejemplo:
      if (query.startsWith('articulo:')) {
        const results = await getArticulos();
        setArticles(results);
      } else if (query.startsWith('autor:')) {
        const results = await getAutores();
        setTopAuthors(results);
      }
      // ... etc
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleFilterChange = (filters: { section?: string, author?: string, institution?: string }) => {
    // Aquí deberías implementar la lógica de filtrado
    console.log('Filters changed:', filters);
  };

  return (
    <div className="knowledge-network" style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
      <div className="main-content" style={{width: '100%', maxWidth: '1200px', margin: '0 auto'}}>
        <div className="filters-row" style={{width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
          <SearchBar 
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
          <section className="network-container" style={{flex: 3, height: '70vh', minHeight: '400px', position: 'relative', overflow: 'hidden'}}>
            <RDFGraph 
              data={rdfData}
              selectedNode={selectedNode}
              onNodeClick={handleNodeClick}
            />
          </section>
          <aside className="side-panel-rect" style={{flex: 1, maxWidth: '340px', minWidth: '260px', height: '70vh', minHeight: '400px', background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(33,150,243,0.10)', marginLeft: '2rem', padding: '2rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column'}}>
            <div className="stats">
              <h3>Secciones más activas</h3>
              <ul>
                {activeSections.map((section: Section) => (
                  <li key={section.seccion}>{section.seccion}</li>
                ))}
              </ul>
            </div>
            <AuthorList 
              authors={topAuthors}
              onAuthorClick={(author) => handleNodeClick(author)}
            />
            <ArticleList 
              articles={articles}
              onArticleClick={(article) => handleNodeClick(article)}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
