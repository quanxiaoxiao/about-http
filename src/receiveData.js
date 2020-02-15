/* eslint no-use-before-define: 0 */

module.exports = (req, limit) => new Promise((resolve, reject) => {
  const buf = [];
  let size = 0;
  function handleData(chunk) {
    size += chunk.length;
    buf.push(chunk);
    if (limit && size > limit) {
      cleanup();
      reject();
    }
  }
  function handleEnd() {
    resolve(Buffer.concat(buf, size));
    cleanup();
  }
  function handleClose() {
    reject();
    cleanup();
  }
  req.on('data', handleData);
  req.once('end', handleEnd);
  req.socket.once('close', handleClose);
  req.once('close', handleClose);

  function cleanup() {
    req.off('data', handleData);
    req.off('end', handleEnd);
    req.socket.off('close', handleClose);
    req.off('close', handleClose);
  }
});
