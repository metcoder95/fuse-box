'use strict'

// Symbol definitions for FuseBox
export const kWrap = Symbol('fusebox.wrap')
export const kReason = Symbol('fusebox.error.reason')
export const kWorkflow = Symbol('fusebox.workflow')

// Protected workload related symbols
export const kPipeline = Symbol('fusebox.wrapped.pipeline')
export const kPromise = Symbol('fusebox.wrapped.promise')
export const kErrorReason = Symbol('fusebox.wrapped.error.reason')
export const kAborted = Symbol('fusebox.wrapped.aborted')
