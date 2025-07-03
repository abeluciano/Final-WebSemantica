import { useEffect, useState } from 'react';
import { 
  getArticulos, 
  getAutores, 
  getSeccionesMasActivas, 
  getAutoresTop,
  getArticulosPorKeywords,
  getArticulosPorInstitucion,
  getArticulosRelacionados,
  getArticulosPorKeyword
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

  const buildRDFGraph = (articles: any[]): any[] => {
    const triples: any[] = [];

    articles.forEach(article => {
      const articleURI = `article:${article.doi}`;
      const authorURI = `author:${article.autor}`;

      // Nodo tipo Artículo
      triples.push({
        subject: articleURI,
        predicate: 'type',
        object: 'article',
        titulo: article.titulo
      });

      // Relación Artículo - Autor
      triples.push({
        subject: articleURI,
        predicate: 'hasAuthor',
        object: authorURI
      });

      // Nodo Autor
      triples.push({
        subject: authorURI,
        predicate: 'type',
        object: 'author',
        name: article.autor
      });

      // Sección (si disponible)
      if (article.seccion) {
        const sectionURI = `section:${article.seccion}`;
        triples.push({
          subject: articleURI,
          predicate: 'hasSection',
          object: sectionURI
        });
        triples.push({
          subject: sectionURI,
          predicate: 'type',
          object: 'section',
          name: article.seccion
        });
      }

      // Institución (si disponible)
      if (article.institucion) {
        const instURI = `inst:${article.institucion}`;
        triples.push({
          subject: articleURI,
          predicate: 'hasInstitution',
          object: instURI
        });
        triples.push({
          subject: instURI,
          predicate: 'type',
          object: 'institution',
          name: article.institucion
        });
      }

      // Palabras clave
      if (article.keywords) {
        const keywords = article.keywords.split(',').map((k: string) => k.trim());
        keywords.forEach((kw: any) => {
          const kwURI = `keyword:${kw}`;
          triples.push({
            subject: articleURI,
            predicate: 'hasKeyword',
            object: kwURI
          });
          triples.push({
            subject: kwURI,
            predicate: 'type',
            object: 'keyword',
            name: kw
          });
        });
      }
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
      if (query.startsWith('autor:')) {
        const autorBuscado = query.replace('autor:', '');
        const results = await getArticulos(autorBuscado);
        setArticles(results);
        setRdfData(await buildRDFGraph(results));
      } else if (query.startsWith('articulo:')) {
        const term = query.split(':')[1];
        const results = await getArticulos(term);
        setArticles(results);
        setRdfData(await buildRDFGraph(results));
      } else if (query.startsWith('autor:')) {
        const term = query.split(':')[1];
        const results = await getArticulos(term); // buscar artículos por autor
        setArticles(results);
        setRdfData(await buildRDFGraph(results));
      } else if (query.startsWith('institucion:')) {
        const term = query.split(':')[1];
        const results = await getArticulosPorInstitucion(term);
        setArticles(results);
        setRdfData(await buildRDFGraph(results));
      } else if (query.startsWith('keywords:')) {
        const term = query.split(':')[1];
        const results = await getArticulosPorKeyword(term);
        setArticles(results);
        setRdfData(await buildRDFGraph(results));
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  };


  const handleFilterChange = (filters: { section?: string, author?: string, institution?: string }) => {
    // Aquí deberías implementar la lógica de filtrado
    console.log('Filters changed:', filters);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-3">
        <div className="col">
          <SearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} />
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="bg-light border rounded p-2" style={{ height: '70vh', minHeight: '400px' }}>
            <RDFGraph
              data={rdfData}
              selectedNode={selectedNode}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>

        <div className="col-lg-4">
          <div className="bg-white border rounded p-3" style={{ height: '70vh', overflowY: 'auto' }}>
            <div className="mb-4">
              <h5>Secciones más activas</h5>
              <ul className="list-group">
                {activeSections.map(section => (
                  <li key={section.seccion} className="list-group-item">
                    {section.seccion}
                  </li>
                ))}
              </ul>
            </div>
            <AuthorList authors={topAuthors} onAuthorClick={(author) => handleNodeClick(author)} />
            <ArticleList articles={articles} onArticleClick={(article) => handleNodeClick(article)} />
          </div>
        </div>
      </div>
    </div>
  );
}
