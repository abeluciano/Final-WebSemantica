import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: 'article' | 'author' | 'section';
  name: string;
  orcid?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: Node;
  target: Node;
  type: string;
}

interface RDFGraphProps {
  data: {
    subject: string;
    predicate: string;
    object: string;
    orcid?: string;
  }[];
  selectedNode: Node | null;
  onNodeClick: (node: Node) => void;
}

export default function RDFGraph({ data, selectedNode, onNodeClick }: RDFGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Crear nodos y enlaces a partir de los datos RDF
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Convertir triples RDF en nodos y enlaces
    data.forEach(triple => {
      const sourceId = triple.subject;
      const targetId = triple.object;
      
      // Asegurarse de que los nodos existan
      if (!nodes.find(n => n.id === sourceId)) {
        nodes.push({
          id: sourceId,
          type: sourceId.startsWith('author:') ? 'author' : 'article',
          name: sourceId.split(':')[1],
          orcid: sourceId.startsWith('author:') ? triple.orcid : undefined
        });
      }
      
      if (!nodes.find(n => n.id === targetId)) {
        nodes.push({
          id: targetId,
          type: targetId.startsWith('author:') ? 'author' : 'article',
          name: targetId.split(':')[1],
          orcid: targetId.startsWith('author:') ? triple.orcid : undefined
        });
      }
      
      // Crear enlace
      links.push({
        source: nodes.find(n => n.id === sourceId)!,
        target: nodes.find(n => n.id === targetId)!,
        type: triple.predicate
      });
    });

    // Configurar la simulación de fuerzas
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .on('tick', ticked);

    // Crear SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Crear enlaces
    const link = svg.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .style('stroke', '#999')
      .style('stroke-opacity', 0.6);

    // Crear nodos
    const node = svg.selectAll<SVGGElement, Node>('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }))
      .on('click', (_, d) => onNodeClick(d));

    // Añadir círculos a los nodos
    node.append('circle')
      .attr('r', d => d.type === 'author' ? 8 : 6)
      .style('fill', d => {
        switch (d.type) {
          case 'author': return '#2196F3';
          case 'article': return '#4CAF50';
          default: return '#9C27B0';
        }
      });

    // Añadir etiquetas a los nodos
    node.append('text')
      .attr('dx', 12)
      .attr('dy', 4)
      .text(d => d.name);

    // Funciones de simulación
    function ticked() {
      link
        .attr('x1', (d: Link) => d.source.x ?? 0)
        .attr('y1', (d: Link) => d.source.y ?? 0)
        .attr('x2', (d: Link) => d.target.x ?? 0)
        .attr('y2', (d: Link) => d.target.y ?? 0);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    }

    // Limpiar cuando el componente se desmonte
    return () => {
      simulation.stop();
    };
  }, [data, selectedNode]);

  return (
    <svg ref={svgRef} width="100%" height="100%" style={{ width: '100%', height: '100%', minHeight: '400px', display: 'block', border: '1px solid #ddd' }} />
  );
}
