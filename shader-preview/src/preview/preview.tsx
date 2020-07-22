import React, { useRef, useState, useEffect } from "react";

import TilingIcon from "@spectrum-icons/workflow/ClassicGridView";
import InfoIcon from "@spectrum-icons/workflow/Info";
import { Divider } from "@adobe/react-spectrum";

import * as m3 from "../utils/m3";

import { drawPreview } from "./renderer";
import { InformationPanel } from "./preview-information-panel";
import {
  ColorChannelPicker,
  ZoomControl,
  SelectableActionButton,
} from "./preview-controls";

import { Camera, Position, ColorChannel } from "./types";

function loadImageData(url: string): Promise<ImageData> {
  const image = new Image();
  image.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext("2d");

      if (ctx === null) {
        return reject(new Error(`Can't access 2d context`));
      }

      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, image.width, image.height);

      resolve(data);
    };

    image.src = url;
  });
}

function getCameraMatrix(camera: Camera): m3.M3 {
  const zoomFactor = 1 / camera.zoom;

  let cameraMat = m3.identity();
  cameraMat = m3.translate(cameraMat, camera.position[0], camera.position[1]);
  cameraMat = m3.scale(cameraMat, zoomFactor, zoomFactor);

  return cameraMat;
}

function getViewProjection(canvas: HTMLCanvasElement, camera: Camera): m3.M3 {
  const { width, height } = canvas;
  const projectionMat = m3.projection(width, height);
  const cameraMat = getCameraMatrix(camera);
  const viewMatrix = m3.inverse(cameraMat);
  return m3.multiply(projectionMat, viewMatrix);
}

function getFocusZoomFactor(
  imageData: ImageData,
  canvas: HTMLCanvasElement
): number {
  const { width, height } = canvas.getBoundingClientRect();

  return Math.min(imageData.width / width, imageData.height / height);
}

function Preview(props: { url: string }) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
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
    loadImageData(props.url).then((imageData) => {
      setImageData(imageData);

      if (canvasRef.current) {
        // const zoom = getFocusZoomFactor(imageData, canvasRef.current);

        setCamera({
          position: [0, 0],
          zoom: 1,
        });
      }
    });
  }, [props.url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas !== null && imageData !== null) {
      const projectionMatrix = getViewProjection(canvas, camera);

      drawPreview(canvas, {
        imageData,
        projectionMatrix,
        options: {
          channels,
          tiling,
        },
      });
    }
  }, [imageData, channels, tiling, camera]);

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

  const toggleTiling = () => {
    setTiling(!tiling);
  };

  const toggleIsInfoVisible = () => {
    setIsInfoVisible(!isInfoVisible);
  };

  return (
    <div className="preview">
      <ColorChannelPicker value={channels} onChange={setChannels} />

      <SelectableActionButton isSelected={tiling} onPress={toggleTiling}>
        <TilingIcon />
      </SelectableActionButton>

      <SelectableActionButton
        isSelected={isInfoVisible}
        onPress={toggleIsInfoVisible}
      >
        <InfoIcon />
      </SelectableActionButton>

      <ZoomControl value={camera.zoom} onChange={handleZoomChange} />

      <Divider />

      <canvas ref={canvasRef} width="750" height="512"></canvas>

      <Divider />

      {isInfoVisible && (
        <InformationPanel position={mousePosition} imageData={imageData} />
      )}
    </div>
  );
}

export default Preview;
