// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./worker";

import {
  CompilerShaderRequest,
  CompilerShaderResponse,
  RunShaderRequest,
  RunShaderResponse,
} from "./types";

export class WorkerProxy {
  private worker: Worker = new Worker();
  private lastId: number = 0;
  private callbacks: Map<number, (err: any, res: any) => void> = new Map();

  constructor() {
    this.worker.addEventListener("message", (msg) => this.handleMessage(msg));
  }

  private handleMessage(msg: MessageEvent) {
    const { data } = msg;

    const handler = this.callbacks.get(data.id);
    if (handler === undefined) {
      throw new Error(`Unexpected callback id "${data.id}"`);
    }

    handler(data.err, data.res);
  }

  async compileShader(
    config: CompilerShaderRequest
  ): Promise<CompilerShaderResponse> {
    return this.postMessage("compile-shader", config);
  }

  async runShader(config: RunShaderRequest): Promise<RunShaderResponse> {
    return this.postMessage("run-shader", config);
  }

  private postMessage(type: string, data: any): Promise<any> {
    const id = this.lastId++;

    return new Promise((resolve, reject) => {
      this.callbacks.set(id, (err, res) => {
        if (err) {
          return reject(new Error(err));
        }

        return resolve(res);
      });

      this.worker.postMessage({
        id,
        type,
        data,
      });
    });
  }
}
