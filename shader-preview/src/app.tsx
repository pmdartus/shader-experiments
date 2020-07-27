import React, { useState, useEffect } from "react";
import { Provider, defaultTheme, View, Grid } from "@adobe/react-spectrum";

import Preview from "./ui/Preview";
import PropertyEditor from "./ui/PropertyEditor";
import NodeEditor from "./ui/NodeEditor";

import { Property } from "./ui/PropertyEditor/PropertyEditor";

const IMAGE_URL = process.env.PUBLIC_URL + "/texture-ground-seamless.jpg";
const PROPERTIES: Property[] = [
  {
    type: "boolean",
    name: "bool-prop",
    label: "Boolean property",
    value: true,
  },
];

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

function GridView(props: { gridArea: string; children: React.ReactElement }) {
  return (
    <View gridArea={props.gridArea} borderWidth="thin" borderColor="dark">
      {props.children}
    </View>
  );
}

export default function App() {
  const [imageData, setImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    loadImageData(IMAGE_URL).then((imageData) => {
      setImageData(imageData);
    });
  }, []);

  return (
    <Provider theme={defaultTheme}>
      <Grid
        areas={["node-editor  property-editor", "preview property-editor"]}
        columns={["3fr", "1fr"]}
        rows={["1fr", "1fr"]}
        height="100vh"
        width="100vw"
        gap="size-100"
      >
        <GridView gridArea="node-editor">
          <NodeEditor />
        </GridView>
        <GridView gridArea="preview">
          <Preview imageData={imageData} />
        </GridView>
        <GridView gridArea="property-editor">
          <PropertyEditor properties={PROPERTIES} />
        </GridView>
      </Grid>
    </Provider>
  );
}
