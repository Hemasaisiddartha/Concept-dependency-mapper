import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Search, X, Sparkles, 
  CircleDot, Network, Filter, Zap, Lock, PlayCircle, Layers
} from 'lucide-react';

export default function ConceptGraphCanvas({ 
  graphData, 
  onSelectNode, 
  selectedNodeId, 
  onStartQuiz, 
  onAskAITutor,
  courses = [],
  selectedCourseId = 1,
  onSelectCourse,
  onSearchOrGenerateTopic,
  isGeneratingTopic = false,
  generatingTopicName = ''
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  // Viewport transformation states
  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 70, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState({});
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  
  // Layout & Filter states
  const [layoutMode, setLayoutMode] = useState('dag'); // 'dag' (Hierarchical Tier Flow) or 'radial' (Orbit)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 680 });

  // Dynamically generate quick topic presets from both current course and popular topic maps
  const topicPresets = useMemo(() => {
    const presets = [];

    // Current course key concepts
    if (graphData?.nodes && graphData.nodes.length > 0) {
      const categoriesSeen = new Set();
      const emojiMap = {
        'Foundations': '📐',
        'Core Operations': '⚡',
        'Algorithms & Design': '🧠',
        'Architecture': '🏗️',
        'Advanced Systems': '🚀',
        'Optimization': '📉',
        'Vision': '👁️'
      };

      graphData.nodes.forEach(n => {
        if (!categoriesSeen.has(n.category) && presets.length < 3) {
          categoriesSeen.add(n.category);
          const icon = emojiMap[n.category] || '💡';
          presets.push({
            label: `${icon} ${n.title.length > 20 ? n.title.substring(0, 18) + '...' : n.title}`,
            query: n.title,
            nodeId: n.id,
            type: 'concept'
          });
        }
      });
    }

    // Popular Subject Topic Maps that user can explore/generate
    const subjectPresets = [
      { label: '🐍 Python', query: 'Python', type: 'topic' },
      { label: '🧠 Machine Learning', query: 'Machine Learning', type: 'topic' },
      { label: '⚛️ Quantum Computing', query: 'Quantum Computing', type: 'topic' },
      { label: '🌲 Algorithms', query: 'Intro to Algorithms', type: 'topic' }
    ];

    subjectPresets.forEach(sp => {
      if (!presets.some(p => p.query.toLowerCase() === sp.query.toLowerCase())) {
        presets.push(sp);
      }
    });

    return presets;
  }, [graphData]);

  // Categories extracted dynamically from graph
  const categories = useMemo(() => {
    if (!graphData?.nodes) return ['ALL'];
    const set = new Set(graphData.nodes.map(n => n.category));
    return ['ALL', ...Array.from(set)];
  }, [graphData]);

  // Dynamic Canvas resizing observer
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 560)
        });
      }
    };
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Compute Active Subgraph for Search / Node Selection Highlighting
  const activeSubgraph = useMemo(() => {
    if (!graphData?.nodes || !graphData?.edges) {
      return { matchIds: new Set(), prereqIds: new Set(), dependentIds: new Set(), allActiveIds: new Set(), targetNode: null, matchNodes: [] };
    }

    const trimmed = searchQuery.trim().toLowerCase();
    const targetNodeId = selectedNodeId;

    const matchNodes = trimmed 
      ? graphData.nodes.filter(n => 
          (n.title && n.title.toLowerCase().includes(trimmed)) || 
          (n.code && n.code.toLowerCase().includes(trimmed)) ||
          (n.category && n.category.toLowerCase().includes(trimmed)) ||
          (n.bloom_level && n.bloom_level.toLowerCase().includes(trimmed)) ||
          (n.description && n.description.toLowerCase().includes(trimmed))
        )
      : (targetNodeId ? graphData.nodes.filter(n => n.id === targetNodeId) : []);

    const matchIds = new Set(matchNodes.map(n => n.id));
    const prereqIds = new Set();
    const dependentIds = new Set();

    // Map adjacency
    const prereqMap = {};
    const depMap = {};
    graphData.edges.forEach(e => {
      if (!prereqMap[e.target]) prereqMap[e.target] = [];
      prereqMap[e.target].push(e.source);

      if (!depMap[e.source]) depMap[e.source] = [];
      depMap[e.source].push(e.target);
    });

    // Traverse prerequisites
    matchNodes.forEach(m => {
      const q = [...(prereqMap[m.id] || [])];
      while (q.length > 0) {
        const curr = q.shift();
        if (!prereqIds.has(curr) && !matchIds.has(curr)) {
          prereqIds.add(curr);
          if (prereqMap[curr]) q.push(...prereqMap[curr]);
        }
      }
    });

    // Traverse dependents
    matchNodes.forEach(m => {
      const q = [...(depMap[m.id] || [])];
      while (q.length > 0) {
        const curr = q.shift();
        if (!dependentIds.has(curr) && !matchIds.has(curr)) {
          dependentIds.add(curr);
          if (depMap[curr]) q.push(...depMap[curr]);
        }
      }
    });

    const allActiveIds = new Set([...matchIds, ...prereqIds, ...dependentIds]);
    const targetNode = matchNodes.length > 0 ? matchNodes[0] : null;

    return { matchIds, prereqIds, dependentIds, allActiveIds, targetNode, matchNodes };
  }, [graphData, searchQuery, selectedNodeId]);

  // Compute Clean, Non-Clumsy Layout Positions
  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) return;

    const nodes = graphData.nodes;
    const edges = graphData.edges;
    const pos = {};
    const width = dimensions.width;
    const height = dimensions.height;

    if (layoutMode === 'dag') {
      // 1. NEAT HIERARCHICAL TIERED DAG LAYOUT
      const inDegreeMap = {};
      const adjMap = {};
      nodes.forEach(n => {
        inDegreeMap[n.id] = 0;
        adjMap[n.id] = [];
      });

      edges.forEach(e => {
        if (adjMap[e.source]) adjMap[e.source].push(e.target);
        inDegreeMap[e.target] = (inDegreeMap[e.target] || 0) + 1;
      });

      // Calculate longest path rank (DAG level)
      const rank = {};
      nodes.forEach(n => { rank[n.id] = 0; });

      // Topological ranking
      const queue = nodes.filter(n => inDegreeMap[n.id] === 0).map(n => n.id);
      while (queue.length > 0) {
        const u = queue.shift();
        const currentRank = rank[u];
        (adjMap[u] || []).forEach(v => {
          rank[v] = Math.max(rank[v] || 0, currentRank + 1);
          queue.push(v);
        });
      }

      // Group into clean horizontal columns (tiers)
      const tiers = {};
      nodes.forEach(n => {
        const r = rank[n.id] || 0;
        if (!tiers[r]) tiers[r] = [];
        tiers[r].push(n);
      });

      const TIER_X_GAP = 230;
      const NODE_Y_GAP = 135;
      const START_X = 130;
      const CENTER_Y = height / 2;

      Object.keys(tiers).forEach(tierKey => {
        const tierIdx = parseInt(tierKey, 10);
        const bucket = tiers[tierKey];
        const tierHeight = (bucket.length - 1) * NODE_Y_GAP;
        const startY = Math.max(CENTER_Y - tierHeight / 2, 90);

        bucket.forEach((node, index) => {
          pos[node.id] = {
            x: START_X + tierIdx * TIER_X_GAP,
            y: startY + index * NODE_Y_GAP,
            radius: 34,
            tier: tierIdx
          };
        });
      });

    } else {
      // 2. NEAT RADIAL CONSTELLATION ORBIT LAYOUT
      const centerX = width / 2;
      const centerY = height / 2;
      const focalId = activeSubgraph.targetNode?.id || selectedNodeId || nodes[0]?.id;

      pos[focalId] = {
        x: centerX,
        y: centerY,
        radius: 40,
        isFocal: true
      };

      const upstream = nodes.filter(n => activeSubgraph.prereqIds.has(n.id));
      const downstream = nodes.filter(n => activeSubgraph.dependentIds.has(n.id));
      const others = nodes.filter(n => n.id !== focalId && !upstream.some(u => u.id === n.id) && !downstream.some(d => d.id === n.id));

      // Inner Orbit: Prerequisites (Left arc)
      const r1 = Math.min(width, height) * 0.28;
      upstream.forEach((n, idx) => {
        const angle = upstream.length === 1 ? Math.PI : Math.PI * 0.6 + (idx / Math.max(upstream.length - 1, 1)) * (Math.PI * 0.8);
        pos[n.id] = {
          x: centerX + Math.cos(angle) * r1,
          y: centerY + Math.sin(angle) * r1,
          radius: 32
        };
      });

      // Middle Orbit: Downstream Dependents (Right arc)
      const r2 = Math.min(width, height) * 0.38;
      downstream.forEach((n, idx) => {
        const angle = downstream.length === 1 ? 0 : -Math.PI * 0.35 + (idx / Math.max(downstream.length - 1, 1)) * (Math.PI * 0.7);
        pos[n.id] = {
          x: centerX + Math.cos(angle) * r2,
          y: centerY + Math.sin(angle) * r2,
          radius: 32
        };
      });

      // Outer Orbit: Others
      const r3 = Math.min(width, height) * 0.46;
      others.forEach((n, idx) => {
        const angle = (idx / Math.max(others.length, 1)) * (Math.PI * 2) - Math.PI / 2;
        pos[n.id] = {
          x: centerX + Math.cos(angle) * r3,
          y: centerY + Math.sin(angle) * r3,
          radius: 30
        };
      });
    }

    setNodePositions(pos);

    // Initialize clean animated flow particles
    const newParticles = [];
    edges.forEach((edge) => {
      for (let i = 0; i < 2; i++) {
        newParticles.push({
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.003
        });
      }
    });
    particlesRef.current = newParticles;

  }, [graphData, layoutMode, dimensions]);

  // Center on canvas view
  const handleFitView = () => {
    setZoom(0.92);
    setPan({ x: 70, y: 30 });
  };

  const handleFocusNode = (nodeId) => {
    const p = nodePositions[nodeId];
    if (p) {
      setPan({
        x: dimensions.width / 2 - p.x * zoom,
        y: dimensions.height / 2 - p.y * zoom
      });
    }
  };

  const handleSelectAndFocus = (nodeId, queryTitle) => {
    if (queryTitle) setSearchQuery(queryTitle);
    if (onSelectNode) onSelectNode(nodeId);
    handleFocusNode(nodeId);
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = async (explicitQuery) => {
    const rawQ = (explicitQuery !== undefined ? explicitQuery : searchQuery).trim();
    if (!rawQ) return;
    const q = rawQ.toLowerCase();

    // 1. Check exact match in current active course graph
    const match = graphData?.nodes?.find(n => {
      const nTitle = (n.title || '').toLowerCase();
      const nCode = (n.code || '').toLowerCase();
      return nTitle === q || nTitle.startsWith(q) || nCode === q;
    });

    if (match) {
      handleSelectAndFocus(match.id, match.title);
      setIsDropdownOpen(false);
      return;
    }

    // 2. Check if another existing course matches this topic strictly
    const matchedCourse = courses.find(c => {
      const cTitle = (c.title || '').toLowerCase();
      const cCode = (c.code || '').toLowerCase();
      return c.id !== selectedCourseId && (
        cTitle === q || cTitle.startsWith(q) || cCode === q
      );
    });

    if (matchedCourse && onSelectCourse) {
      setSearchQuery('');
      setIsDropdownOpen(false);
      onSelectCourse(matchedCourse.id);
      return;
    }

    // 3. If topic does not exist in any loaded course, generate & load the Concept Dependency Map with AI!
    if (onSearchOrGenerateTopic) {
      setSearchQuery('');
      setIsDropdownOpen(false);
      await onSearchOrGenerateTopic(rawQ);
    }
  };

  const handlePresetClick = (preset) => {
    setSearchQuery(preset.query);
    if (preset.nodeId) {
      handleSelectAndFocus(preset.nodeId, preset.query);
    } else {
      handleSearchSubmit(preset.query);
    }
  };

  // Main Canvas Render Loop (High-DPI Retina Crisp Vector Graphics + Animated Particles)
  useEffect(() => {
    let animationId;
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width;
    const height = dimensions.height;

    // Crisp high-DPI scaling
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Apply Pan & Zoom Viewport
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Sleek Modern Background Grid
      const gridSize = 46;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = -width * 2; x < width * 4; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -height * 2);
        ctx.lineTo(x, height * 4);
        ctx.stroke();
      }
      for (let y = -height * 2; y < height * 4; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-width * 2, y);
        ctx.lineTo(width * 4, y);
        ctx.stroke();
      }

      // 2. Draw DAG Tier Column Headers if in DAG Mode
      if (layoutMode === 'dag') {
        const tierNames = [
          'TIER 0: FOUNDATIONS',
          'TIER 1: CORE MECHANICS',
          'TIER 2: BACKPROPAGATION',
          'TIER 3: VISION & ATTENTION',
          'TIER 4: SOTA / TRANSFORMERS'
        ];
        tierNames.forEach((name, tIdx) => {
          const tierX = 130 + tIdx * 230;
          ctx.font = 'bold 10px Outfit, sans-serif';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.textAlign = 'center';
          ctx.fillText(name, tierX, 36);

          // Subtle vertical divider guide
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
          ctx.beginPath();
          ctx.moveTo(tierX + 115, 20);
          ctx.lineTo(tierX + 115, height + 400);
          ctx.stroke();
        });
      }

      const { nodes, edges } = graphData;
      const nodeMap = {};
      nodes.forEach(n => { nodeMap[n.id] = n; });

      const hasSearch = searchQuery.trim().length > 0;
      const hasCategoryFilter = activeCategory !== 'ALL';
      const hasStatusFilter = activeStatusFilter !== 'ALL';

      // 3. Draw Directed Dependency Edges (Smooth Bezier Vectors)
      edges.forEach(edge => {
        const srcPos = nodePositions[edge.source];
        const tgtPos = nodePositions[edge.target];
        if (!srcPos || !tgtPos) return;

        const isEdgeConnectedToSelected = (selectedNodeId === edge.source || selectedNodeId === edge.target);
        const isEdgeConnectedToHovered = (hoveredNodeId === edge.source || hoveredNodeId === edge.target);
        const isSearchActive = hasSearch && (activeSubgraph.allActiveIds.has(edge.source) && activeSubgraph.allActiveIds.has(edge.target));

        let strokeColor = 'rgba(100, 116, 139, 0.25)';
        let lineWidth = 1.6;
        let glow = false;

        if (isSearchActive) {
          strokeColor = '#38bdf8';
          lineWidth = 3.0;
          glow = true;
        } else if (isEdgeConnectedToSelected) {
          strokeColor = selectedNodeId === edge.source ? '#06b6d4' : '#818cf8';
          lineWidth = 2.8;
          glow = true;
        } else if (isEdgeConnectedToHovered) {
          strokeColor = '#f59e0b';
          lineWidth = 2.4;
          glow = true;
        } else if (nodeMap[edge.source]?.status === 'MASTERED') {
          strokeColor = 'rgba(16, 185, 129, 0.5)';
          lineWidth = 2.0;
        }

        ctx.save();
        ctx.beginPath();
        const dx = tgtPos.x - srcPos.x;

        // Smooth cubic control points for clean flowing curves
        const ctrlX1 = srcPos.x + dx * 0.45;
        const ctrlY1 = srcPos.y;
        const ctrlX2 = tgtPos.x - dx * 0.45;
        const ctrlY2 = tgtPos.y;

        ctx.moveTo(srcPos.x, srcPos.y);
        ctx.bezierCurveTo(ctrlX1, ctrlY1, ctrlX2, ctrlY2, tgtPos.x, tgtPos.y);

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;

        if (glow) {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = 10;
        }
        ctx.stroke();

        // Directional Arrowhead at target perimeter
        const targetRadius = tgtPos.radius || 34;
        const angle = Math.atan2(tgtPos.y - ctrlY2, tgtPos.x - ctrlX2);
        const arrowLen = 9;
        const arrowX = tgtPos.x - Math.cos(angle) * targetRadius;
        const arrowY = tgtPos.y - Math.sin(angle) * targetRadius;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = strokeColor;
        ctx.fill();

        ctx.restore();
      });

      // 4. Draw Animated Flow Particles
      particlesRef.current.forEach(p => {
        const srcPos = nodePositions[p.source];
        const tgtPos = nodePositions[p.target];
        if (!srcPos || !tgtPos) return;

        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const t = p.progress;
        const dx = tgtPos.x - srcPos.x;
        const ctrlX1 = srcPos.x + dx * 0.45;
        const ctrlY1 = srcPos.y;
        const ctrlX2 = tgtPos.x - dx * 0.45;
        const ctrlY2 = tgtPos.y;

        // Bezier position interpolation
        const px = Math.pow(1 - t, 3) * srcPos.x +
                   3 * Math.pow(1 - t, 2) * t * ctrlX1 +
                   3 * (1 - t) * Math.pow(t, 2) * ctrlX2 +
                   Math.pow(t, 3) * tgtPos.x;
        const py = Math.pow(1 - t, 3) * srcPos.y +
                   3 * Math.pow(1 - t, 2) * t * ctrlY1 +
                   3 * (1 - t) * Math.pow(t, 2) * ctrlY2 +
                   Math.pow(t, 3) * tgtPos.y;

        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = (selectedNodeId === p.source || selectedNodeId === p.target) ? '#38bdf8' : '#818cf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 5;
        ctx.fill();
      });

      // 5. Draw Concept Nodes (Crisp Geometric Badges with Status Rings)
      nodes.forEach(node => {
        const pos = nodePositions[node.id];
        if (!pos) return;

        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const hasSearchMatches = activeSubgraph.matchIds.size > 0;
        const isSearchMatch = hasSearch && activeSubgraph.matchIds.has(node.id);
        const isSearchActive = hasSearch && activeSubgraph.allActiveIds.has(node.id);

        const matchesCategory = !hasCategoryFilter || node.category === activeCategory;
        const matchesStatus = !hasStatusFilter || node.status === activeStatusFilter;
        const isDimmed = (!matchesCategory) || (!matchesStatus);

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.45 : 1.0;

        const radius = isHovered ? 34 : (isSelected ? 33 : 31);

        // Status Colors & Themes (Simple, Neat, Harmonious)
        let strokeColor = '#475569';
        let fillColor = '#0f172a';
        let glowColor = 'rgba(71, 85, 105, 0.2)';
        let statusBadgeText = 'LOCKED';
        let statusColor = '#94a3b8';
        let iconSymbol = '🔒';

        if (node.status === 'MASTERED') {
          strokeColor = '#10b981';
          fillColor = '#062d22';
          glowColor = 'rgba(16, 185, 129, 0.35)';
          statusBadgeText = 'MASTERED';
          statusColor = '#34d399';
          iconSymbol = '✓';
        } else if (node.status === 'READY') {
          strokeColor = '#f59e0b';
          fillColor = '#2d1b06';
          glowColor = 'rgba(245, 158, 11, 0.4)';
          statusBadgeText = 'READY';
          statusColor = '#fbbf24';
          iconSymbol = '⚡';
        } else if (node.status === 'IN_PROGRESS') {
          strokeColor = '#0ea5e9';
          fillColor = '#08253a';
          glowColor = 'rgba(14, 165, 233, 0.35)';
          statusBadgeText = 'LEARNING';
          statusColor = '#38bdf8';
          iconSymbol = '▶';
        } else if (node.status === 'NEEDS_REMEDIATION') {
          strokeColor = '#ef4444';
          fillColor = '#2d0a0a';
          glowColor = 'rgba(239, 68, 68, 0.4)';
          statusBadgeText = 'GAPS';
          statusColor = '#f87171';
          iconSymbol = '⚠️';
        }

        // 1. Subtle Outer Glow (Selected / Ready / Hovered)
        if (isSelected || isHovered || node.status === 'READY' || isSearchMatch) {
          ctx.beginPath();
          const haloRadius = radius + (isSelected ? 6 : (node.status === 'READY' ? 4 : 3));
          ctx.arc(pos.x, pos.y, haloRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = isSelected ? 16 : (node.status === 'READY' ? 12 : 6);
          ctx.fill();
        }

        // 2. Clean Circle Body
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.shadowBlur = 0;
        ctx.fill();

        // 3. Perimeter Border
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? '#ffffff' : strokeColor;
        ctx.lineWidth = isSelected ? 2.8 : 2.0;
        ctx.stroke();

        // 4. Clean Mastery Progress Arc (Outer Ring)
        if (node.mastery_score > 0) {
          ctx.beginPath();
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (Math.PI * 2 * node.mastery_score);
          ctx.arc(pos.x, pos.y, radius, startAngle, endAngle);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3.0;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.lineCap = 'butt';
        }

        // 5. Centered Typography & Icon Inside Circle
        // Status Icon at Top-Center
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconSymbol, pos.x, pos.y - 11);

        // Concept Code (e.g. DL-01) at Center
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11.5px Outfit, sans-serif';
        ctx.fillText(node.code, pos.x, pos.y + 2);

        // Mastery Score at Bottom-Center
        ctx.fillStyle = statusColor;
        ctx.font = '600 8.5px Inter, sans-serif';
        ctx.fillText(`${Math.round(node.mastery_score * 100)}%`, pos.x, pos.y + 14);

        // 6. Top Bloom Level Pill (Neat & Compact)
        ctx.font = 'bold 8px Inter, sans-serif';
        const pillText = (node.bloom_level || statusBadgeText).toUpperCase();
        const textMetrics = ctx.measureText(pillText);
        const pillW = textMetrics.width + 10;
        const pillY = pos.y - radius - 10;

        ctx.beginPath();
        ctx.roundRect(pos.x - pillW / 2, pillY - 6, pillW, 12, 4);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = statusColor;
        ctx.fillText(pillText, pos.x, pillY);

        // 7. Neat Title Card Underneath
        const titleStr = node.title.length > 22 ? node.title.substring(0, 20) + '...' : node.title;
        ctx.font = isSelected ? 'bold 10.5px Inter, sans-serif' : '500 9.5px Inter, sans-serif';
        const titleWidth = ctx.measureText(titleStr).width;
        const titleY = pos.y + radius + 14;

        ctx.beginPath();
        ctx.roundRect(pos.x - titleWidth / 2 - 6, titleY - 7, titleWidth + 12, 15, 5);
        ctx.fillStyle = isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.88)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(titleStr, pos.x, titleY);

        ctx.restore();
      });

      ctx.restore();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [graphData, nodePositions, zoom, pan, selectedNodeId, hoveredNodeId, activeSubgraph, dimensions, layoutMode, activeCategory, activeStatusFilter]);

  // Mouse Interactivity
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const transformedX = (mouseX - pan.x) / zoom;
    const transformedY = (mouseY - pan.y) / zoom;

    let clickedId = null;
    if (graphData?.nodes) {
      for (const node of graphData.nodes) {
        const pos = nodePositions[node.id];
        if (pos) {
          const dist = Math.hypot(pos.x - transformedX, pos.y - transformedY);
          if (dist <= (pos.radius || 34)) {
            clickedId = node.id;
            break;
          }
        }
      }
    }

    if (clickedId !== null) {
      if (onSelectNode) onSelectNode(clickedId);
      setDraggedNodeId(clickedId);
    } else {
      setIsDragging(true);
      setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const transformedX = (mouseX - pan.x) / zoom;
    const transformedY = (mouseY - pan.y) / zoom;

    if (isDragging) {
      setPan({ x: mouseX - dragStart.x, y: mouseY - dragStart.y });
      return;
    }

    if (draggedNodeId !== null) {
      setNodePositions(prev => ({
        ...prev,
        [draggedNodeId]: { ...prev[draggedNodeId], x: transformedX, y: transformedY }
      }));
      return;
    }

    // Check hover
    let hovered = null;
    if (graphData?.nodes) {
      for (const node of graphData.nodes) {
        const pos = nodePositions[node.id];
        if (pos) {
          const dist = Math.hypot(pos.x - transformedX, pos.y - transformedY);
          if (dist <= (pos.radius || 34)) {
            hovered = node.id;
            break;
          }
        }
      }
    }
    setHoveredNodeId(hovered);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.35), 2.2));
  };

  // Selected Node Details for Floating Quick Inspection HUD
  const inspectedNode = useMemo(() => {
    if (!graphData?.nodes) return null;
    const targetId = hoveredNodeId || selectedNodeId;
    return graphData.nodes.find(n => n.id === targetId) || null;
  }, [graphData, hoveredNodeId, selectedNodeId]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '680px', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-subtle)', 
        background: 'linear-gradient(180deg, #070b16 0%, #0a0f1d 100%)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}
    >
      
      {/* 🔍 TOP CONTROLS & SEARCH BAR */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', pointerEvents: 'auto' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '440px' }}>
            <div 
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-glow)',
                background: 'rgba(15, 23, 42, 0.94)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              <Search 
                size={16} 
                color="#38bdf8" 
                style={{ marginRight: '8px', flexShrink: 0, cursor: 'pointer' }} 
                onClick={() => handleSearchSubmit()}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search concept, prerequisite, or topic (Press Enter)..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 500
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Autocomplete Search Dropdown */}
            {isDropdownOpen && searchQuery.trim() && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '6px',
                  background: 'rgba(15, 23, 42, 0.98)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '12px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  zIndex: 40,
                  boxShadow: '0 12px 35px rgba(0,0,0,0.7)'
                }}
              >
                {/* Current Course Matches */}
                {graphData?.nodes?.filter(n => 
                  (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (n.code && n.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (n.category && n.category.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map(node => (
                  <div
                    key={node.id}
                    onClick={() => handleSelectAndFocus(node.id, node.title)}
                    style={{
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        {node.code}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>{node.title}</div>
                        <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{node.category}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>{Math.round(node.mastery_score * 100)}%</span>
                  </div>
                ))}

                {/* Direct Action: Generate / Open Concept Map with AI */}
                {searchQuery.trim() && (
                  <div
                    onClick={() => {
                      const q = searchQuery;
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                      if (onSearchOrGenerateTopic) {
                        onSearchOrGenerateTopic(q);
                      }
                    }}
                    style={{
                      padding: '10px 14px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(6, 182, 212, 0.4) 100%)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)'}
                  >
                    <Sparkles size={16} color="#38bdf8" />
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 700 }}>
                        ✨ Generate & Open Concept Map for "{searchQuery}"
                      </div>
                      <div style={{ fontSize: '0.70rem', color: '#cbd5e1' }}>
                        Builds full Directed Acyclic Graph & prerequisite map in real-time
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Matching Courses */}
                {courses && courses.filter(c => c.id !== selectedCourseId && c.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                  <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Existing Course Maps:
                    </div>
                    {courses.filter(c => c.id !== selectedCourseId && c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (onSelectCourse) onSelectCourse(c.id);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: '#e2e8f0',
                          fontSize: '0.80rem',
                          fontWeight: 600
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>📚 {c.title}</span>
                        <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Switch Map →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Layout Mode Toggle */}
          <div 
            className="glass-panel"
            style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.92)',
              gap: '4px'
            }}
          >
            <button
              onClick={() => setLayoutMode('dag')}
              className="btn-secondary"
              style={{
                padding: '6px 11px',
                fontSize: '0.78rem',
                border: 'none',
                background: layoutMode === 'dag' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
                color: layoutMode === 'dag' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700
              }}
              title="Hierarchical Topological Tier Flow"
            >
              <Network size={14} />
              <span>Hierarchical Flow</span>
            </button>
            <button
              onClick={() => setLayoutMode('radial')}
              className="btn-secondary"
              style={{
                padding: '6px 11px',
                fontSize: '0.78rem',
                border: 'none',
                background: layoutMode === 'radial' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'transparent',
                color: layoutMode === 'radial' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700
              }}
              title="Radial Orbit Constellation"
            >
              <CircleDot size={14} />
              <span>Radial Orbit</span>
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <div className="glass-panel" style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.92)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="#94a3b8" />
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              style={{
                background: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat} style={{ background: '#0f172a' }}>{cat === 'ALL' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="glass-panel" style={{ padding: '3px 8px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.92)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={13} color="#fbbf24" />
            <select
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
              style={{
                background: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL" style={{ background: '#0f172a' }}>All Statuses</option>
              <option value="READY" style={{ background: '#0f172a' }}>⚡ Ready to Learn</option>
              <option value="MASTERED" style={{ background: '#0f172a' }}>✓ Mastered</option>
              <option value="IN_PROGRESS" style={{ background: '#0f172a' }}>▶ In Progress</option>
              <option value="LOCKED" style={{ background: '#0f172a' }}>🔒 Locked</option>
            </select>
          </div>

        </div>

        {/* Quick Topic Preset Chips */}
        {topicPresets.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', pointerEvents: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Quick Topics:
            </span>
            {topicPresets.map(preset => (
              <button
                key={preset.query}
                onClick={() => handlePresetClick(preset)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: searchQuery.toLowerCase() === preset.query.toLowerCase() ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  background: searchQuery.toLowerCase() === preset.query.toLowerCase() ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                  color: searchQuery.toLowerCase() === preset.query.toLowerCase() ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}



      </div>

      {/* 🔮 AI TOPIC MAP GENERATION OVERLAY */}
      {isGeneratingTopic && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 11, 22, 0.90)',
          backdropFilter: 'blur(12px)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
            boxShadow: '0 0 35px rgba(99, 102, 241, 0.6)',
            animation: 'pulse 1.6s infinite'
          }}>
            <Sparkles size={34} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Generating Concept Dependency Map
          </h3>
          <div style={{ fontSize: '1.05rem', color: '#38bdf8', fontWeight: 700, marginBottom: '12px' }}>
            "{generatingTopicName || searchQuery}"
          </div>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', maxWidth: '460px', lineHeight: 1.6 }}>
            Synthesizing foundational prerequisites, topological DAG ordering, Bloom taxonomy tiers, and diagnostic micro-quizzes...
          </p>
        </div>
      )}

      {/* 🎨 MAIN CANVAS ELEMENT */}
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          cursor: isDragging ? 'grabbing' : (hoveredNodeId ? 'pointer' : 'grab'),
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* 🧭 FLOATING QUICK INSPECTOR HOVER CARD */}
      {inspectedNode && (
        <div 
          className="glass-panel animate-scale-up"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            maxWidth: '380px',
            background: 'rgba(15, 23, 42, 0.96)',
            borderRadius: '16px',
            border: `1px solid ${inspectedNode.status === 'MASTERED' ? '#10b981' : (inspectedNode.status === 'READY' ? '#f59e0b' : 'rgba(99, 102, 241, 0.4)')}`,
            padding: '14px 16px',
            zIndex: 25,
            boxShadow: '0 16px 36px rgba(0,0,0,0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                {inspectedNode.code}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {inspectedNode.category} • Bloom: {inspectedNode.bloom_level}
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: inspectedNode.status === 'MASTERED' ? 'rgba(16, 185, 129, 0.2)' : (inspectedNode.status === 'READY' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)'),
              color: inspectedNode.status === 'MASTERED' ? '#34d399' : (inspectedNode.status === 'READY' ? '#fbbf24' : '#94a3b8')
            }}>
              {inspectedNode.status} ({Math.round(inspectedNode.mastery_score * 100)}%)
            </span>
          </div>

          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
            {inspectedNode.title}
          </div>

          <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.35, marginBottom: '10px' }}>
            {inspectedNode.description}
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onStartQuiz && onStartQuiz(inspectedNode.id)}
              className="btn-accent-glow"
              style={{ padding: '7px 14px', fontSize: '0.80rem', fontWeight: 800, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PlayCircle size={14} />
              <span>📖 Learn Every Point & Take 20-Q Quiz</span>
            </button>

            <button
              onClick={() => onAskAITutor && onAskAITutor(inspectedNode.id, inspectedNode.title)}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Sparkles size={13} color="#06b6d4" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Canvas View Controls */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '6px', zIndex: 20 }}>
        <button
          onClick={() => setZoom(prev => Math.min(prev * 1.15, 2.2))}
          className="btn-secondary"
          title="Zoom In"
          style={{ padding: '8px 10px', background: 'rgba(15, 23, 42, 0.9)' }}
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev * 0.85, 0.35))}
          className="btn-secondary"
          title="Zoom Out"
          style={{ padding: '8px 10px', background: 'rgba(15, 23, 42, 0.9)' }}
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={handleFitView}
          className="btn-secondary"
          title="Fit to View"
          style={{ padding: '8px 10px', background: 'rgba(15, 23, 42, 0.9)' }}
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Status Legend */}
      <div className="glass-panel" style={{ position: 'absolute', bottom: '16px', right: '150px', padding: '6px 12px', fontSize: '0.72rem', zIndex: 15, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <span>Mastered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }}></span>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>Ready</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }}></span>
          <span>In Progress</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b' }}></span>
          <span>Locked</span>
        </div>
      </div>

    </div>
  );
}
