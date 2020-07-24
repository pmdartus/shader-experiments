import React, { useState, useEffect } from "react";
import { Provider, defaultTheme, View } from "@adobe/react-spectrum";

import Preview from "./preview";

const IMAGE_URL = process.env.PUBLIC_URL + "/texture-ground-seamless.jpg";

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

export default function App() {
  const [imageData, setImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    loadImageData(IMAGE_URL).then((imageData) => {
      setImageData(imageData);
    });
  }, []);

  return (
    <Provider theme={defaultTheme}>
      <View width="100vw" height="100vh">
        <View
          borderColor="gray-700"
          borderWidth="thin"
          UNSAFE_style={{ width: "512px", height: "512px" }}
        >
          <Preview imageData={imageData} />
        </View>
      </View>
    </Provider>
  );
}
