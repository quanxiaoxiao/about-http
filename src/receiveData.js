/* eslint no-use-before-define: 0 */

module.exports = (req, limit) => new Promise((resolve, reject) => {
  const state = {
    isCleanup: false,
    isFinished: false,
  };
  const buf = [];
  let size = 0;
  function handleData(chunk) {
    size += chunk.length;
    buf.push(chunk);
    if (limit && size > limit) {
      if (!state.isFinished) {
        reject(new Error(`buffer size exceed ${size}`));
      }
      req.destroy();
    }
  }
  function handleEnd() {
    if (!state.isFinished) {
      state.isFinished = true;
      resolve(Buffer.concat(buf, size));
    }
    cleanup();
  }
  function handleClose() {
    if (!state.isFinished) {
      state.isFinished = true;
      reject(new Error('request is close'));
    }
    cleanup();
  }
  function handleError(error) {
    if (state.isFinished) {
      state.isFinished = true;
      reject(error);
    }
    cleanup();
  }

  req.on('data', handleData);
  req.once('end', handleEnd);
  if (req.socket) {
    req.socket.once('close', handleClose);
  }
  req.once('close', handleClose);
  req.once('error', handleError);

  function cleanup() {
    if (!state.isCleanup) {
      state.isCleanup = true;
      req.off('data', handleData);
      req.off('end', handleEnd);
      if (req.socket) {
        req.socket.off('close', handleClose);
      }
      req.off('close', handleClose);
    }
  }
});
