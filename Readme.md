# about-http


## Install

```shell
npm install @quanxiaoxiao/about-http
```

## Usage

```javascript
const { httpConnect, httpForward , fetchData, receiveData, receiveJSON } = require('about-http');
// httpForward(options, httpResponse)
// httpConnect(options, { onError, onResponse, onData, onEnd, onClose })
// fetchData(options)
// receiveData(httpRequest, limit)
// receiveData(httpRequest, limit = 3MB)
// connectWebSocket(options, httpRequest, socket)
```

options
- **url** https://my.com/pathname
- **body** buffer || stream || string


```javascript
server.on('upgrade', (req, socket) => {
  if (req.url === '/ws') {
    connectWebSocket({
      url: 'wss://quan/ws',
    }, req, socket);
  } else {
    socket.destroy();
  }
});
```
