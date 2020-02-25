/* eslint no-use-before-define: 0 */
const _ = require('lodash');
const httpConnect = require('./connect');
const hrefParser = require('./hrefParser');

module.exports = (
  options,
  httpResponse,
) => {
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
    onEnd,
    onClose,
  });

  function onError(error) {
    if (options.logger && options.logger.error) {
      options.logger.error(error);
    }
    if (!httpResponse.headersSent) {
      httpResponse.writeHead(error.statusCode || error.status || 502, {});
    }
    if (error) {
      httpResponse.end(error.message);
    }
    cleanup();
  }

  function onResponse(r) {
    httpResponse.writeHead(r.statusCode, r.headers);
  }

  function onClose() {
    httpResponse.end();
    cleanup();
  }

  function onEnd() {
    httpResponse.end();
    cleanup();
  }

  function onData(chunk) {
    const ret = httpResponse.write(chunk);
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
    httpResponse.off('drain', handleDrain);
    httpResponse.off('close', handleClose);
    if (httpResponse.socket) {
      httpResponse.socket.off('close', handleClose);
    }
  }

  function handleError() {
    connect();
    cleanup();
  }

  httpResponse.on('error', handleError);
  httpResponse.on('drain', handleDrain);
  httpResponse.once('close', handleClose);
  httpResponse.socket.once('close', handleClose);
};
