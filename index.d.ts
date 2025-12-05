/// <reference types="node" />

export type FuseBoxWorkload<
  Workload extends (...args: any) => any = (...args: any) => any
> = Workload & FuseBox;
export type FuseBoxAbortCallback = (reason: Error) => void;
export type FuseBoxWorkloadOnStart = (abort: FuseBoxAbortCallback) => void;
export type FuxeBoxWorkloadOnComplete<Workload extends (...args: any) => any> =
  (result: Awaited<ReturnType<Workload>>) => void;
export type FuxeBoxWorkloadOnError = (error: Error) => void;
export type FuseBoxWorloadHandler<
  Workload extends FuseBoxWorkload = FuseBoxWorkload
> = {
  onStart: FuseBoxWorkloadOnStart;
  onComplete: FuxeBoxWorkloadOnComplete<Workload>;
  onError: FuxeBoxWorkloadOnError;
};

export type FuseBoxWorkflow = (
  workflow: FuseBoxWorkflow
) => (workload: FuseBoxWorkload, handler: FuseBoxWorloadHandler) => void;

export class FuseBox extends Function {
  constructor();
  protect<Workload extends (...args: any) => any = (...args: any) => any>(
    workload: Workload
  ): FuseBoxWorkload<Workload>;
  addWorkflows(workflows: FuseBoxWorkflow[]): FuseBoxWorkload;
  addWorkflows(...workflows: FuseBoxWorkflow[]): FuseBoxWorkload;
}

// Workflows
// Fallback
export type FallbackWorkflowValue<Fallback> =
  | (() => Fallback)
  | (() => Promise<Fallback>)
  | Fallback;
export type FallbackWorkflowOptions<Fallback = unknown> = {
  /**
   * @description Fallback value to be used in case of a failure. Can be a function, a function that returns a promise
   * or a primitive value
   */
  value: FallbackWorkflowValue<Fallback>;
  /**
   * @description If set to `true`, the workflow will handle aborted workloads, otherwise will ignore them and
   * do not set a fallback
   * @default false
   */
  handleAbort?: boolean;
};

// Retry
export type RetryWorkflowOptions = {
  /**
   * @description Max number of retries for the workflow
   * @default 3
   */
  retries?: number;
  /**
   * @description Delay between executions (in milliseconds)
   * @default 0
   */
  delay?: number;
  /**
   * @description Exponential backoff to use between every delayed attempt
   * @default 1
   */
  backoff?: number;
  /**
   * @description Max delay (in milliseconds) between executions.
   * @default 10000
   */
  maxDelay?: number;
};

// CircuitBreaker
export type CircuitBreakerWorkflowOptions = {
  /**
   * @description Max number of attempts before opening the circuit breaker
   * @default 3
   */
  attempts?: number;
  /**
   * @description Max number of successful attempts before closing the circuit breaker
   * @default 1
   */
  successAttempts?: number;
  /**
   * @description Delay of next attempt when circuit breaker is open
   * @default 1000
   */
  timeout?: number;
};

export namespace Workflows {
  export function CircuitBreaker(
    opts?: CircuitBreakerWorkflowOptions
  ): FuseBoxWorkflow;
  export function Retry(opts?: RetryWorkflowOptions): FuseBoxWorkflow;
  export function Fallback<Fallback = unknown>(
    opts: FallbackWorkflowOptions<Fallback>
  ): FuseBoxWorkflow;
}

export default FuseBox;
