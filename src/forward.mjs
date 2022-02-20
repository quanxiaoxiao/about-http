/* eslint no-use-before-define: 0 */
import { omit } from 'lodash';
import httpConnect from './connect.mjs';
import hrefParser from './hrefParser.mjs';

export default (options, httpResponse) => {
  if (!httpResponse.writable || !httpResponse.socket) {
    if (options.logger && options.logger.warn) {
      options.logger.warn('write steam alread close');
    }
    return;
  }
  const state = {
    isCleanup: false,
    isClose: false,
  };

  const hrefOptions = hrefParser(options.url);

  const connect = httpConnect({
    ...hrefOptions,
    ...omit(options, ['url', 'logger']),
  }, {
    onData,
    onResponse,
    onError,
    onEnd: onClose,
    onClose,
  });

  function onError(error) {
    if (options.logger && options.logger.warn) {
      options.logger.warn(error.message);
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
          httpResponse.writeHead(res.statusCode, res.headers);
        } else {
          connect();
        }
      } catch (error) {
        if (options.logger && options.logger.warn) {
          options.logger.warn(error.message);
        }
        state.isClose = true;
        connect();
      }
    } else {
      if (options.logger && options.logger.warn) {
        options.logger.warn('source socket write EPIPE');
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
      const ret = httpResponse.write(chunk);
      if (!ret) {
        connect.pause();
      }
    } else {
      if (options.logger && options.logger.warn) {
        options.logger.warn('source socket write EPIPE');
      }
      connect();
    }
  }

  function handleDrain() {
    connect.resume();
  }

  function handleClose() {
    state.isClose = true;
    if (options.logger && options.logger.warn) {
      options.logger.warn('source socket close error');
    }
    connect();
    cleanup();
  }

  function handleEnd() {
    state.isClose = true;
    cleanup();
  }

  function cleanup() {
    if (!state.isCleanup) {
      state.isCleanup = true;
      httpResponse.off('drain', handleDrain);
      httpResponse.off('finish', handleClose);
      httpResponse.off('close', handleClose);
    }
  }

  function handleError(error) {
    if (options.logger && options.logger.warn) {
      options.logger.warn(error.message);
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
