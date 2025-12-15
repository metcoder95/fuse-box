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

  constructor ({ attempts, successAttempts, timeout }) {
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
              }

              break
            }
          }
        },
        onComplete (result) {
          // TODO: Refactor to reduce nested ifs
          if (this.instance.state === 2) {
            // HALF_OPEN
            if (
              ++this.instance.successCount === this.instance.successAttempts
            ) {
              this.state = 0 // CLOSED
              this.instance.failureCount = 0
              this.instance.successCount = 0
            } else {
              --this.instance.failureCount
            }
          } else if (this.instance.state === 1) {
            // OPEN
            if (this.instance.successAttempts === 1) {
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
          switch (this.instance.state) {
            case 0: {
              // CLOSED
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
              break
            }

            case 2: {
              // HALF_OPEN
              --this.instance.successAttempts
              if (++this.instance.failureCount === this.instance.attempts) {
                this.instance.state = 1
                this.instance.lastFailureTime = Date.now()
              }
              break
            }

            default: {
              // Is not possible, but just in case
              throw new Error('Invalid circuit breaker state')
            }
          }

          this.handler.onError(error)
        }
      })
    }
  }
}

export function CircuitBreaker (
  options = { attempts: 3, successAttempts: 1, timeout: 1000 }
) {
  if (
    options.attempts != null &&
    (!Number.isInteger(options.attempts) ||
      !Number.isFinite(options.attempts) ||
      options.attempts <= 0)
  ) {
    throw new Error('Attempts must be a positive integer, greater than zero')
  }

  if (
    options.successAttempts != null &&
    (!Number.isInteger(options.successAttempts) ||
      !Number.isFinite(options.successAttempts) ||
      options.successAttempts <= 0)
  ) {
    throw new Error(
      'Success attempts must be a positive integer, greater than zero'
    )
  }

  if (
    options.timeout != null &&
    (!Number.isInteger(options.timeout) ||
      !Number.isFinite(options.timeout) ||
      options.timeout < 0)
  ) {
    throw new Error('Timeout must be a non-negative integer')
  }

  const workflowInstance = new CircuitBreakerWorkflow(options)
  return workflow => (workload, handler) => {
    return workflowInstance.workflow(workflow)(workload, handler)
  }
}
