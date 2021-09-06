/* eslint no-use-before-define: 0 */
const _ = require('lodash');
const httpConnect = require('./connect');
const hrefParser = require('./hrefParser');

module.exports = (
  options,
  httpResponse,
) => {
  if (!httpResponse.writable) {
    return;
  }
  const state = {
    isCleanup: false,
    isClose: false,
  };

  const hrefOptions = hrefParser(options.url);
  if (!hrefOptions) {
    if (options.logger && options.logger.error) {
      options.logger.error('forward url invalid');
    }
    httpResponse.writeHead(500, {});
    httpResponse.end();
    return;
  }
  const connect = httpConnect({
    ...hrefOptions,
    ..._.omit(options, ['url', 'logger']),
  }, {
    onData,
    onResponse,
    onError,
    onEnd: onClose,
    onClose,
  });

  function onError(error) {
    if (options.logger && options.logger.error) {
      options.logger.error(error);
    }
    if (!httpResponse.headersSent && !state.isClose && !httpResponse.writableEnded) {
      httpResponse.writeHead(error.statusCode || error.status || 502, {});
    }
    if (error && !state.isClose && !httpResponse.writableEnded) {
      httpResponse.end(error.message);
    }
  }

  function onResponse(res) {
    if (!state.isClose) {
      try {
        if (!httpResponse.headersSent && !httpResponse.writableEnded) {
          httpResponse.writeHead(res.statusCode, res.headers);
        }
      } catch (error) {
        if (options.logger && options.logger.error) {
          options.logger.error(error);
        }
        connect();
      }
    } else {
      connect();
    }
  }

  function onClose() {
    if (!state.isClose && !httpResponse.writableEnded) {
      httpResponse.end();
    }
  }

  function onData(chunk) {
    if (!state.isClose) {
      if (!httpResponse.writableEnded) {
        const ret = httpResponse.write(chunk);
        if (!ret) {
          connect.pause();
        }
      }
    } else {
      connect();
    }
  }

  function handleDrain() {
    connect.resume();
  }

  function handleClose() {
    state.isClose = true;
    connect();
    cleanup();
  }

  function handleSocketClose() {
    if (!httpResponse.writableEnded) {
      httpResponse.end();
    }
    connect();
  }

  function cleanup() {
    if (!state.isCleanup) {
      state.isCleanup = true;
      httpResponse.off('drain', handleDrain);
      httpResponse.off('finish', handleClose);
      httpResponse.off('close', handleClose);
      if (httpResponse.socket) {
        httpResponse.socket.off('close', handleSocketClose);
      }
    }
  }

  function handleError(error) {
    if (options.logger && options.logger.error) {
      options.logger.error(error.message);
    }
    state.isClose = true;
    connect();
    cleanup();
  }

  httpResponse.once('error', handleError);
  httpResponse.on('drain', handleDrain);
  httpResponse.once('finish', handleClose);
  httpResponse.once('close', handleClose);
  httpResponse.socket.once('close', handleSocketClose);
};
