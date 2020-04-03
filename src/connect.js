/* eslint no-use-before-define: 0 */
const http = require('http');

module.exports = (
  options,
  {
    onError,
    onResponse,
    onData,
    onEnd,
    onClose,
  },
) => {
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

    function handleResSocketClose() {
      state.isConnect = false;
      if (!state.isClose && !state.isErrorEmit && !state.isCloseEmit) {
        state.isCloseEmit = true;
        onClose();
      }
      state.isClose = true;
      cleanup();
    }
    function handleError(error) {
      state.isConnect = false;
      if (!state.isErrorEmit && !state.isClose) {
        state.isErrorEmit = true;
        onError(error);
      }
      state.isClose = true;
      cleanup();
    }

    if (state.isConnect && !state.isClose) {
      onResponse(httpResponse);
      httpRequest.once('error', handleError);
      httpRequest.off('error', handleReqError);
      httpResponse.on('data', handleResData);
      httpResponse.once('end', handleResEnd);
      httpResponse.once('close', handleResEnd);
      if (httpResponse.socket) {
        httpResponse.socket.once('close', handleResSocketClose);
      }
    }

    function cleanup() {
      if (!state.isCleanup) {
        state.isCleanup = true;
        httpResponse.off('data', handleResData);
        httpResponse.off('end', handleResEnd);
        httpResponse.off('close', handleResEnd);
        if (httpResponse.socket) {
          httpResponse.socket.off('close', handleResSocketClose);
        }
      }
    }
  }

  function handleResData(chunk) {
    if (!state.isClose) {
      onData(chunk);
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
    httpRequest.end();
  }

  const connect = () => {
    state.isClose = true;
    if (!httpResponse) {
      httpRequest.off('response', handleResponse);
      httpRequest.abort();
    } else if (!httpResponse.destroyed) {
      httpResponse.destroy();
    }
    state.isConnect = false;
  };

  connect.resume = () => {
    if (state.isConnect && !state.isClose && httpResponse) {
      httpResponse.resume();
    }
  };

  connect.pause = () => {
    if (state.isConnect && !state.isClose && httpResponse) {
      httpResponse.pause();
    }
  };

  return connect;
};
