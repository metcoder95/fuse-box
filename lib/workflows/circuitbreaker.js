import { noop } from '../utils.js'

class CircuitBreakerWorkflow {
  attempts = 0
  successAttempts = 0
  timeout = 0
  state = 0 // 0 = CLOSED, 1 = OPEN, 2 = HALF_OPEN
  failureCount = 0
  successCount = 0
  lastFailureTime = 0
  onError = noop

  constructor ({ attempts = 3, successAttempts = 1, timeout = 0 } = {}) {
    this.attempts = attempts
    this.successAttempts = successAttempts
    this.timeout = timeout
  }

  static getSampleTry () {
    return Math.round(Math.random())
  }

  setOnError (handler) {
    this.onError = handler
  }

  workflow (head) {
    return (workload, handler) => {
      head(workload, {
        instance: (() => this)(),
        handler,
        onStart (abort) {
          this.handler.onStart(abort)
          switch (this.instance.state) {
            case 0: {
              // CLOSED
              break
            }

            case 1: {
              // OPEN
              if (Date.now() - this.lastFailureTime >= this.timeout) {
                this.state = 2
                return
              }

              abort(
                new Error('Circuit breaker is open, operations are blocked')
              )

              break
            }

            case 2: {
              // HALF_OPEN
              if (CircuitBreakerWorkflow.getSampleTry() === 0) {
                abort(
                  new Error(
                    'Circuit breaker is half-open, success attempt operation failed'
                  )
                )
                return
              }

              break
            }
          }
        },
        onComplete (result) {
          if (this.instance.state === 2) {
            if (
              ++this.instance.successCount === this.instance.successAttempts
            ) {
              this.state = 0 // CLOSED
              this.instance.failureCount = 0
              this.instance.successCount = 0
            } else {
              this.state = 2 // HALF_OPEN
            }
          }

          this.handler.onComplete(result)
        },
        onError (error) {
          if (++this.instance.failureCount === this.instance.attempts) {
            this.instance.state = 1
            this.instance.lastFailureTime = Date.now()
            this.onError(
              new Error(
                `Circuit breaker opened after ${this.instance.failureCount} failed attempts`,
                { cause: error }
              )
            )
          }

          this.handler.onError(error)
        }
      })
    }
  }
}

export function CircuitBreaker (options) {
  const workflowInstance = new CircuitBreakerWorkflow(options)
  return workflow => (workload, handler) => {
    return workflowInstance.workflow(workflow)(workload, handler)
  }
}
