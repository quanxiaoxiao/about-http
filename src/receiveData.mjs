/* eslint no-use-before-define: 0 */

export default (rs, limit) => new Promise((resolve, reject) => {
  if (!rs.readable) {
    reject(new Error('read stream already close'));
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
        reject(new Error(`buffer exceed \`${size}\``));
        rs.destroy();
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
      reject(new Error('read stream early close'));
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

  rs.on('data', handleData);
  rs.once('end', handleEnd);
  if (rs.socket) {
    rs.socket.once('close', handleClose);
  }
  rs.once('close', handleClose);
  rs.once('error', handleError);

  function cleanup() {
    if (!state.isCleanup) {
      state.isCleanup = true;
      rs.off('data', handleData);
      rs.off('end', handleEnd);
      if (rs.socket) {
        rs.socket.off('close', handleClose);
      }
      rs.off('close', handleClose);
    }
  }
});
