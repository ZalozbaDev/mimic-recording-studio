import React, { Component } from "react";
// import { history } from "react-router-dom";
import { getName, saveName, getUUID, saveUUID, removeData } from "./api/localstorage";

class Intro extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: undefined,
      uuid: undefined
    };
  }

  componentDidMount() {
    const name = getName();
    if (name) {
      this.setState({ name });
    }
    const uuid = getUUID();
    if (uuid) {
      this.setState({ uuid });
    }
  }

  render() {
    return (
      <div className="page-intro">
        <div id="PageIntro">
          <h2 style={{ color: "#FD9E66" }}>Mimic Recording Studio</h2>
          <h1>Help us build the voice(s) of Mycroft!</h1>
          <p>
            Mycroft's open source Mimic technologies are Text-to-Speech engines,
            which take a piece of written text and convert it into spoken audio.
            The latest generation of this technology uses machine learning
            techniques to create a model, which can speak a specific language,
            sounding like the voice on which it was trained.
          </p>
          <p>
            The Mimic Recording Studio simplifies the collection of training data from
            individuals, each of which can be used to produce a distinct voice
            for Mimic.
          </p>

          {getUUID() ? this.renderWelcomeBackMsg() : this.renderInput()}
          <div className="btn_PageIntro">
            <button
              id="btn_PageIntro"
              className="btn"
              onClick={this.handleTrainMimicBtn}
            >
            Record
            </button>
          </div>
          {this.renderForget()}
        </div>
      </div>
    );
  }
  
  renderForget = () => {
  	  return (
  		(() => {
			if ((this.state.name !== undefined) || (this.state.uuid !== undefined)) {
				return (
				<div className="btn_PageIntroForget">
				<button
				  id="btn_PageIntroForget"
				  className="btn"
				  onClick={this.handleForget}
				>
				Forget
				</button>
                </div>
				);
			}
		})()
	);
  };  

  renderInput = () => {
    return (
      <div>
        <p>To get started, enter your name and date and hit the Record button.</p>
        <input
          type="text"
          id="yourname"
          placeholder="e.g. hilzaneplic"
          onChange={this.handleInput}
        />
        <input
          type="text"
          id="yourdate"
          placeholder="e.g. 1945-07-12"
          onChange={this.handleDate}
        />
      </div>
    );
  };

  renderWelcomeBackMsg = () => {
    return (
      <div>
        <p>Welcome back {this.state.name}_{this.state.uuid}!</p>
        <p>Hit RECORD to continue recording</p>
        <p>Hit FORGET to enter different name and date</p>
      </div>
    );
  };

  handleInput = e => {
    this.setState({ name: e.target.value });
  };

  handleDate = e => {
    this.setState({ uuid: e.target.value });
  };

  handleTrainMimicBtn = () => {
    if ((this.state.name === undefined) || (this.state.uuid === undefined)) {
      alert("Please input a name and date before proceeding!");
    } else {
	  saveName(this.state.name);
	  saveUUID(this.state.uuid);
	  this.props.history.push('/record')
    }
  };
  
  handleForget = () => {
  	  this.setState({ name: undefined })
  	  this.setState({ uuid: undefined })
  	  removeData();
  };

}

export default Intro;
