import { Pipeline, PipelineAttributes, PipelineAttributesNew } from '../../models';

type PipelineHandler<T> = (context: T) => Promise<Partial<T>> | Promise<void> | void;
type PipelineUpdate = Partial<PipelineAttributes>;

export enum PipelineType {
  create = 'create',
  update = 'update',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  remove = 'remove',
}

export async function runPipeline<T>(context: T, handlers: PipelineHandler<T>[]): Promise<void> {
  let pipelineContext = context;

  for (const handler of handlers) {
    const stageOutput = await handler(pipelineContext);

    if (stageOutput) {
      pipelineContext = Object.assign({}, pipelineContext, stageOutput);
    }
  }
}

export function createPipeline(values: PipelineAttributesNew): Promise<Pipeline> {
  return Pipeline.create(values);
}

export function updatePipeline(pipeline: Pipeline, values: PipelineUpdate): Promise<Pipeline> {
  return pipeline.update(values);
}
