import http from 'http';
import https from 'https';
import { parse } from 'url';

export default (href) => {
  if (!/^https?:\/\/\w+/.test(href)) {
    throw new Error(`href \`${href}\` invalid`);
  }
  const {
    protocol,
    path,
    port,
    hostname,
  } = parse(href);
  let p = port;
  if (p == null) {
    p = protocol === 'https:' ? 443 : 80;
  } else {
    p = Number(port);
  }
  if (p <= 0 || p > 65535 || Number.isNaN(p)) {
    throw new Error(`port \`${p}\` invalid`);
  }
  const result = {
    schema: protocol === 'https:' ? https : http,
    port: p,
    path,
    hostname,
  };
  return result;
};
