const receiveData = require('./receiveData');

module.exports = async (res, limit = 3 * 1024 * 1024) => {
  const buf = await receiveData(res, limit);
  const data = JSON.parse(buf);
  return data;
};
