# about-http


## Install

```shell
npm install @quanxiaoxiao/about-http
```

## Usage

```javascript
const { httpConnect, httpForward , fetchData } = require('about-http');
// httpForward(options, httpResponse)
// httpConnect(options, { onError, onResponse, onData, onEnd, onClose })
// fetchData(options)
```

options
- **url** https://my.com/pathname
- **body** buffer || stream || string
