/* eslint no-use-before-define: 0 */
import http from 'http';
import _ from 'lodash';

export default (
  options,
  {
    onResponse,
    onData,
    onEnd,
    onClose,
    onError,
  },
) => {
  let httpClientResponse;
  const {
    schema = http,
    body,
  } = options;

  const state = {
    isConnect: false,
    isClose: false,
    isErrorEmit: false,
    isCloseEmit: false,
    isEndEmit: false,
    isCleanup: false,
  };

  const httpClientRequest = schema.request(_.omit(options, ['schema', 'body']));

  const handleConnectOnSocket = () => {
    if (!state.isClose) {
      state.isConnect = true;
    }
  };

  const handleTimeoutOnSocket = () => {
    if (!httpClientRequest.destroyed) {
      httpClientRequest.destroy();
    }
  };

  const handleHttpClientRequestOnSocket = (socket) => {
    if (!state.isClose) {
      socket.setTimeout(30 * 1000);
      socket.once('connect', handleConnectOnSocket);
      socket.once('timeout', handleTimeoutOnSocket);
    }
  };

  httpClientRequest.once('socket', handleHttpClientRequestOnSocket);

  function handleHttpClientRequestOnError(error) {
    httpClientRequest.off('response', handleHttpClientOnResponse);
    if (!httpClientRequest.socket) {
      httpClientRequest.off('socket', handleHttpClientRequestOnSocket);
    } else if (httpClientRequest.socket.connecting) {
      httpClientRequest.socket.off('socket', handleConnectOnSocket);
      httpClientRequest.socket.off('timeout', handleTimeoutOnSocket);
    }
    state.isConnect = false;
    if (onError && !state.isClose && !state.isErrorEmit) {
      state.isErrorEmit = true;
      onError(error);
    }
    state.isClose = true;
  }

  function handleHttpClientOnResponse(res) {
    httpClientResponse = res;

    function handleHttpClientResponseOnEnd() {
      if (!state.isClose
        && onEnd
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

    function handleHttpClientResponseOnClose() {
      state.isConnect = false;
      if (!state.isClose
        && onClose
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
        && onError
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
        onResponse(httpClientResponse);
      }
      httpClientRequest.once('error', handleErrorOnSource);
      httpClientRequest.off('error', handleHttpClientRequestOnError);
      httpClientResponse.on('data', handleHttpClientResponseOnData);
      httpClientResponse.once('end', handleHttpClientResponseOnEnd);
      httpClientResponse.once('close', handleHttpClientResponseOnClose);
    }

    function cleanup() {
      if (!state.isCleanup) {
        state.isCleanup = true;
        httpClientResponse.off('data', handleHttpClientResponseOnData);
        httpClientResponse.off('close', handleHttpClientResponseOnClose);
        httpClientResponse.off('end', handleHttpClientResponseOnEnd);
        if (httpClientResponse.socket) {
          httpClientRequest.socket.off('timeout', handleTimeoutOnSocket);
        }
      }
    }
  }

  function handleHttpClientResponseOnData(chunk) {
    if (!state.isClose) {
      onData(chunk);
    } else if (!httpClientRequest.destroyed) {
      httpClientRequest.destroy();
    }
  }

  httpClientRequest.on('error', handleHttpClientRequestOnError);
  httpClientRequest.once('response', handleHttpClientOnResponse);

  if (body == null) {
    httpClientRequest.end();
  } else if (body && body.pipe) {
    body.pipe(httpClientRequest);
  } else if (typeof body === 'string' || Buffer.isBuffer(body)) {
    httpClientRequest.end(body);
  } else {
    httpClientRequest.destroy();
    throw new Error('body is not string , buffer or stream');
  }

  const connect = () => {
    state.isClose = true;
    state.isConnect = false;
    if (!httpClientRequest.destroyed) {
      httpClientRequest.destroy();
    }
  };

  connect.resume = () => {
    if (state.isConnect
      && !state.isClose
      && httpClientResponse
      && httpClientResponse.isPaused()) {
      httpClientResponse.resume();
    }
  };

  connect.pause = () => {
    if (state.isConnect
      && !state.isClose
      && httpClientResponse
      && !httpClientResponse.isPaused()
    ) {
      httpClientResponse.pause();
    }
  };

  return connect;
};
