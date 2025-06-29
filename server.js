import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { makeService, retOK, retErr, retBinary, retJSON } from "./serverutil.js";
import { serveDir } from "jsr:@std/http/file-server";

const env = await load();

const base = "https://apibox.erweima.ai";

const apikey = env["APIKEY"];
const callBackBase = env["CALLBACKBASE"];

const handleCallback = async (req) => {
  const json = await req.json();
  //console.log(json, json.data.callbackType);
  //if (json.data.callbackType != "complete") return retOK();
  const taskId = json.data.task_id;
  await Deno.writeTextFile("./cache/" + taskId + ".json", JSON.stringify(json, null, 2));
  return retOK();
};

const dec = (req, name) => decodeURIComponent(req.query.get(name));

const handle = async (req, conn) => {
  //console.log(req.path);
  if (req.path.startsWith("/api/")) {
    const path = req.path.substring(5);
    if (path == "fetchLyrics") {
      const prompt = dec(req, "prompt");
      //console.log(prompt);
      const res = await fetchLyrics(prompt);
      return retJSON(res);
    } else if (path == "fetchGenerateMusicSimple") {
      const prompt = dec(req, "prompt");
      const negativeTags = dec(req, "negativeTags");
      //console.log(prompt, negativeTags);
      const res = await fetchGenerateMusicSimple(prompt, negativeTags);
      return retJSON(res);
    } else if (path == "fetchGenerateMusicCustom") {
      const prompt = dec(req, "prompt");
      const style = dec(req, "style");
      const title = dec(req, "title");
      const negativeTags = dec(req, "negativeTags");
      const res = await fetchGenerateMusicCustom(prompt, style, title, negativeTags);
      return retJSON(res);
    } else if (path == "fetchGenerateMusicCustomInstrumental") {
      const style = dec(req, "style");
      const title = dec(req, "title");
      const negativeTags = dec(req, "negativeTags");
      const res = await fetchGenerateMusicCustomInstrumental(style, title, negativeTags);
      return retJSON(res);
    } else if (path == "fetchTask") { // need query
      const taskId = dec(req, "taskId");
      if (!taskId) {
        return retErr("need query");
      }
      try {
        return retBinary(await Deno.readFile("./cache/" + taskId + ".json"), "application/json");
      } catch (e) {
      }
      return retJSON({ err: "not yet" });
    } else if (path == "callBack") {
      //console.log(req.method, path)
      if (req.method == "POST") {
        return await handleCallback(req);
      } else {
        return retErr("illegal callback");
      }
    }
    return retErr();
  } else {
    return serveDir(req, { fsRoot: "static", urlRoot: "" });
  }
};

const fetchPOST = async (path, json) => {
  const url = base + path;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "Bearer " + apikey,
  };
  const callBackUrl = callBackBase + "/api/callBack";
  json.callBackUrl = callBackUrl;
  const res = await (await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(json),
  })).json();
  if (!res.data) {
    return res.msg;
  }
  return res.data.taskId;
};

const fetchLyrics = async (prompt) => {
  const path = "/api/v1/lyrics";
  const body = {
    prompt,
  };
  const taskId = await fetchPOST(path, body);
  return taskId;
};

const fetchGenerateMusicSimple = async (prompt, negativeTags) => {
  const path = "/api/v1/generate";
  const body = {
    prompt,
    negativeTags,
    customMode: false,
    instrumental: false,
    model: "V4_5",
  };
  const taskId = await fetchPOST(path, body);
  return taskId;
};

const fetchGenerateMusicCustom = async (prompt, style, title, negativeTags) => {
  const path = "/api/v1/generate";
  const body = {
    prompt, // Maximum 5000 characters or 3000 characters(3.5/4)
    style,
    title,
    negativeTags,
    customMode: true,
    instrumental: false,
    model: "V4_5",
  };
  const taskId = await fetchPOST(path, body);
  return taskId;
};

const fetchGenerateMusicCustomInstrumental = async (style, title, negativeTags) => {
  const path = "/api/v1/generate";
  const body = {
    style,
    title, // Max length: 80 characters.
    negativeTags,
    customMode: true,
    instrumental: true,
    model: "V4_5", // Possible values: [V3_5, V4, V4_5]
  };
  const taskId = await fetchPOST(path, body);
  return taskId;
};

export default { fetch: makeService(handle) };
