'use strict'

import {
  kPipeline,
  kWrap,
  kWorkflow,
  kErrorReason,
  kAborted
} from './lib/symbols.js'
import { getPromiseResolvers } from './lib/utils.js'

// Workflows
import { Retry } from './lib/workflows/retry.js'
import { Fallback } from './lib/workflows/fallback.js'
import { CircuitBreaker } from './lib/workflows/circuitbreaker.js'

class FuseBox extends Function {
  [kWorkflow] = null

  constructor () {
    super('throw new Error("FuseBox initialized without protected workload")')
    this[kWorkflow] = this.#head.bind(this)
  }

  [kWrap] (workload) {
    Reflect.setPrototypeOf(wrapper, {
      ...this,
      [kWorkflow]: this[kWorkflow],
      [kPipeline]: this[kPipeline],
      [kErrorReason]: null,
      [kAborted]: false
    })

    return wrapper

    function wrapper (...args) {
      const { promise, resolve, reject } = getPromiseResolvers()

      wrapper[kWorkflow](() => workload(...args), {
        onStart () {
          // no-op - yet
        },
        onComplete (result) {
          resolve(result)
        },
        onError (error) {
          reject(error)
        }
      })

      return promise
    }
  }

  #head (workload, handler) {
    let abort = reason => {
      workload[kErrorReason] = reason ?? new Error('Workload aborted')
      workload[kAborted] = true
      handler.onError(workload[kErrorReason])
    }

    const onError = error => {
      if (workload[kAborted] === true) return

      abort = null
      handler.onError(error)
    }

    const onComplete = result => {
      if (workload[kAborted] === true) return

      abort = null
      handler.onComplete(result)
    }

    handler.onStart(abort)
    try {
      const result = workload()

      if (result != null && typeof result.then === 'function') {
        result.then(onComplete, onError)
      } else {
        onComplete(result)
      }
    } catch (error) {
      onError(error)
    }
  }

  protect (workload) {
    const wrapped = this[kWrap](workload)

    Reflect.setPrototypeOf(wrapped, this)

    return wrapped
  }

  addWorkflows (...workflows) {
    workflows = Array.isArray(workflows[0]) ? workflows[0] : workflows

    for (const workflow of workflows) {
      this[kWorkflow] = workflow(this[kWorkflow])
    }

    return this
  }
}

const fusebox = new FuseBox()
const workload = (a, b) => {
  if (a + b > 4) {
    throw new Error('Sum exceeds limit')
  }

  return a + b
}
const workload2 = async (a, b) => {
  return a * b
}
const protectedWorkload = fusebox
  // .addWorkflows(Fallback({ value: 42 }), Retry({ maxDelay: 3000 }))
  .addWorkflows(Fallback({ value: 42 }), Retry({ maxDelay: 5000, delay: 1000, retries: 5 }), CircuitBreaker({ timeout: 100, attempts: 1 }))
  .protect(workload)

const protectedWorkload2 = fusebox.protect(workload2)

protectedWorkload(2, 3)
  .then(console.log, console.log) // 42
  // .then(() => protectedWorkload2(2, 3))
  // .then(console.log, console.log) // 6

// console.log(await protectedWorkload2(2, 3))
// console.log(await protectedWorkload(2, 3))
// console.log(await protectedWorkload2(2, 3))
