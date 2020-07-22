import React, { useRef, useState, useEffect } from "react";

import TilingIcon from "@spectrum-icons/workflow/ClassicGridView";
import InfoIcon from "@spectrum-icons/workflow/Info";
import { Divider } from "@adobe/react-spectrum";

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
    position: [0.5, 0.5],
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
        const zoom = getFocusZoomFactor(imageData, canvasRef.current);

        setCamera({
          position: [0.5, 0.5],
          zoom,
        });
      }
    });
  }, [props.url]);

  useEffect(() => {
    if (canvasRef.current && imageData) {
      drawPreview(canvasRef.current, {
        imageData,
        channels,
        tiling,
        camera,
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

    canvas.addEventListener("mousemove", handleCanvasMouseMove);
    canvas.addEventListener("wheel", handleCanvasScroll);

    return () => {
      canvas.removeEventListener("mousemove", handleCanvasMouseMove);
      canvas.removeEventListener("wheel", handleCanvasScroll);
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
