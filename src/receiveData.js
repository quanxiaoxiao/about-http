/* eslint no-use-before-define: 0 */

module.exports = (req, limit) => new Promise((resolve, reject) => {
  if (!req.readable) {
    reject();
    return;
  }
  const state = {
    isCleanup: false,
    completed: false,
  };
  const buf = [];
  let size = 0;
  function handleData(chunk) {
    if (!state.completed) {
      size += chunk.length;
      buf.push(chunk);
      if (limit && size > limit) {
        state.completed = true;
        reject(new Error(`buffer size exceed ${size}`));
        req.destroy();
      }
    }
  }
  function handleEnd() {
    if (!state.completed) {
      state.completed = true;
      resolve(Buffer.concat(buf, size));
    }
    cleanup();
  }
  function handleClose() {
    if (!state.completed) {
      state.completed = true;
      reject(new Error('request is close'));
    }
    cleanup();
  }
  function handleError(error) {
    if (!state.completed) {
      state.completed = true;
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
