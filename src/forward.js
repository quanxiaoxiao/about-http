/* eslint no-use-before-define: 0 */
const _ = require('lodash');
const httpConnect = require('./connect');
const hrefParser = require('./hrefParser');

module.exports = (
  options,
  res,
) => {
  const hrefOptions = hrefParser(options.url);
  if (!hrefOptions) {
    console.error('forward url invalid');
    res.writeHead(500, {});
    res.end();
    return;
  }
  const connect = httpConnect({
    ...hrefOptions,
    ..._.omit(options, ['url']),
  }, {
    onData,
    onResponse,
    onError,
    onEnd,
    onClose,
  });

  function onError(error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(error.statusCode || error.status || 502, {});
    }
    if (error) {
      res.end(error.message);
    }
    cleanup();
  }

  function onResponse(r) {
    res.writeHead(r.statusCode, r.headers);
  }

  function onClose() {
    res.end();
    cleanup();
  }

  function onEnd() {
    res.end();
    cleanup();
  }

  function onData(chunk) {
    const ret = res.write(chunk);
    if (!ret) {
      connect.pause();
    }
  }

  function handleDrain() {
    connect.resume();
  }

  function handleClose() {
    connect();
    cleanup();
  }

  function cleanup() {
    res.off('drain', handleDrain);
    res.off('close', handleClose);
    if (res.socket) {
      res.socket.off('close', handleClose);
    }
  }

  function handleError() {
    connect();
    cleanup();
  }

  res.on('error', handleError);
  res.on('drain', handleDrain);
  res.once('close', handleClose);
  res.socket.once('close', handleClose);
};
