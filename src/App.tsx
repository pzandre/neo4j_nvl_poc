import React, { useEffect, useRef, useState } from "react";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import NVL, { Node, Relationship } from "@neo4j-nvl/base";
import { connect } from "./connections";
import { styleGraph } from "./styling";
import { Modal } from "./Modal";

export const App = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [label, setLabel] = useState<string | null>(null);
  const nvlRef = useRef<NVL | null>(null);

  const clearLabel = () => {
    setLabel(null);
  };

  useEffect(() => {
    connect("call db.schema.visualization()")
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
        }}
      >
        <InteractiveNvlWrapper
          ref={nvlRef}
          nodes={nodes}
          rels={relationships}
          mouseEventCallbacks={{
            onZoom: clearLabel,
            onPan: clearLabel,
            onCanvasClick: clearLabel,
            onNodeClick: (node) => {
              if (node.captions && node.captions.length > 0) {
                nvlRef.current?.fit([node.id]);
                const label = node.captions[0].value;
                label && setLabel(label);
              }
            },
          }}
        />
      </div>
      {label && <Modal label={label} />}
    </>
  );
};
