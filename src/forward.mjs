/* eslint no-use-before-define: 0 */
import _ from 'lodash';
import httpConnect from './connect.mjs';
import hrefParser from './hrefParser.mjs';

export default (options, httpResponse) => {
  if (!httpResponse.writable || !httpResponse.socket) {
    if (options.onError) {
      options.onError(new Error('write steam alread close'));
    }
    return;
  }
  const state = {
    isCleanup: false,
    isClose: false,
    isErrorEmit: false,
    isEndEmit: false,
  };

  const hrefOptions = hrefParser(options.url);

  const connect = httpConnect({
    ...hrefOptions,
    ..._.omit(options, [
      'url',
      'logger',
      'onResponse',
      'onData',
      'onError',
      'onEnd',
    ]),
  }, {
    onData,
    onResponse,
    onError,
    onEnd: onClose,
    onClose,
  });

  function onError(error) {
    if (!state.isErrorEmit && options.onError) {
      state.isErrorEmit = true;
      options.onError(new Error(error.message));
    }
    if (!httpResponse.headersSent && !state.isClose && !httpResponse.writableEnded) {
      httpResponse.writeHead(error.statusCode || error.status || 502, {});
    }
    if (!state.isClose && !httpResponse.writableEnded) {
      httpResponse.end(error.message);
    }
  }

  function onResponse(res) {
    if (!state.isClose) {
      try {
        if (!httpResponse.headersSent && !httpResponse.writableEnded) {
          if (options.onResponse) {
            options.onResponse(res.statusCode, res.headers);
          }
          httpResponse.writeHead(res.statusCode, res.headers);
        } else {
          connect();
        }
      } catch (error) {
        if (!state.isErrorEmit && options.onError) {
          state.isErrorEmit = true;
          options.onError(new Error(error.message));
        }
        state.isClose = true;
        connect();
      }
    } else {
      if (!state.isErrorEmit && options.onError) {
        state.isErrorEmit = true;
        options.onError(new Error('source socket write EPIPE'));
      }
      connect();
    }
  }

  function onClose() {
    if (!state.isClose && !httpResponse.writableEnded) {
      httpResponse.end();
    }
  }

  function onData(chunk) {
    if (!state.isClose && !httpResponse.writableEnded) {
      if (options.onData) {
        options.onData(chunk);
      }
      const ret = httpResponse.write(chunk);
      if (!ret) {
        connect.pause();
      }
    } else {
      if (!state.isErrorEmit && options.onError) {
        state.isErrorEmit = true;
        options.onError(new Error('source socket write EPIPE'));
      }
      connect();
    }
  }

  function handleDrain() {
    connect.resume();
  }

  function handleClose() {
    state.isClose = true;
    if (!state.isErrorEmit && options.onError) {
      state.isErrorEmit = true;
      options.onError(new Error('source socket close error'));
    }
    connect();
    cleanup();
  }

  function handleEnd() {
    state.isClose = true;
    if (!state.isErrorEmit && !state.isEndEmit && options.onEnd) {
      state.isEndEmit = true;
      options.onEnd();
    }
    cleanup();
  }

  function cleanup() {
    if (!state.isCleanup) {
      state.isCleanup = true;
      httpResponse.off('drain', handleDrain);
      httpResponse.off('finish', handleEnd);
      httpResponse.off('close', handleClose);
    }
  }

  function handleError(error) {
    if (!state.isErrorEmit && options.onError) {
      state.isErrorEmit = true;
      options.onError(new Error(error.message));
    }
    state.isClose = true;
    connect();
    cleanup();
  }

  httpResponse.once('error', handleError);
  httpResponse.on('drain', handleDrain);
  httpResponse.once('finish', handleEnd);
  httpResponse.once('close', handleClose);
};
