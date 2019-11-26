/* eslint no-use-before-define: 0 */

module.exports = (res, limit) => new Promise((resolve, reject) => {
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
  res.on('data', handleData);
  res.once('end', handleEnd);
  res.socket.once('close', handleClose);
  res.once('close', handleClose);

  function cleanup() {
    res.off('data', handleData);
    res.off('end', handleEnd);
    res.socket.off('close', handleClose);
    res.off('close', handleClose);
  }
});
