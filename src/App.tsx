import React, { useEffect, useRef, useState } from "react";
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

export const App = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const nvlRef = useRef<NVL | null>(null);

  const extractId = (nodeId: string): [string, string] => {
    const parts = nodeId.split("#___#");
    return parts.length > 1 ? [parts[0], parts[1]] : ["", nodeId]
  };

  const expandNode = async (node: Node) => {
    const [nodeType, nodeId] = extractId(node.id);
    if (!nodeType || !nodeId || expandedNodes.has(node.id) || isLoading) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await connect({
        "query": nodeId,
        "parameters": {
          "node_type": nodeType
        }
      });

      if (!result) return;

      const { styledNodes, styledRelationships } = styleGraph(result);

      setNodes(prevNodes => {
        const existingNodeIds = new Set(prevNodes.map(n => n.id));
        const newNodes = result.nodes.filter((node: Node) => !existingNodeIds.has(node.id));
        return [...prevNodes, ...newNodes];
      });

      setRelationships(prevRels => {
        const existingRelIds = new Set(prevRels.map(r => r.id));
        const newRels = styledRelationships.filter((rel: Relationship) => !existingRelIds.has(rel.id));
        return [...prevRels, ...newRels];
      });

      setExpandedNodes(prev => new Set([...prev, node.id]));

      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === node.id 
            ? { ...n, activated: true }
            : n
        )
      );

    } catch (err) {
      console.error("Error expanding node:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    connect({
      "query": "9693",
      "parameters": {
        "node_type": "Publication"
      }
    })
      .then((result) => {
        if (!result) return;
        const { styledNodes, styledRelationships } = styleGraph(result);

        setNodes(styledNodes);
        setRelationships(styledRelationships);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
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
          mouseEventCallbacks={{
            onZoom(zoomLevel, event) {
              if (isLoading) return;
              nvlRef.current?.setZoom(zoomLevel);
            },
            onNodeDoubleClick: (node) => {
              expandNode(node);
            },
            onNodeClick: async (node) => {
                const [nodeType, nodeId] = node.id.split("#___#");
                // TODO: Open modal with nodeInfo data
                // check type, if valid ones (like publications or authors) call backend
                // to fetch more data from Postgres DB and Django's Slug
            },
            onCanvasClick: () => {
              nvlRef.current?.resetZoom();
            },
            onDrag(nodes, evt) {
              nvlRef.current?.setNodePositions(nodes, true);
            },
            onCanvasRightClick: (evt) => {
              evt.preventDefault();
              nvlRef.current?.resetZoom();
            },
            onPan: (coordinates, evt) => {
              if (isLoading) return;
              nvlRef.current?.setPan(coordinates.x, coordinates.y);
            }
          }}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "10px 15px",
            borderRadius: "5px",
            fontSize: "14px"
          }}>
            Expanding graph...
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
          • Single-click any node to focus/zoom<br/>
          • Click canvas to reset zoom<br/>
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
          {Object.entries(COLOR_MAP_TO_TYPE).map(([color, type]) => (
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
          ))}
        </div>
      </div>
    </>
  );
};