import React, { Component } from "react";
import { ReactMic as Visualizer } from "react-mic";
import Recorder from "./components/Recorder";
import PhraseBox from "./components/PhraseBox";
import Metrics from "./components/Metrics";
import hark from "hark";
import Wave from "./components/Wave";

// import microphoneSVG from './assets/microphone.svg'
import spacebarSVG from "./assets/space.svg";
import PSVG from "./assets/P.svg";
import rightSVG from "./assets/right.svg";
import SSVG from "./assets/S.svg";

import {
  postAudio,
  getPrompt,
  getUser,
  createUser,
  getAudioLen,
  getAudio,
} from "./api";
import { getUUID, getName } from "./api/localstorage";

class Record extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userCreated: false,
      shouldRecord: false,
      displayWav: false,
      blob: undefined,
      play: false,
      prompt: "*error loading prompt... is the backend running?*",
      language: "",
      promptNum: 0,
      totalTime: 0,
      totalCharLen: 0,
      audioLen: 0,
      showPopup: false,
      backIdx: 0,
      maxLoudnessDb: null,
    };

    this.name = getName();
    this.uuid = this.name + "_" + getUUID();
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown, false);
    this.requestUserDetails(this.uuid);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, false);
  }

  computeMaxLoudness = (blob) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0); // Use the first channel
      let maxAmplitude = 0;

      for (let i = 0; i < channelData.length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
      }

      const maxLoudnessDb = 20 * Math.log10(maxAmplitude);
      this.setState({
        maxLoudnessDb: maxLoudnessDb.toFixed(2),
      });
    };
    reader.readAsArrayBuffer(blob);
  };

  render() {
    return (
      <div id="PageRecord">
        <h1>Mimic Recording Studio: {this.uuid}</h1>
        <TopContainer
          userName={this.name}
          userID={this.uuid}
          route={this.props.history.push}
          show={this.state.showPopup}
          dismiss={this.dismissPopup}
        />
        <Metrics
          totalTime={this.state.totalTime}
          totalCharLen={this.state.totalCharLen}
          promptNum={this.state.promptNum}
          totalPrompt={this.state.totalPrompt}
          maxLoudnessDb={this.state.maxLoudnessDb}
        />
        <PhraseBox
          prompt={this.state.prompt}
          promptNum={this.state.promptNum}
          audioLen={this.state.audioLen}
          totalCharLen={this.state.totalCharLen}
          totalTime={this.state.totalTime}
        />
        <div className="wave-container" id="container">
          {this.state.displayWav ? this.renderWave() : this.renderVisualizer()}
          <Recorder
            command={this.state.shouldRecord ? "start" : "stop"}
            onStart={() => this.shoulddisplayWav(false)}
            onStop={this.processBlob}
            gotStream={this.silenceDetection}
          />
        </div>
        <div className="indicator-container">
          {this.state.shouldRecord
            ? "Read Now [Esc] to cancel"
            : "[Spacebar] to Start Recording [R] to review [S] to skip [->] for next"}
        </div>

        <div id="controls">
          <a
            id="btn_Play"
            className={`btn btn-play ${
              this.state.shouldRecord
                ? "btn-disabled"
                : this.state.play
                ? "btn-disabled"
                : null
            } `}
            onClick={this.jumpBack}
          >
            <i className="fas fa-backward ibutton" />
            Backward
          </a>
          <a
            id="btn_Play"
            className={`btn btn-play ${
              this.state.shouldRecord
                ? "btn-disabled"
                : this.state.blob === undefined
                ? "btn-disabled"
                : this.state.play
                ? "btn-disabled"
                : null
            } `}
            onClick={
              this.state.shouldRecord
                ? () => null
                : this.state.play
                ? () => null
                : this.playWav
            }
          >
            <i className="fas fa-play ibutton" />
            Review
          </a>
          <a
            id="btn_Next"
            className={`btn-next ${
              this.state.shouldRecord
                ? "btn-disabled"
                : this.state.blob === undefined
                ? "btn-disabled"
                : this.state.play
                ? "btn-disabled"
                : null
            }`}
            onClick={
              this.state.shouldRecord
                ? () => null
                : this.state.play
                ? () => null
                : this.onNext
            }
          >
            <i className="fas fa-forward ibutton-next" />
            Next
          </a>
        </div>
      </div>
    );
  }

  dismissPopup = () => {
    this.setState({
      showPopup: false,
    });
  };

  requestPrompts = async (uuid, idx = 0) => {
    try {
      const res = await getPrompt(uuid, idx).then((res) => res.json());
      if (!res.success) {
        console.log(
          "Error in getting prompts. You have jumped to the end of the corpus."
        );
        alert(
          "Error in getting prompts. You have jumped to the end of the corpus."
        );
        return null;
      } else if (res.data.prompt === "___CORPUS_END___") {
        this.setState({
          shouldRecord: false,
          prompt: "*no more phrases in corpus to record*",
          totalPrompt: res.data.total_prompt,
        });
        return null;
      } else if (res.success && res.data.prompt !== "___CORPUS_END___") {
        this.setState({
          prompt: res.data.prompt,
          totalPrompt: res.data.total_prompt,
          promptNum: res.data.prompt_num,
        });
        return res.data.audio_id; // Return the audio_id
      }
    } catch (error) {
      console.error("Error in requestPrompts:", error);
      return null;
    }
  };

  requestUserDetails = (uuid) => {
    getUser(uuid)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          this.setState({
            userName: res.data.user_name,
            language: res.data.language,
            promptNum: res.data.prompt_num,
            totalTime: res.data.total_time_spoken,
            totalCharLen: res.data.len_char_spoken,
          });
          this.requestPrompts(this.uuid);
        } else {
          if (this.uuid) {
            createUser(this.uuid, this.name)
              .then((res) => res.json())
              .then((res) => {
                if (res.success) {
                  this.setState({ userCreated: true });
                  this.requestPrompts(this.uuid);
                } else {
                  alert("sorry there is in error creating user");
                }
              });
          } else {
            alert("sorry there is in error creating user");
          }
        }
      });
  };

  renderWave = () =>
    this.state.blob.type !== undefined ? (
      <Wave
        className="wavedisplay"
        waveColor="#FD9E66"
        blob={this.state.blob}
        play={this.state.play}
        onFinish={this.stopWav}
      />
    ) : (
      <audio id="audioPlayback" controls />
    );

  renderVisualizer = () => (
    <Visualizer
      className="wavedisplay"
      record={this.state.shouldRecord}
      backgroundColor={"#222222"}
      strokeColor={"#FD9E66"}
    />
  );

  processBlob = (blob) => {
    this.setState({
      blob: blob,
    });

    getAudioLen(this.uuid, blob)
      .then((res) => res.json())
      .then((res) =>
        this.setState({
          audioLen: res.data.audio_len,
        })
      );

    // Calculate maximum loudness in dB
    this.computeMaxLoudness(blob);

    // Weird hack to make sure the wav display is updated
    // don't change this unless you know what you're doing
    this.shoulddisplayWav(false);
    this.shoulddisplayWav(true);
  };

  shoulddisplayWav = (bool) => this.setState({ displayWav: bool });

  playWav = () => this.setState({ play: true });

  stopWav = () => this.setState({ play: false });

  handleKeyDown = (event) => {
    // space bar code
    if (event.keyCode === 32) {
      if (!this.state.shouldRecord) {
        event.preventDefault();
        this.recordHandler();
      }
    }

    // esc key code
    if (event.keyCode === 27) {
      event.preventDefault();

      // resets all states
      this.setState({
        shouldRecord: false,
        displayWav: false,
        blob: undefined,
        promptNum: 0,
        totalTime: 0,
        totalCharLen: 0,
        audioLen: 0,
        play: false,
      });
    }

    // skip current phrase (S)
    if (event.keyCode === 83) {
      this.skipCurrent();
    }

    // play wav
    if (event.keyCode === 82) {
      this.playWav();
    }

    // next prompt
    if (event.keyCode === 39) {
      if (!this.state.play) {
        this.onNext();
      }
    }
  };

  recordHandler = () => {
    setTimeout(() => {
      this.setState((state, props) => {
        return {
          shouldRecord: true,
          play: false,
        };
      });
    }, 500);
  };

  onNext = () => {
    if (this.state.blob !== undefined) {
      if (this.state.backIdx > 0 && this.state.blob.type === undefined) {
        this.setState({
          backIdx: 0,
          displayWav: false,
          blob: undefined,
          audioLen: 0,
          maxLoudnessDb: null,
        });
        this.requestPrompts(this.uuid);
        this.requestUserDetails(this.uuid);
      } else {
        postAudio(
          this.state.blob,
          this.state.prompt,
          this.uuid,
          this.state.backIdx !== 0
        )
          .then((res) => res.json())
          .then((res) => {
            if (res.success) {
              this.setState({ displayWav: false });
              this.requestPrompts(this.uuid);
              this.requestUserDetails(this.uuid);
              this.setState({
                blob: undefined,
                audioLen: 0,
                backIdx: 0,
                maxLoudnessDb: null,
              });
            } else {
              alert("There was an error in saving that audio");
            }
          })
          .catch((err) => console.log(err));
      }
    }
  };

  jumpBack = async () => {
    let backIdx = this.state.backIdx + 1;
    this.setState((prevState) => ({
      backIdx: prevState.backIdx + 1,
      maxLoudnessDb: null,
    }));
    try {
      const audio_id = await this.requestPrompts(this.uuid, backIdx); // Await the audio_id
      if (audio_id) {
        const res = await getAudio(audio_id, this.uuid);
        const data = await res.json();
        const base64 = data.data;
        const mime = data.mime || "audio/wav";
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        const blob = new Blob([array], { type: mime });
        this.computeMaxLoudness(blob);
        const url = URL.createObjectURL(blob);
        this.setState({
          displayWav: true,
          blob: url,
        });
        let audio_player = document.getElementById("audioPlayback");
        audio_player.src = url;
        audio_player.play();
      }
    } catch (error) {
      console.error("Error in jumpBack:", error);
    }
  };

  skipCurrent = () => {
    // Send static text '___SKIPPED___' as prefix to original phrase to backend API for being filtered out.
    postAudio("", "___SKIPPED___" + this.state.prompt, this.uuid)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          this.setState({ displayWav: false });
          this.requestPrompts(this.uuid);
          this.requestUserDetails(this.uuid);
          this.setState({
            blob: undefined,
            audioLen: 0,
          });
        } else {
          alert("There was an error in saving that audio");
        }
      })
      .catch((err) => console.log(err));
  };

  silenceDetection = (stream) => {
    const options = {
      interval: "150",
      threshold: -80,
    };
    const speechEvents = hark(stream, options);

    speechEvents.on("stopped_speaking", () => {
      this.setState({
        shouldRecord: false,
      });
    });
  };
}

class TopContainer extends Component {
  render() {
    return this.props.show ? this.renderContainer() : null;
  }

  renderContainer = () => {
    return (
      <div className="top-container">
        <div className="top-container-info">
          <div className="instructions2">
            <i className="fas fa-info-circle" />
            <h2>HINTS</h2>
            <ul className="hints">
              <li>
                <img src={spacebarSVG} className="key-icon" alt="space" /> will
                start recording
              </li>
              <li>Recording will auto-stop after you speak</li>
              <li>
                <img src={PSVG} className="key-icon" alt="p" /> will play
                recorded audio
              </li>
              <li>
                <img src={rightSVG} className="key-icon" alt="->" /> will go to
                next prompt
              </li>
              <li>
                <img src={SSVG} className="key-icon" alt="->" /> skip current
                prompt
              </li>
            </ul>
          </div>
          <div className="session-info">
            <div className="top-info">
              <div>
                <h2>RECORDER</h2>
                &nbsp;
                <span id="sessionName">
                  {this.props.userName}_{this.props.userID}
                </span>
              </div>
              <div className="btn-restart" />
            </div>
            <hr />
            <p>
              It is very important that the recorded words{" "}
              <span className="highlight">
                match the text in the script exactly
              </span>
              . If you accidentally deviate from the script or are unsure,
              please record the prompt again.
            </p>
          </div>
        </div>
        <button className="btn info-btn" onClick={this.handleClick}>
          Tutorial
        </button>
        <button className="btn info-btn" onClick={this.props.dismiss}>
          Continue
        </button>
      </div>
    );
  };

  handleClick = () => {
    this.props.route("/tutorial");
  };
}

export default Record;
