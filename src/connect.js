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

  const req = schema.request(other);

  let res;

  const handleReqSocket = (socket) => {
    if (!state.isClose) {
      socket.once('connect', () => {
        if (!state.isClose) {
          state.isConnect = true;
        }
      });
    }
  };

  req.once('socket', handleReqSocket);

  function handleReqError(error) {
    req.off('response', handleResponse);
    req.off('socket', handleReqSocket);
    if (!state.isClose) {
      state.isClose = true;
      onError(error);
      req.abort();
    }
    state.isConnect = false;
  }


  function handleResponse(r) {
    res = r;
    function handleResEnd() {
      state.isConnect = false;
      if (!state.isClose) {
        onEnd();
        state.isClose = true;
      }
      res.off('data', handleResData);
      res.off('end', handleResEnd);
      res.off('close', handleResEnd);
      req.off('error', handleError);
      if (res.socket) {
        res.socket.off('close', handleResSocketClose);
      }
    }

    function handleResSocketClose() {
      state.isConnect = false;
      if (!state.isClose) {
        onClose();
        state.isClose = true;
      }
      res.off('data', handleResData);
      res.off('end', handleResEnd);
      res.off('close', handleResEnd);
      req.off('error', handleError);
    }
    function handleError(error) {
      res.off('data', handleResData);
      res.off('end', handleResEnd);
      res.off('close', handleResEnd);
      if (res.socket) {
        res.socket.off('close', handleResSocketClose);
      }
      res.destroy();
      state.isConnect = false;
      if (!state.isClose) {
        state.isClose = true;
        onError(error);
      }
    }

    if (state.isConnect && !state.isClose) {
      onResponse(res);
      req.off('error', handleReqError);
      req.once('error', handleError);
      res.on('data', handleResData);
      res.once('end', handleResEnd);
      res.once('close', handleResEnd);
      res.socket.once('close', handleResSocketClose);
    }
  }

  function handleResData(chunk) {
    if (!state.isClose) {
      onData(chunk);
    }
  }

  req.once('error', handleReqError);
  req.once('response', handleResponse);

  if (body == null) {
    req.end();
  } else if (body && body.pipe) {
    body.pipe(req);
  } else if (typeof body === 'string' || Buffer.isBuffer(body)) {
    req.end(body);
  } else {
    req.end();
  }
  const connect = () => {
    if (!state.isClose) {
      state.isClose = true;
      req.abort();
    }
    state.isConnect = false;
  };

  connect.resume = () => {
    if (state.isConnect && !state.isClose && res) {
      res.resume();
    }
  };

  connect.pause = () => {
    if (state.isConnect && !state.isClose && res) {
      res.pause();
    }
  };

  return connect;
};
