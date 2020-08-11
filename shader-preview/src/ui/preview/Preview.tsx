import React, { useRef, useState, useEffect } from "react";

import { Flex, View } from "@adobe/react-spectrum";

import Preview2D, { ColorChannels } from "../../core/Preview2D";

import { ActionBar } from "./ActionBar";
import { InformationPanel } from "./InformationPanel";

function Preview(props: { imageData: ImageData | null }) {
  const { imageData } = props;

  const [zoom, setZoom] = useState(1);
  const [channels, setChannels] = useState(ColorChannels.RGB);
  const [tiling, setTiling] = useState(false);
  const [mousePosition, setMousePosition] = useState([0, 0]);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<Preview2D>();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas !== null) {
      previewRef.current = new Preview2D(canvas, {
        mouseMoved(position) {
          setMousePosition(position);
        },
        zoomChanged(zoom) {
          setZoom(zoom);
        },
      });
    }
  }, []);

  useEffect(() => {
    previewRef.current!.setImage(imageData);
  }, [imageData]);

  useEffect(() => {
    previewRef.current!.setTiling(tiling);
  }, [tiling]);

  useEffect(() => {
    previewRef.current!.setColorChannels(channels);
  }, [channels]);

  useEffect(() => {
    previewRef.current!.setZoom(zoom);
  }, [zoom]);

  const fitToPreview = () => {
    previewRef.current!.fitToPreview();
  };

  const fitToContent = () => {
    previewRef.current!.fitToContent();
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
          zoom={zoom}
          onChannelsChange={setChannels}
          onTilingChange={setTiling}
          onInfoVisibleChange={setIsInfoVisible}
          onZoomChange={setZoom}
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

      <View
        padding="size-100"
        borderColor="gray-700"
        borderTopWidth="thin"
        overflow="hidden"
        isHidden={!isInfoVisible}
      >
        <InformationPanel position={[0, 0]} imageData={imageData} />
      </View>
    </Flex>
  );
}

export default Preview;
