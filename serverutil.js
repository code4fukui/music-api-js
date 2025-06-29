import { parseURL } from "https://js.sabae.cc/parseURL.js";

export const makeService = (handle) => {
  const service = async (req, conn) => {
    const remoteAddr = conn.remoteAddr.hostname;
    try {
      const url = req.url;
      const purl = parseURL(url);
      req.path = purl.path;
      req.query = new URLSearchParams(purl.query);
      req.host = purl.host;
      req.port = purl.port;
      req.remoteAddr = remoteAddr;
      //if (log) await log(req);
      const resd = await handle(req, conn);
      return resd;
    } catch (e) {
      console.log(e);
      //if (err) err(e);
    }
  };
  return service;
};

export const retOK = () => {
  return new Response("OK", { status: 200, statusText: "OK" });
};
export const retErr = () => {
  return new Response("err", { status: 401, statusText: "err" });
};
export const retJSON = (json) => {
  const bin = new TextEncoder().encode(JSON.stringify(json));
  const headers = {
    "Content-Type": "application/json",
    "Content-Length": bin.length,
  };
  return new Response(bin, { status: 200, statusText: "OK", headers });
};
export const retBinary = (bin, contentType = "application/octet-stream") => {
  const headers = {
    "Content-Type": contentType,
    "Content-Length": bin.length,
  };
  return new Response(bin, { status: 200, statusText: "OK", headers });
};
