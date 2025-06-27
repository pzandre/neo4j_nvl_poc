import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import NVL, { Node, Relationship } from "@neo4j-nvl/base";
import { connect } from "./connections";
import { styleGraph } from "./styling";

const COLOR_MAP_TO_TYPE: Record<string, string> = {
  "blue": "Publication",
  "green": "Year", 
  "orange": "Language",
  "purple": "Author",
  "red": "Publisher"
};

const INITIAL_QUERY_PARAMS = {
  query: "9693",
  parameters: { node_type: "Publication" }
};

export const App = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const nvlRef = useRef<NVL | null>(null);

  const extractId = useCallback((nodeId: string): [string, string] => {
    const parts = nodeId.split("#___#");
    return parts.length > 1 ? [parts[0], parts[1]] : ["", nodeId];
  }, []);

  const expandNode = useCallback(async (node: Node) => {
    const [nodeType, nodeId] = extractId(node.id);
    if (!nodeType || !nodeId || expandedNodes.has(node.id) || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await connect({
        query: nodeId,
        parameters: { node_type: nodeType }
      });

      if (!result) return;

      // Get current node position for expansion positioning
      const currentPositions = nvlRef.current?.getNodePositions() || [];
      const expandingNodePos = currentPositions.find(pos => pos.id === node.id);
      
      const { styledNodes, styledRelationships, positions } = styleGraph(
        result, 
        expandingNodePos, 
        currentPositions
      );

      // Apply positions to new nodes with a slight delay for smoother animation
      if (positions.length > 0 && nvlRef.current) {
        setTimeout(() => {
          nvlRef.current?.setNodePositions(positions, true); // Enable animation
        }, 50);
      }

      setNodes(prevNodes => {
        const existingNodeIds = new Set(prevNodes.map(n => n.id));
        const newNodes = styledNodes.filter((node: Node) => !existingNodeIds.has(node.id));
        return [...prevNodes, ...newNodes];
      });

      setRelationships(prevRels => {
        const existingRelIds = new Set(prevRels.map(r => r.id));
        const newRels = styledRelationships.filter((rel: Relationship) => !existingRelIds.has(rel.id));
        return [...prevRels, ...newRels];
      });

      setExpandedNodes(prev => new Set([...prev, node.id]));

      // Mark node as activated
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === node.id ? { ...n, activated: true } : n
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error expanding node";
      console.error("Error expanding node:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [extractId, expandedNodes, isLoading]);

  const mouseEventCallbacks = useMemo(() => ({
    onZoom(zoomLevel: number) {
      if (isLoading) return;
      nvlRef.current?.setZoom(zoomLevel);
    },
    onNodeDoubleClick: expandNode,
    onDrag(draggedNodes: Node[]) {
      // Allow fluid dragging with animation
      nvlRef.current?.setNodePositions(draggedNodes, true);
    },
    onCanvasRightClick: (evt: Event) => {
      evt.preventDefault();
      nvlRef.current?.resetZoom();
    },
    onPan: (coordinates: { x: number; y: number }) => {
      if (isLoading) return;
      nvlRef.current?.setPan(coordinates.x, coordinates.y);
    }
  }), [expandNode, isLoading]);

  const legendItems = useMemo(() => 
    Object.entries(COLOR_MAP_TO_TYPE).map(([color, type]) => (
      <div key={color} style={{ 
        display: "flex", 
        alignItems: "center", 
        marginTop: "5px" 
      }}>
        <div style={{
          width: "12px",
          height: "12px",
          backgroundColor: color,
          borderRadius: "50%",
          marginRight: "8px"
        }}></div>
        <span>{type}</span>
      </div>
    )), []
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await connect(INITIAL_QUERY_PARAMS);
        if (!result) return;
        
        const { styledNodes, styledRelationships, positions } = styleGraph(result);
        setNodes(styledNodes);
        setRelationships(styledRelationships);
        
        // Apply initial positions with animation for smoother appearance
        if (positions.length > 0) {
          setTimeout(() => {
            nvlRef.current?.setNodePositions(positions, true);
          }, 100);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load initial data";
        console.error("Error loading initial data:", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "95vh",
        background: "linear-gradient(to right, white, lightgrey)",
        position: "relative"
      }}
    >
      <InteractiveNvlWrapper
        ref={nvlRef}
        nodes={nodes}
        rels={relationships}
        mouseEventCallbacks={mouseEventCallbacks}
      />
      
      {/* Error indicator */}
      {error && (
        <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(220, 53, 69, 0.9)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "5px",
          fontSize: "14px",
          maxWidth: "300px"
        }}>
          Error: {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: "absolute",
          top: error ? "70px" : "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "5px",
          fontSize: "14px"
        }}>
          {nodes.length === 0 ? "Loading graph..." : "Expanding graph..."}
        </div>
      )}
      
      {/* Instructions */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        background: "rgba(255, 255, 255, 0.9)",
        padding: "10px 15px",
        borderRadius: "5px",
        fontSize: "12px",
        maxWidth: "250px"
      }}>
        <strong>Instructions:</strong><br/>
        • Double-click Publication nodes (blue) to expand<br/>
        • Right-click canvas to reset zoom<br/>
        • Drag to reposition nodes<br/>
        • Drag canvas to pan around<br/>          
      </div>
      
      {/* Legend/Caption */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        background: "rgba(255, 255, 255, 0.9)",
        padding: "15px",
        borderRadius: "5px",
        fontSize: "12px",
        minWidth: "150px"
      }}>
        <strong>Node Types:</strong><br/>
        {legendItems}
      </div>
    </div>
  );
};