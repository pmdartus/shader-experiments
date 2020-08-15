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
import builtinNodes from "../../core/builtin-nodes";

function createGraph(): graph.Graph {
  const instance = new graph.Graph();

  for (const builtin of builtinNodes) {
    instance.register(builtin.label, builtin.node);
  }

  const uniform = instance.createNode("Uniform Color");
  uniform.setPosition([0, 75]);

  const albedo = instance.createNode("Output");
  albedo.setPosition([200, 0]);

  const normal = instance.createNode("Output");
  normal.setPosition([200, 150]);

  instance.connect({
    from: uniform.getOutput("output")!,
    to: albedo.getInput("input")!,
  });

  instance.connect({
    from: uniform.getOutput("output")!,
    to: normal.getInput("input")!,
  });

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
