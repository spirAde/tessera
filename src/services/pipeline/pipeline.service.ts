type PipelineHandler<T> = (context: T) => Promise<Partial<T>> | Promise<void> | void;

export async function runPipeline<T>(context: T, handlers: PipelineHandler<T>[]) {
  let pipelineContext = context;

  for (const handler of handlers) {
    const stageOutput = await handler(pipelineContext);

    if (stageOutput) {
      pipelineContext = Object.assign({}, pipelineContext, stageOutput);
    }
  }
}
