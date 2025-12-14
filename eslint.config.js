'use strict'
import neostandard from 'neostandard'

export default neostandard({
  semi: false,
  ts: true,
  ignores: ['node_modules'],
  globals: {
    SharedArrayBuffer: true,
    Atomics: true,
    AbortController: true,
    MessageChannel: true
  }
})
