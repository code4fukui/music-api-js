import { sleep } from "https://js.sabae.cc/sleep.js";

export const fetchWithTimeout = async (url, options, timeout) => {
  if (!timeout) {
    return fetch(url, options);
  }
  const controller = new AbortController();
  if (!options) options = {};
  options.signal = controller.signal;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return fetch(url, options)
    .then(response => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      throw new Error("timeout");
    }
  );
};

export const fetchJSONWithTimeout = async (url, req, timeout = 1000) => {
  const opt = req ? {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  } : null;
  const res = await (await fetchWithTimeout(url, opt, timeout)).json();
  return res;
};

const fetchJSON = async (url, req, timeout) => {
  return await fetchJSONWithTimeout(url, req, timeout);
};

export const generateLyrics = async (prompt) => {
  const talkid = await fetchJSON("./api/fetchLyrics?prompt=" + encodeURIComponent(prompt));
  for (let i = 0; i < 3 * 60; i++) {
    await sleep(1000);
    try {
      const res = await checkLyrics(talkid);
      if (res) return res;
    } catch (e) {
      console.log(e);
      if (e.message == "timeout") continue;
      throw e;
    }
  }
};

const checkLyrics = async (taskid) => {
  const json = await fetchJSON("./api/fetchTask?taskId=" + taskid);
  if (!json.data) {
    if (json.err == "not yet") return false;
    throw new Error(json.err);
  }
  if (!json.data.data) {
    //ta_lyric1.value = json.msg;
    throw new Error(json.msg);
  }
  return json.data.data;
};

// callback(audi1, audi2)
export const generateMusic = async (title, lyric, style, callback) => {
  const taskid = await fetchJSON("./api/fetchGenerateMusicCustom"
    + "?prompt=" + encodeURIComponent(lyric)
    + "&title=" + encodeURIComponent(title)
    + "&style=" + encodeURIComponent(style)
  );
  await waitGenerateMusic(taskid, callback);
};

// callback(audi1, audi2)
export const generateMusicInsturumental = async (title, style, callback) => {
  const taskid = await fetchJSON("./api/fetchGenerateMusicCustomInstrumental"
    + "?title=" + encodeURIComponent(title)
    + "&style=" + encodeURIComponent(style)
  );
  await waitGenerateMusic(taskid, callback);
};

// callback(audi1, audi2)
export const generateMusicSimple = async (prompt, callback) => {
  const taskid = await fetchJSON("./api/fetchGenerateMusicSimple"
    + "?prompt=" + encodeURIComponent(prompt)
  );
  await waitGenerateMusic(taskid, callback);
};

const waitGenerateMusic = async (taskid, callback) => {
  for (let i = 0; i < 5 * 60; i++) {
    await sleep(1000);
    try {
      const res = await checkMusic(taskid, callback);
      if (res) return;
    } catch (e) {
      console.log(e);
      if (e.message == "timeout") continue;
      throw e;
    }
  }
};

const checkMusic = async (taskid, callback) => {
  const json = await fetchJSON("./api/fetchTask?taskId=" + taskid);
  if (!json.data) {
    if (json.err == "not yet") return false;
    throw new Error(json.err);
  }
  const data = json.data.data;
  if (!data) {
    throw new Error(json.msg);
  }
  const audio = (d) => d.audio_url ? d.audio_url : d.stream_audio_url;
  const music1 = audio(data[0]);
  const music2 = audio(data[1]);
  callback(music1, music2, data[0], data[1]);
  return json.data.callbackType == "complete";
};
