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
  const {
    schema = http,
    body,
    ...other
  } = options;

  const state = {
    isConnect: false,
    isClose: false,
  };

  const httpRequest = schema.request(other);

  let httpResponse;

  const handleReqSocket = (socket) => {
    if (!state.isClose) {
      socket.once('connect', () => {
        if (!state.isClose) {
          state.isConnect = true;
        }
      });
    }
  };

  httpRequest.once('socket', handleReqSocket);

  function handleReqError(error) {
    httpRequest.off('response', handleResponse);
    httpRequest.off('socket', handleReqSocket);
    if (!state.isClose) {
      state.isClose = true;
      onError(error);
      httpRequest.abort();
    }
    state.isConnect = false;
  }


  function handleResponse(r) {
    httpResponse = r;
    function handleResEnd() {
      state.isConnect = false;
      if (!state.isClose) {
        onEnd();
        state.isClose = true;
      }
      httpResponse.off('data', handleResData);
      httpResponse.off('end', handleResEnd);
      httpResponse.off('close', handleResEnd);
      httpRequest.off('error', handleError);
      if (httpResponse.socket) {
        httpResponse.socket.off('close', handleResSocketClose);
      }
    }

    function handleResSocketClose() {
      state.isConnect = false;
      if (!state.isClose) {
        onClose();
        state.isClose = true;
      }
      httpResponse.off('data', handleResData);
      httpResponse.off('end', handleResEnd);
      httpResponse.off('close', handleResEnd);
      httpRequest.off('error', handleError);
    }
    function handleError(error) {
      httpResponse.off('data', handleResData);
      httpResponse.off('end', handleResEnd);
      httpResponse.off('close', handleResEnd);
      if (httpResponse.socket) {
        httpResponse.socket.off('close', handleResSocketClose);
      }
      httpResponse.destroy();
      state.isConnect = false;
      if (!state.isClose) {
        state.isClose = true;
        onError(error);
      }
    }

    if (state.isConnect && !state.isClose) {
      onResponse(httpResponse);
      httpRequest.on('error', handleError);
      httpRequest.off('error', handleReqError);
      httpResponse.on('data', handleResData);
      httpResponse.once('end', handleResEnd);
      httpResponse.once('close', handleResEnd);
      httpResponse.socket.once('close', handleResSocketClose);
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
    if (!state.isClose) {
      state.isClose = true;
      httpRequest.abort();
    }
    state.isConnect = false;
    httpRequest.off('response', handleResponse);
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
