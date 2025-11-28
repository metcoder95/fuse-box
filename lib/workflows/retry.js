class RetryWorkflow {
  constructor ({ retries = 3, delay = 0, backoff = 1, maxDelay = 10000 } = {}) {
    this.retries = retries
    this.delay = delay
    this.backoff = backoff
    this.maxDelay = maxDelay
  }

  workflow (head) {
    return (workload, handler) => {
      const retries = this.retries
      const delay = this.delay
      const backoff = this.backoff
      const maxDelay = this.maxDelay
      let attempts = 0
      let aborted = false
      let done = false
      let reason = null
      let abort = null
      const runAttempt = () => {
        attempts++

        head(workload, {
          onStart (abortFn) {
            if (aborted === true || done === true) {
              queueMicrotask(() => {
                handler.onError(reason)
              })

              return
            }

            abort = err => {
              aborted = true
              reason = err
              abortFn(err)
            }

            handler.onStart(abort)
          },
          onComplete (result) {
            done = true
            handler.onComplete(result)
          },
          onError (error) {
            if (done === true) return

            if (aborted === true) {
              handler.onError(reason)
              return
            }

            if (attempts !== retries) {
              const currentDelay = Math.min(
                delay * Math.pow(backoff, attempts - 1),
                maxDelay
              )

              setTimeout(runAttempt, currentDelay)
            } else {
              done = true
              handler.onError(error)
            }
          }
        })
      }

      runAttempt()
    }
  }
}

export function Retry (options) {
  return workflow => (workload, handler) => {
    const workflowInstance = new RetryWorkflow(options)
    return workflowInstance.workflow(workflow)(workload, handler)
  }
}