import React, { useState, useEffect } from "react";

import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  View,
  Flex,
} from "@adobe/react-spectrum";

import * as graph from "../../core/graph";
import * as definitions from "../../core/shaders";

import GraphNode from "./GraphNode";

// import { WorkerProxy } from "../../core/woker-proxy";
// const WORKFLOW_SIZE = 512;
// const handleAddShader = (name: keyof typeof definitions) => {
//   const worker = new WorkerProxy();

//   const definition = definitions[name];

//   worker
//     .compileShader({
//       name: definition.name,
//       src: definition.shader,
//       uniforms: Object.keys(definition.properties).map((prop) => `u_${prop}`),
//     })
//     .then((res) => {
//       return worker.runShader({
//         id: res.id,
//         size: WORKFLOW_SIZE,
//         uniforms: {
//           u_tiling: {
//             type: "integer",
//             value: 2,
//           },
//         },
//       });
//     })
//     .then((res) => {
//       const imageData = new ImageData(
//         new Uint8ClampedArray(res.result),
//         WORKFLOW_SIZE
//       );

//       const canvas = canvasRef.current!;
//       canvas.width = WORKFLOW_SIZE;
//       canvas.height = WORKFLOW_SIZE;

//       const ctx = canvas.getContext("2d")!;
//       ctx.putImageData(imageData, 0, 0);
//     });
// };

function createGraph(): graph.Graph {
  const instance = new graph.Graph();

  instance.register(
    "test",
    class extends graph.GraphNode {
      constructor(config: { graph: graph.Graph }) {
        super({
          graph: config.graph,
          title: "test",
        });
      }
    }
  );

  return instance;
}

export default function NodeEditor() {
  const [graph] = useState(createGraph);
  const [nodes, setNodes] = useState(graph.nodes);

  useEffect(() => {
    const handleNodeChanged = () => {
      setNodes([...graph.nodes]);
    };

    graph.addEventListener("nodecreated", handleNodeChanged);

    return () => {
      graph.removeEventListener("nodecreated", handleNodeChanged);
    };
  }, [graph]);

  const handleAddNode = (name: string) => {
    graph.createNode(name);
  };

  const handleNodeClick = () => {
    console.log("TODO: Click");
  };

  const handleNodeDoubleClick = () => {
    console.log("TODO: Double Click");
  };

  return (
    <Flex height="100%" direction="column">
      <View padding="size-50" borderColor="gray-700" borderBottomWidth="thin">
        <MenuTrigger>
          <ActionButton>Add Node</ActionButton>
          <Menu onAction={(key) => handleAddNode(key as string)}>
            {[...graph.registry.keys()].map((name) => (
              <Item key={name}>{name}</Item>
            ))}
          </Menu>
        </MenuTrigger>
      </View>

      <View flex="1" position="relative" overflow="hidden">
        {nodes.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            selected={true}
            handleClick={handleNodeClick}
            handleDoubleClick={handleNodeDoubleClick}
          />
        ))}
      </View>
    </Flex>
  );
}
