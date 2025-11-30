import { AsyncFunctionConstructor, FunctionConstructor } from '../utils.js'

class FallbackWorkflow {
  constructor ({ value, handleAbort = false }) {
    this.fallback = value
    this.handleAbort = handleAbort
    this.isPrimitive = FunctionConstructor !== value?.constructor?.name
    this.isAsync =
      this.isPrimitive === false &&
      AsyncFunctionConstructor === value?.constructor?.name
  }

  workflow (head) {
    return (workload, handler) => {
      const fallbackHandler = {
        value: this.fallback,
        handleAbort: this.handleAbort,
        isPrimitive: this.isPrimitive,
        isAsync: this.isAsync,
        aborted: false,
        handler: {
          onStart: handler.onStart.bind(handler),
          onComplete: handler.onComplete.bind(handler),
          onError: handler.onError.bind(handler)
        },
        onFailure (reason) {
          if (this.isPrimitive) {
            this.handler.onComplete(this.value)
            return
          }

          if (this.isAsync) {
            this.value().then(this.handler.onComplete, this.handler.onError)
            return
          }

          try {
            this.handler.onComplete(this.value(reason))
          } catch (err) {
            err.cause = reason
            this.handler.onError(err)
          }
        },
        onStart (abort) {
          if (this.handleAbort === true) {
            abort = reason => {
              this.aborted = true
              this.onFailure(reason)
            }
            return
          }

          this.handler.onStart(abort)
        },
        onComplete (value) {
          this.handler.onComplete(value)
        },
        onError (error) {
          // Has been already handled
          if (this.aborted === true && this.handleAbort === true) return
          // Otherwise handle any kind of error
          this.onFailure(error)
        }
      }

      head(workload, fallbackHandler)
    }
  }
}

export function Fallback (options) {
  return workflow => (workload, handler) => {
    const workflowInstance = new FallbackWorkflow(options)
    return workflowInstance.workflow(workflow)(workload, handler)
  }
}
