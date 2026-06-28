import { useEffect, useRef, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import linkMapData from '../data/pagemap-links.json';

// Types
interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  category: 'home' | 'blog' | 'cheatsheet' | 'root';
  linkCount: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

// Category colors
const COLORS = {
  home: { fill: '#fbbf24', stroke: '#d97706', text: '#1f2937' },
  blog: { fill: '#34d399', stroke: '#059669', text: '#064e3b' },
  cheatsheet: { fill: '#67e8f9', stroke: '#06b6d4', text: '#164e63' },
  root: { fill: '#a78bfa', stroke: '#7c3aed', text: '#1e1b4b' },
};

function getCategory(path: string): GraphNode['category'] {
  if (path === '/') return 'home';
  if (path.startsWith('/blog/')) return 'blog';
  if (path.startsWith('/cheat-sheets/')) return 'cheatsheet';
  return 'root';
}

function getLabel(path: string): string {
  if (path === '/') return 'Home';
  const segments = path.replace(/^\/|\/$/g, '').split('/');
  const last = segments[segments.length - 1];
  return last.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Build graph data from link map
function buildGraphData(): { nodes: GraphNode[]; links: GraphLink[] } {
  const data = linkMapData as Record<string, string[]>;
  const pageSet = new Set(Object.keys(data));
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  for (const [page, targets] of Object.entries(data)) {
    const cat = getCategory(page);
    const outbound = targets.filter(t => pageSet.has(t));
    nodes.push({
      id: page,
      label: getLabel(page),
      category: cat,
      linkCount: outbound.length,
    });

    for (const target of outbound) {
      links.push({ source: page, target });
    }
  }

  return { nodes, links };
}

export default function PageMapGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; node: GraphNode | null }>({
    dragging: false, startX: 0, startY: 0, node: null
  });
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const animRef = useRef<number>(0);
  const drawCanvasRef = useRef<() => void>(() => {});

  // Build graph data once
  const graphData = useRef(buildGraphData());

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Keep drawCanvasRef in sync with latest drawCanvas
  useEffect(() => {
    drawCanvasRef.current = drawCanvas;
  });

  // Initialize simulation
  useEffect(() => {
    const { nodes, links } = graphData.current;
    nodesRef.current = nodes;
    linksRef.current = links;

    const sim = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(50)
        .strength(0.1)
      )
      .force('charge', forceManyBody().strength(-30).distanceMax(300))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<GraphNode>().radius(d => d.category === 'home' ? 20 : 6).strength(0.7))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    simRef.current = sim;

    // Render loop — always calls the latest drawCanvas via ref
    const render = () => {
      drawCanvasRef.current();
      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      sim.stop();
    };
  }, []);

  // Update center force on resize
  useEffect(() => {
    if (simRef.current) {
      simRef.current.force('center', forceCenter(0, 0));
      simRef.current.alpha(0.1).restart();
    }
  }, [dimensions]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { x: tx, y: ty, k } = transformRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2 + tx, height / 2 + ty);
    ctx.scale(k, k);

    const nodes = nodesRef.current;
    const links = linksRef.current;

    // Draw edges
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (const link of links) {
      const source = link.source as GraphNode;
      const target = link.target as GraphNode;
      if (source.x == null || source.y == null || target.x == null || target.y == null) continue;

      // If a node is selected, only draw its edges
      if (selectedNode && source.id !== selectedNode.id && target.id !== selectedNode.id) continue;

      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
    }
    ctx.stroke();

    // Draw highlighted edges for selected node
    if (selectedNode) {
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const link of links) {
        const source = link.source as GraphNode;
        const target = link.target as GraphNode;
        if (source.x == null || source.y == null || target.x == null || target.y == null) continue;
        if (source.id === selectedNode.id) {
          ctx.strokeStyle = '#10b981';
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
        } else if (target.id === selectedNode.id) {
          ctx.strokeStyle = '#f59e0b';
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
        }
      }
      ctx.stroke();
    }

    // Draw nodes
    ctx.globalAlpha = 1;
    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;
      const color = COLORS[node.category];
      const radius = node.category === 'home' ? 12 : (node.category === 'root' ? 6 : 3.5);

      // Dim nodes that aren't connected to selected
      if (selectedNode && node.id !== selectedNode.id) {
        const isConnected = links.some(l => {
          const s = (l.source as GraphNode).id;
          const t = (l.target as GraphNode).id;
          return (s === selectedNode.id && t === node.id) || (t === selectedNode.id && s === node.id);
        });
        if (!isConnected) {
          ctx.globalAlpha = 0.15;
        } else {
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color.fill;
      ctx.fill();
      ctx.strokeStyle = color.stroke;
      ctx.lineWidth = node === hoveredNode || node === selectedNode ? 2 : 0.5;
      ctx.stroke();

      // Draw label for home, root, and hovered/selected
      if (node.category === 'home' || node.category === 'root' || node === hoveredNode || node === selectedNode) {
        ctx.globalAlpha = 1;
        ctx.font = node.category === 'home' ? 'bold 10px sans-serif' : '8px sans-serif';
        ctx.fillStyle = '#e5e7eb';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + radius + 2);
      }
    }

    ctx.restore();

    // Draw tooltip for hovered node
    if (hoveredNode && hoveredNode.x != null && hoveredNode.y != null) {
      const screenX = hoveredNode.x * k + width / 2 + tx;
      const screenY = hoveredNode.y * k + height / 2 + ty;
      ctx.save();
      ctx.font = '12px sans-serif';
      const text = `${hoveredNode.label} (${hoveredNode.id})`;
      const metrics = ctx.measureText(text);
      const pw = 8, ph = 6;
      const bx = screenX - metrics.width / 2 - pw;
      const by = screenY - 30;
      ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
      ctx.beginPath();
      ctx.roundRect(bx, by, metrics.width + pw * 2, 20 + ph, 4);
      ctx.fill();
      ctx.fillStyle = '#f9fafb';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, screenX, by + 10 + ph / 2);
      ctx.restore();
    }
  }, [dimensions, hoveredNode, selectedNode]);

  // Find node under mouse
  const findNodeAt = useCallback((clientX: number, clientY: number): GraphNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { width, height } = dimensions;
    const { x: tx, y: ty, k } = transformRef.current;

    const mx = (clientX - rect.left - width / 2 - tx) / k;
    const my = (clientY - rect.top - height / 2 - ty) / k;

    for (const node of nodesRef.current) {
      if (node.x == null || node.y == null) continue;
      const radius = node.category === 'home' ? 12 : (node.category === 'root' ? 6 : 3.5);
      const hitRadius = Math.max(radius, 8); // minimum hit area
      const dx = node.x - mx;
      const dy = node.y - my;
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }, [dimensions]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.dragging && dragRef.current.node) {
      // Drag node
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { k } = transformRef.current;
      const dx = (e.clientX - dragRef.current.startX) / k;
      const dy = (e.clientY - dragRef.current.startY) / k;
      dragRef.current.node.fx = (dragRef.current.node.x || 0) + dx;
      dragRef.current.node.fy = (dragRef.current.node.y || 0) + dy;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      simRef.current?.alpha(0.1).restart();
      return;
    }
    if (dragRef.current.dragging) {
      // Pan
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      return;
    }
    const node = findNodeAt(e.clientX, e.clientY);
    setHoveredNode(node);
  }, [findNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = findNodeAt(e.clientX, e.clientY);
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, node };
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, [findNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.node) {
      const node = dragRef.current.node;
      // If barely moved, treat as click
      const moved = Math.abs(e.clientX - dragRef.current.startX) + Math.abs(e.clientY - dragRef.current.startY);
      if (moved < 3) {
        setSelectedNode(prev => prev?.id === node.id ? null : node);
      }
      node.fx = null;
      node.fy = null;
    } else {
      // Click on empty space
      const moved = Math.abs(e.clientX - dragRef.current.startX) + Math.abs(e.clientY - dragRef.current.startY);
      if (moved < 3) {
        setSelectedNode(null);
      }
    }
    dragRef.current = { dragging: false, startX: 0, startY: 0, node: null };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.92 : 1.08;
    const newK = Math.min(Math.max(transformRef.current.k * scaleFactor, 0.1), 5);
    transformRef.current.k = newK;
  }, []);

  // Compute stats for selected node
  const selectedStats = selectedNode ? (() => {
    const data = linkMapData as Record<string, string[]>;
    const pageSet = new Set(Object.keys(data));
    const outbound = (data[selectedNode.id] || []).filter(t => pageSet.has(t));
    const inbound = Object.keys(data).filter(p => (data[p] || []).includes(selectedNode.id));
    return { outbound: outbound.length, inbound: inbound.length, path: selectedNode.id, label: selectedNode.label };
  })() : null;

  const totalNodes = graphData.current.nodes.length;
  const totalEdges = graphData.current.links.length;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: hoveredNode ? 'pointer' : 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      {/* Legend panel */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(17, 24, 39, 0.92)',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#d1d5db',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'none',
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#f9fafb', marginBottom: '2px' }}>
          SWF Page Map — {totalNodes} pages, {totalEdges} links
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS.home.fill, marginRight: 4 }}></span>Home</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS.root.fill, marginRight: 4 }}></span>Root Pages ({graphData.current.nodes.filter(n => n.category === 'root').length})</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS.blog.fill, marginRight: 4 }}></span>Blog ({graphData.current.nodes.filter(n => n.category === 'blog').length})</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS.cheatsheet.fill, marginRight: 4 }}></span>Cheat Sheets ({graphData.current.nodes.filter(n => n.category === 'cheatsheet').length})</span>
        </div>
        <div style={{ fontSize: '10px', color: '#9ca3af' }}>Scroll to zoom • Drag to pan • Click a node to inspect</div>
      </div>

      {/* Selected node info */}
      {selectedStats && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid #4b5563',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#d1d5db',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxWidth: '320px',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 'bold', color: '#f9fafb', fontSize: '13px' }}>{selectedStats.label}</div>
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>{selectedStats.path}</div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            <span style={{ color: '#10b981' }}>↗ Outbound: {selectedStats.outbound}</span>
            <span style={{ color: '#f59e0b' }}>↙ Inbound: {selectedStats.inbound}</span>
          </div>
        </div>
      )}
    </div>
  );
}
