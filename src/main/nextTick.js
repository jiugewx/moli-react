// 判断是不是本地的方法
function isNative(Ctor) {
  return /native code/.test(Ctor.toString())
}

/**
 * 来自于vue的nextTick事务队列机制
 */
export const nextTick = (function() {
  const callbacks = [];
  let pending = false;
  let timerFunc;
  let handleError = () => {
    console.log(arguments);
  };

  function nextTickHandler() {
    pending = false;
    const copies = callbacks.slice(0);
    callbacks.length = 0;
    for ( let i = 0; i < copies.length; i++ ) {
      copies[i]()
    }
  }

  if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    timerFunc = () => {
      setImmediate(nextTickHandler)
    }
  } else if (typeof MessageChannel !== 'undefined' && (
      isNative(MessageChannel) ||
      // PhantomJS
      MessageChannel.toString() === '[object MessageChannelConstructor]'
    )) {
    const channel = new MessageChannel();
    const port = channel.port2;
    channel.port1.onmessage = nextTickHandler;
    timerFunc = () => {
      port.postMessage(1)
    }
  } else
  /* istanbul ignore next */
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    // use microtask in non-DOM environments, e.g. Weex
    const p = Promise.resolve();
    timerFunc = () => {
      p.then(nextTickHandler)
    }
  } else {
    // fallback to setTimeout
    timerFunc = () => {
      setTimeout(nextTickHandler, 0)
    }
  }

  return function queueNextTick(cb, ctx) {
    cb = cb || function() {
      };
    ctx = ctx || function() {
      };

    let _resolve;
    callbacks.push(() => {
      if (cb) {
        try {
          cb.call(ctx)
        } catch (e) {
          handleError(e, ctx, 'nextTick')
        }
      } else if (_resolve) {
        _resolve(ctx)
      }
    });
    if (!pending) {
      pending = true;
      timerFunc()
    }
    // $flow-disable-line
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise((resolve, reject) => {
        _resolve = resolve
      })
    }
  }
})();
