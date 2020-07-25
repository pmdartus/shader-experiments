import React, { useRef, useState, useEffect, useCallback } from "react";

import { Flex, View } from "@adobe/react-spectrum";

import { ActionBar } from "./ActionBar";
import { InformationPanel } from "./InformationPanel";
import { PreviewRenderer } from "./renderer";

import * as m3 from "../utils/m3";
import { Camera, Position, ColorChannel } from "./types";

function getProjectionMatrix(canvas: HTMLCanvasElement): m3.M3 {
  const rect = canvas.getBoundingClientRect();
  return m3.projection(rect.width, rect.height);
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

function getCameraToFitPreview(
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

// Convert the MouseEvent position to the target clip space.
// From: https://stackoverflow.com/a/57899935
function getClipSpaceMousePosition(
  evt: React.MouseEvent,
  target: HTMLElement
): m3.Vector2D {
  // Get CSS position relative to the canvas
  const rect = target.getBoundingClientRect();
  const cssX = evt.clientX - rect.left;
  const cssY = evt.clientY - rect.top;

  // Convert CSS position to normalized position relative to the canvas
  const normalizedX = cssX / rect.width;
  const normalizedY = cssY / rect.height;

  // Convert normalized position to the clip space
  const clipX = normalizedX * 2 - 1;
  const clipY = normalizedY * -2 + 1;

  return [clipX, clipY];
}

function Preview(props: { imageData: ImageData | null }) {
  const { imageData } = props;

  const [camera, setCamera] = useState<Camera>({
    position: [0, 0],
    zoom: 1,
  });
  const [channels, setChannels] = useState(ColorChannel.RGB);
  const [tiling, setTiling] = useState(false);
  const [mousePosition, setMousePosition] = useState<Position>([0, 0]);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PreviewRenderer>();

  const handleCanvasWheel = useCallback((evt: WheelEvent) => {
    evt.preventDefault();

    setCamera((camera) => {
      // https://stackoverflow.com/a/57899935
      // Make zoom change proportionate to the current zoom level.
      const zoom = camera.zoom * Math.pow(2, evt.deltaY * -0.01);

      return {
        ...camera,
        zoom,
      };
    });
  }, []);

  const handleCanvasMouseMove = (evt: React.MouseEvent) => {
    // Ignore mouse move events if the canvas is currently dragging.
    if (isDragging) {
      return;
    }

    const canvas = evt.target as HTMLCanvasElement;
    const clipSpaceMousePosition = getClipSpaceMousePosition(evt, canvas);
    const viewProjectionMatrix = getViewProjectionMatrix(canvas, camera);

    // Transform the clip space mouse position to the world position using the inverse
    // transformation for the view projection matrix.
    const woldMousePosition = m3.transformVector2D(
      m3.inverse(viewProjectionMatrix),
      clipSpaceMousePosition
    );

    // Convert the world position from floating points to integers.
    setMousePosition([
      Math.round(woldMousePosition[0]),
      Math.round(woldMousePosition[1]),
    ]);
  };

  const handleCanvasMouseDown = (evt: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setIsDragging(true);

    const handleDragMove = (evt: MouseEvent) => {
      setCamera(({ zoom, position }) => {
        return {
          zoom,
          position: [
            position[0] - evt.movementX / zoom,
            position[1] - evt.movementY / zoom,
          ],
        };
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);

      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const handleZoomChange = (zoom: number) => {
    setCamera({
      ...camera,
      zoom,
    });
  };

  const fitToContent = () => {
    setCamera({
      position: [0, 0],
      zoom: 1,
    });
  };

  const fitToPreview = () => {
    const canvas = canvasRef.current;

    if (imageData && canvas) {
      const camera = getCameraToFitPreview(imageData, canvas);
      setCamera(camera);
    } else {
      fitToContent();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      rendererRef.current = new PreviewRenderer(canvas);
      canvas.addEventListener("wheel", handleCanvasWheel);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("wheel", handleCanvasWheel);
      }
    };
  }, [handleCanvasWheel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;

    if (canvas && renderer) {
      const matrix = getViewProjectionMatrix(canvas, camera);
      renderer.setConfig({
        imageData,
        channels,
        tiling,
        matrix,
      });
    }
  }, [imageData, channels, tiling, camera, isInfoVisible]);

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
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          style={{
            width: "100%",
            height: "100%",
          }}
        ></canvas>
      </View>

      <View
        padding="size-100"
        borderColor="gray-700"
        borderTopWidth="thin"
        overflow="hidden"
        isHidden={!isInfoVisible}
      >
        <InformationPanel position={mousePosition} imageData={imageData} />
      </View>
    </Flex>
  );
}

export default Preview;
