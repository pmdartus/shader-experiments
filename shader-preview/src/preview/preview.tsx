import React, { useRef, useState, useEffect } from "react";

import { Flex, View } from "@adobe/react-spectrum";

import { ActionBar } from "./ActionBar";
import { InformationPanel } from "./InformationPanel";
import { getPreviewRenderer, PreviewRenderer } from "./renderer";

import * as m3 from "../utils/m3";
import { Camera, Position, ColorChannel } from "./types";

function getProjectionMatrix(canvas: HTMLCanvasElement): m3.M3 {
  return m3.projection(canvas.width, canvas.height);
}

function getCameraMatrix(camera: Camera): m3.M3 {
  const zoomScale = 1 / camera.zoom;

  let cameraMatrix = m3.identity();
  cameraMatrix = m3.translate(
    cameraMatrix,
    camera.position[0],
    camera.position[1]
  );
  cameraMatrix = m3.scale(cameraMatrix, zoomScale, zoomScale);

  return cameraMatrix;
}

function getViewProjectionMatrix(
  canvas: HTMLCanvasElement,
  camera: Camera
): m3.M3 {
  const projectionMatrix = getProjectionMatrix(canvas);
  const cameraMatrix = getCameraMatrix(camera);

  let viewMatrix = m3.inverse(cameraMatrix);
  viewMatrix = m3.multiply(projectionMatrix, viewMatrix);

  return viewMatrix;
}

function getInitialCamera(
  imageData: ImageData,
  canvas: HTMLCanvasElement
): Camera {
  const position: Position = [canvas.width / 2, canvas.height / 2];
  const zoom = Math.min(
    canvas.width / imageData.width,
    canvas.height / imageData.height
  );

  return {
    position,
    zoom,
  };
}

function Preview(props: { imageData: ImageData | null }) {
  const { imageData } = props;

  const [renderer, setRenderer] = useState<PreviewRenderer | null>(null);
  const [camera, setCamera] = useState<Camera>({
    position: [0, 0],
    zoom: 1,
  });

  const [channels, setChannels] = useState(ColorChannel.RGB);
  const [tiling, setTiling] = useState(false);

  const [mousePosition, setMousePosition] = useState<Position>([0, 0]);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    const renderer = getPreviewRenderer(canvas);
    setRenderer(renderer);
    setCamera({
      position: [0, 0],
      zoom: 1,
    });
  }, []);

  useEffect(() => {
    if (renderer === null || imageData === null) {
      return;
    }

    const matrix = getViewProjectionMatrix(renderer.canvas, camera);
    renderer.update({
      imageData,
      matrix,
      channels,
      tiling,
    });
  }, [renderer, imageData, camera, channels, tiling]);

  // TODO: Remove event listeners from useEffect block.
  // This is currently needed because using JSX to attach the wheel event makes the event passive.
  // However in the case of zoom, we want to make it active to prevent the event default behavior.
  // The side effect is that for each render, React does add new event listeners, which is not ideal
  // for performance.
  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    const canvas = canvasRef.current;

    const handleCanvasMouseMove = (evt: MouseEvent) => {
      const { clientX, clientY } = evt;
      setMousePosition([clientX, clientY]);
    };

    const handleCanvasScroll = (evt: MouseWheelEvent) => {
      evt.preventDefault();

      // https://stackoverflow.com/a/57899935
      // Make zoom change proportionate to the current zoom level.
      const zoom = camera.zoom * Math.pow(2, evt.deltaY * -0.01);

      setCamera({
        ...camera,
        zoom,
      });
    };

    const handleMouseDown = () => {
      window.addEventListener("mousemove", handleDragMouseMove);
      window.addEventListener("mouseup", handleDragMouseUp);
    };

    const handleDragMouseMove = (evt: MouseEvent) => {
      const [x, y] = camera.position;
      const { movementX, movementY } = evt;

      setCamera({
        ...camera,
        position: [x + movementX, y + movementY],
      });
    };

    const handleDragMouseUp = () => {
      window.removeEventListener("mousemove", handleDragMouseMove);
      window.removeEventListener("mouseup", handleDragMouseUp);
    };

    canvas.addEventListener("mousemove", handleCanvasMouseMove);
    canvas.addEventListener("wheel", handleCanvasScroll);
    canvas.addEventListener("mousedown", handleMouseDown);

    return () => {
      canvas.removeEventListener("mousemove", handleCanvasMouseMove);
      canvas.removeEventListener("wheel", handleCanvasScroll);

      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleDragMouseMove);
      window.removeEventListener("mouseup", handleDragMouseUp);
    };
  }, [camera]);

  const handleZoomChange = (zoom: number) => {
    setCamera({
      ...camera,
      zoom,
    });
  };

  const fitToPreview = () => {
    if (imageData && canvasRef.current) {
      const camera = getInitialCamera(imageData, canvasRef.current);
      setCamera(camera);
    } else {
      fitToContent();
    }
  };

  const fitToContent = () => {
    setCamera({
      position: [0, 0],
      zoom: 1,
    });
  };

  return (
    <Flex direction="column" height="100%">
      <View
        padding="size-50"
        borderColor="gray-700"
        borderBottomWidth="thin"
        overflow="hidden"
      >
        <ActionBar
          channels={channels}
          tiling={tiling}
          infoVisible={isInfoVisible}
          zoom={camera.zoom}
          onChannelsChange={setChannels}
          onTilingChange={setTiling}
          onInfoVisibleChange={setIsInfoVisible}
          onZoomChange={handleZoomChange}
          fitToPreview={fitToPreview}
          fitToContent={fitToContent}
        />
      </View>

      <View flex="1" backgroundColor="gray-50" overflow="hidden">
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        ></canvas>
      </View>

      {isInfoVisible &&
        ((
          <View
            padding="size-100"
            borderColor="gray-700"
            borderTopWidth="thin"
            overflow="hidden"
          >
            <InformationPanel position={mousePosition} imageData={imageData} />
          </View>
        ) as any)}
    </Flex>
  );
}

export default Preview;
