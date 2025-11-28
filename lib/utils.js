'use strict'

export const getPromiseResolvers =
  Promise.withResolvers != null
    ? Promise.withResolvers.bind(Promise)
    : () => {
        let res, rej
        const promise = new Promise((resolve, reject) => {
          res = resolve
          rej = reject
        })

        return { promise, resolve: res, reject: rej }
      }

export const AsyncFunctionConstructor = (async function(){}).constructor.name;
export const FunctionConstructor = (function(){}).constructor.name;