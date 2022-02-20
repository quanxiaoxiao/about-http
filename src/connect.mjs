/* eslint no-use-before-define: 0 */
import http from 'http';

export default (
  options,
  {
    onError,
    onResponse,
    onData,
    onEnd,
    onClose,
  },
) => {
  [
    {
      name: 'onError',
      fn: onError,
    },
    {
      name: 'onData',
      fn: onData,
    },
    {
      name: 'onEnd',
      fn: onEnd,
    },
    {
      name: 'onClose',
      fn: onClose,
    },
  ].forEach(({ name, fn }) => {
    if (typeof fn !== 'function') {
      throw new Error(`handle \`${name}\` is not bind`);
    }
  });
  let httpResponse;
  const {
    schema = http,
    body,
    ...other
  } = options;

  const state = {
    isConnect: false,
    isClose: false,
    isErrorEmit: false,
    isCloseEmit: false,
    isEndEmit: false,
    isCleanup: false,
  };

  const httpRequest = schema.request(other);

  const handleSocketConnect = () => {
    if (!state.isClose) {
      state.isConnect = true;
    }
  };

  const handleReqSocket = (socket) => {
    if (!state.isClose) {
      socket.once('connect', handleSocketConnect);
    }
  };

  httpRequest.once('socket', handleReqSocket);

  function handleReqError(error) {
    httpRequest.off('response', handleResponse);
    if (!httpRequest.socket) {
      httpRequest.off('socket', handleReqSocket);
    } else if (httpRequest.socket.connecting) {
      httpRequest.socket.off('socket', handleSocketConnect);
    }
    state.isConnect = false;
    if (!state.isClose && !state.isErrorEmit) {
      state.isErrorEmit = true;
      onError(error);
    }
    state.isClose = true;
    if (httpResponse && !httpResponse.destroyed) {
      httpResponse.destroy();
    }
  }

  function handleResponse(r) {
    httpResponse = r;

    function handleResEnd() {
      if (!state.isClose
        && !state.isEndEmit
        && !state.isCloseEmit
        && !state.isErrorEmit
      ) {
        state.isEndEmit = true;
        onEnd();
      }
      state.isConnect = false;
      state.isClose = true;
      cleanup();
    }

    function handleResClose() {
      state.isConnect = false;
      if (!state.isClose
        && !state.isErrorEmit
        && !state.isEndEmit
        && !state.isCloseEmit
      ) {
        state.isCloseEmit = true;
        onClose();
      }
      state.isClose = true;
      cleanup();
    }

    function handleErrorOnSource(error) {
      state.isConnect = false;
      if (!state.isErrorEmit
        && !state.isClose
        && !state.isEndEmit
        && !state.isCloseEmit
      ) {
        state.isErrorEmit = true;
        onError(error);
      }
      state.isClose = true;
      cleanup();
    }

    function handleErrorOnDest(error) {
      state.isConnect = false;
      if (!state.isErrorEmit
        && !state.isClose
        && !state.isEndEmit
        && !state.isCloseEmit
      ) {
        state.isErrorEmit = true;
        onError(error);
      }
      state.isClose = true;
      cleanup();
    }

    if (state.isConnect && !state.isClose) {
      if (onResponse) {
        onResponse(httpResponse);
      }
      httpRequest.once('error', handleErrorOnSource);
      httpRequest.off('error', handleReqError);
      httpResponse.once('error', handleErrorOnDest);
      httpResponse.on('data', handleResData);
      httpResponse.once('end', handleResEnd);
      httpResponse.once('close', handleResClose);
    }

    function cleanup() {
      if (!state.isCleanup) {
        state.isCleanup = true;
        httpResponse.off('data', handleResData);
        httpResponse.off('close', handleResClose);
        httpResponse.off('end', handleResEnd);
      }
    }
  }

  function handleResData(chunk) {
    if (!state.isClose) {
      onData(chunk);
    } else if (!httpResponse.destroyed) {
      httpResponse.destroy();
    }
  }

  httpRequest.on('error', handleReqError);
  httpRequest.once('response', handleResponse);

  if (body == null) {
    httpRequest.end();
  } else if (body && body.pipe) {
    body.pipe(httpRequest);
  } else if (typeof body === 'string' || Buffer.isBuffer(body)) {
    httpRequest.end(body);
  } else {
    httpRequest.destroy();
    throw new Error('body is not string or buffer');
  }

  const connect = () => {
    state.isClose = true;
    state.isConnect = false;
    if (!httpRequest.destroyed) {
      httpRequest.destroy();
    }
    if (httpResponse && !httpResponse.destroyed) {
      httpResponse.destroy();
    }
  };

  connect.resume = () => {
    if (state.isConnect
      && !state.isClose
      && httpResponse
      && httpResponse.isPaused()) {
      httpResponse.resume();
    }
  };

  connect.pause = () => {
    if (state.isConnect
      && !state.isClose
      && httpResponse
      && !httpResponse.isPaused()
    ) {
      httpResponse.pause();
    }
  };

  return connect;
};
