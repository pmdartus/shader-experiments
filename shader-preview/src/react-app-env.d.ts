/// <reference types="react-scripts" />

declare module "*.glsl" {
  const src: string;
  export default src;
}

declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}
