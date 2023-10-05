/* eslint no-use-before-define: 0 */
import _ from 'lodash';
import httpConnect from './connect.mjs';
import parseUrl from './parseUrl.mjs';

export default (options, writeStream) => {
  if (!writeStream.writable || !writeStream.socket) {
    if (!options.onError) {
      throw new Error('write steam alread close');
    } else {
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

  const hrefOptions = parseUrl(options.url);

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
    if (!options.onError) {
      throw error;
    }
    if (!writeStream.headersSent && !state.isClose && !writeStream.writableEnded) {
      writeStream.writeHead(error.statusCode || error.status || 502, {});
      if (!writeStream.headersSent) {
        writeStream.headersSent = true;
      }
    }
    if (!state.isClose && !writeStream.writableEnded) {
      writeStream.end(error.message);
    }
    if (!state.isErrorEmit) {
      state.isErrorEmit = true;
      options.onError(new Error(error.message));
    }
  }

  function onResponse(res) {
    if (!state.isClose) {
      try {
        if (!writeStream.headersSent && !writeStream.writableEnded) {
          if (options.onResponse) {
            options.onResponse(res.statusCode, res.headers, res);
          }
          writeStream.writeHead(res.statusCode, res.headers);
          if (!writeStream.headersSent) {
            writeStream.headersSent = true;
          }
        } else {
          connect();
        }
      } catch (error) {
        connect();
        state.isClose = true;
        if (!options.onError) {
          throw error;
        }
        if (!state.isErrorEmit) {
          state.isErrorEmit = true;
          options.onError(new Error(error.message));
        }
      }
    } else {
      connect();
      if (!options.onError) {
        throw new Error('source socket write EPIPE');
      }
      if (!state.isErrorEmit) {
        state.isErrorEmit = true;
        options.onError(new Error('source socket write EPIPE'));
      }
    }
  }

  function onClose() {
    if (!state.isClose && !writeStream.writableEnded) {
      writeStream.end();
    }
  }

  function onData(chunk) {
    if (!state.isClose && !writeStream.writableEnded) {
      if (options.onData) {
        options.onData(chunk);
      }
      const ret = writeStream.write(chunk);
      if (!ret) {
        connect.pause();
      }
    } else {
      connect();
      if (!options.onError) {
        throw new Error('source socket write EPIPE');
      }
      if (!state.isErrorEmit) {
        state.isErrorEmit = true;
        options.onError(new Error('source socket write EPIPE'));
      }
    }
  }

  function handleDrainOnWriteStream() {
    connect.resume();
  }

  function handleEndOnWriteStream() {
    cleanup();
    state.isClose = true;
    if (!state.isErrorEmit && !state.isEndEmit && options.onEnd) {
      state.isEndEmit = true;
      options.onEnd();
    }
  }

  function handleCloseOnWriteStream() {
    connect();
    cleanup();
    state.isClose = true;
    if (!options.onError) {
      throw new Error('source socket close error');
    }
    if (!state.isErrorEmit) {
      state.isErrorEmit = true;
      options.onError(new Error('source socket close error'));
    }
  }

  function handleErrorOnWriteStream(error) {
    connect();
    cleanup();
    state.isClose = true;
    if (!options.onError) {
      throw error;
    }
    if (!state.isErrorEmit) {
      state.isErrorEmit = true;
      options.onError(new Error(error.message));
    }
  }

  function cleanup() {
    if (!state.isCleanup) {
      state.isCleanup = true;
      writeStream.off('drain', handleDrainOnWriteStream);
      writeStream.off('finish', handleEndOnWriteStream);
      writeStream.off('close', handleCloseOnWriteStream);
    }
  }

  writeStream.once('error', handleErrorOnWriteStream);
  writeStream.on('drain', handleDrainOnWriteStream);
  writeStream.once('finish', handleEndOnWriteStream);
  writeStream.once('close', handleCloseOnWriteStream);
};
