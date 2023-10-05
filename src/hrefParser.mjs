import http from 'node:http';
import https from 'node:https';
import { parse } from 'node:url';

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
  return {
    schema: protocol === 'https:' ? https : http,
    port: p,
    path,
    hostname,
  };
};
