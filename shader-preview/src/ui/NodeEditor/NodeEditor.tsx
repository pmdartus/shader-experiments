import React, { useState, useEffect, useRef } from "react";

import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  View,
  Flex,
} from "@adobe/react-spectrum";

import * as graph from "../../core/graph";
import GraphEditor from "../../core/GraphEditor";
import * as shaderDefinitions from "../../core/shaders";

function createGraph(): graph.Graph {
  const instance = new graph.Graph();

  for (const definition of Object.values(shaderDefinitions)) {
    const nodeConstructor = class extends graph.GraphNode {
      constructor(config: { graph: graph.Graph }) {
        super({
          graph: config.graph,
          title: definition.label,
        });

        this.createOutput({
          name: "output",
          type: "image",
          value: null,
        });
      }
    };

    instance.register(definition.label, nodeConstructor);
  }

  const node1 = instance.createNode(shaderDefinitions.brick.label);
  node1.setPosition([200, 150]);

  const node2 = instance.createNode(shaderDefinitions.checker.label);
  node2.setPosition([100, 0]);

  return instance;
}

export default function NodeEditor() {
  const [graph] = useState(createGraph);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphEditorRef = useRef<GraphEditor>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    graphEditorRef.current = new GraphEditor(canvas, graph);
  }, [graph]);

  const handleAddNode = (name: string) => {
    graph.createNode(name);
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

      <View flex="1">
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        ></canvas>
      </View>
    </Flex>
  );
}
