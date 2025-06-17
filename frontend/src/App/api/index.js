const apiRoot = "http://localhost:5000/";

export const postAudio = (audio, prompt, uuid, updating_old) => {
  return fetch(
    apiRoot +
      `api/audio/?uuid=${uuid}&prompt=${prompt}&updating_old=${updating_old}`,
    {
      method: "POST",
      body: audio,
      headers: {
        "Content-Type": "audio/wav",
      },
    }
  );
};

export const getPrompt = (uuid, idx) => {
  return fetch(apiRoot + `api/prompt/?uuid=${uuid}&idx=${idx}`, {
    method: "GET",
  });
};

export const getUser = (uuid) => {
  return fetch(apiRoot + `api/user/?uuid=${uuid}`, {
    method: "GET",
  });
};

export const getAudioLen = (uuid, audio) => {
  return fetch(apiRoot + `api/audio/?uuid=${uuid}&get_len=True`, {
    method: "POST",
    body: audio,
    headers: {
      "Content-Type": "audio/wav",
    },
  });
};

export const getAudio = (audio_id, uuid) => {
  return fetch(apiRoot + `api/audio/?audio_id=${audio_id}&uuid=${uuid}`, {
    method: "GET",
  });
};

export const createUser = (uuid, name) => {
  const data = {
    uuid: uuid,
    user_name: name,
  };
  return fetch(apiRoot + `api/user/`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};
