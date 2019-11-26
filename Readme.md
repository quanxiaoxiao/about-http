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
```

options
- **url** https://my.com/pathname
- **body** buffer || stream || string
