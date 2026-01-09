class RetryWorkflow {
  constructor ({ retries, delay, backoff, maxDelay }) {
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
        ++attempts
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

export function Retry (options = {}) {
  if (
    options.retries != null &&
    (!Number.isInteger(options.retries) ||
      !Number.isFinite(options.retries) ||
      options.retries < 0)
  ) {
    throw new Error('Retries must be a non-negative integer')
  }

  if (
    options.delay != null &&
    (!Number.isInteger(options.delay) ||
      !Number.isFinite(options.delay) ||
      options.delay < 0)
  ) {
    throw new Error('Delay must be a non-negative integer')
  }

  if (
    options.backoff != null &&
    (typeof options.backoff !== 'number' ||
      !Number.isFinite(options.backoff) ||
      options.backoff < 1)
  ) {
    throw new Error('Backoff must be a number greater than or equal to 1')
  }

  if (
    options.maxDelay != null &&
    (!Number.isInteger(options.maxDelay) ||
      !Number.isFinite(options.maxDelay) ||
      options.maxDelay < 0)
  ) {
    throw new Error('MaxDelay must be a non-negative integer')
  }

  options = {
    retries: options.retries != null ? options.retries : 3,
    delay: options.delay != null ? options.delay : 200,
    backoff: options.backoff != null ? options.backoff : 2,
    maxDelay: options.maxDelay != null ? options.maxDelay : 10000
  }

  return workflow => (workload, handler) => {
    const workflowInstance = new RetryWorkflow(options)
    return workflowInstance.workflow(workflow)(workload, handler)
  }
}
