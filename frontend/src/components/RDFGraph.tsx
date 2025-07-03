import { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';

interface RDFTriple {
  subject: string;
  predicate: string;
  object: string;
  orcid?: string;
}

interface Node {
  id: string;
  label: string;
  group: 'article' | 'author' | 'section';
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

interface RDFGraphProps {
  data: RDFTriple[];
  onNodeClick: (node: any) => void;
}

export default function RDFGraph({ data, onNodeClick }: RDFGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const nodesMap = new Map<string, Node>();
    const edges: Edge[] = [];

    data.forEach(triple => {
      const { subject, predicate, object } = triple;

      if (!nodesMap.has(subject)) {
        nodesMap.set(subject, {
          id: subject,
          label: subject.split(':')[1],
          group: subject.startsWith('author:') ? 'author' : 'article',
        });
      }

      if (!nodesMap.has(object)) {
        nodesMap.set(object, {
          id: object,
          label: object.split(':')[1],
          group: object.startsWith('author:') ? 'author' : 'article',
        });
      }

      edges.push({
        from: subject,
        to: object,
        label: predicate,
      });
    });

    const nodes = Array.from(nodesMap.values());

    const network = new Network(containerRef.current, {
      nodes,
      edges,
    }, {
      layout: {
        improvedLayout: true,
      },
      interaction: {
        hover: true,
      },
      physics: {
        stabilization: true,
      },
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          size: 16,
          color: '#000',
        },
      },
      groups: {
        author: { color: { background: '#2196F3' } },
        article: { color: { background: '#4CAF50' } },
        section: { color: { background: '#FF9800' } },
      },
    });

    networkRef.current = network;

    network.on('click', function (params) {
      if (params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const clickedNode = nodesMap.get(clickedId);
        if (clickedNode) onNodeClick(clickedNode);
      }
    });

    return () => {
      network.destroy();
    };
  }, [data]);

  return <div ref={containerRef} style={{ height: '500px', width: '100%' }} />;
}
