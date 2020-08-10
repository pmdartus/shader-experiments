import * as React from "react";
import { useRef, useEffect } from "react";

import { View, Flex } from "@adobe/react-spectrum";

import * as graph from "../../core/graph";

const CLICK_PROCESSING_DELAY = 200;
const NODE_STYLE: React.CSSProperties = {
  position: "absolute",
  width: "50px",
  height: "50px",
};

function getCssTransform(x: number, y: number): string {
  return `translate(${x}px, ${y}px)`;
}

export default function GraphNode(props: {
  node: graph.GraphNode;
  selected: boolean;
  handleClick: (evt: MouseEvent) => void;
  handleDoubleClick: (evt: MouseEvent) => void;
}) {
  const { node, selected, handleClick, handleDoubleClick } = props;
  const viewRef = useRef<any>(null);

  useEffect(() => {
    const view = viewRef.current;

    if (view === null) {
      return;
    }

    const elm = view.UNSAFE_getDOMNode();
    const originalPosition = node.position;

    let clickTimeout: unknown = null;
    let lastClickEvent: MouseEvent;

    let isDragging = false;
    let updatedPosition = originalPosition;

    const handleNodeClick = (evt: MouseEvent) => {
      // Ignore click events whenever the node is being dragged. By default the click event is fire
      // after each mousedown mouseup cycle.
      if (isDragging === true) {
        return;
      }

      lastClickEvent = evt;
      if (clickTimeout !== null) {
        return;
      }

      clickTimeout = setTimeout(() => {
        clickTimeout = null;

        const clickCount = lastClickEvent.detail;
        if (clickCount === 1) {
          handleClick(lastClickEvent);
        } else if (clickCount >= 2) {
          handleDoubleClick(lastClickEvent);
        }
      }, CLICK_PROCESSING_DELAY);
    };

    const handleNodeMouseDown = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();

      window.addEventListener("mousemove", handleWindowMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
    };

    const handleWindowMouseMove = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();

      isDragging = true;

      const { movementX, movementY } = evt;
      updatedPosition[0] += movementX;
      updatedPosition[1] += movementY;

      elm.style.transform = getCssTransform(
        updatedPosition[0],
        updatedPosition[1]
      );
    };

    const handleWindowMouseUp = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();

      node.setPosition(updatedPosition);

      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);

      // The dragging state is reset in a timeout otherwise the click event will be fired after the
      // mouseup event.
      setTimeout(() => {
        isDragging = false;
      });
    };

    elm.addEventListener("click", handleNodeClick);
    elm.addEventListener("mousedown", handleNodeMouseDown);

    return () => {
      elm.removeEventListener("click", handleNodeClick);
      elm.removeEventListener("mousedown", handleNodeMouseDown);
    };
  }, [node, handleClick, handleDoubleClick]);

  return (
    <View
      width="size-1250"
      minHeight="size-1250"
      borderColor={selected ? "gray-800" : "gray-50"}
      borderWidth="thicker"
      borderRadius="small"
      ref={viewRef}
      UNSAFE_style={{
        ...NODE_STYLE,
        transform: getCssTransform(node.position[0], node.position[1]),
      }}
    >
      <Flex direction="column" height="100%">
        <View
          backgroundColor="red-400"
          padding="size-30"
          UNSAFE_style={{ textAlign: "center" }}
        >
          {node.title}
        </View>
        <View flex="1" backgroundColor="gray-300"></View>
      </Flex>
    </View>
  );
}
