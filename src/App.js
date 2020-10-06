import React, { Component} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

import {  interpret,  } from "xstate";
import { stateMachine } from './machine'

const fromHex = hexString =>
    new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));




export class App extends Component {
  constructor() {
    super();
    this.state = {  room_name: "",
    token: "",
    verification : "" , current: stateMachine.initialState , privateKey : "05cd0aec35c817ea43f34117f77fa910df15d527e75ac4c1144e545563293905"}

}
  
  componentDidMount() {
    this.loadWasm();
    this.service.start();

  }
  
  componentWillUnmount() {
    this.service.stop();
  }

  loadWasm = async () => {
    try {
      const wasm = await import("biscuit-wasm");
      this.setState({ wasm });
    } catch (err) {
      console.error(`Unexpected error in loadWasm. [Message: ${err.message}]`);
    }
  };
  
  service = interpret(stateMachine).onTransition(current =>
    this.setState({ current })
  );








  render() {
    const { current } = this.state;
    const { send } = this.service;
    
    const { wasm = {} } = this.state;
    const loadKeys = () => {
      let decoded = fromHex(this.state.privateKey);
      return wasm.KeyPair.fromBytes(decoded);
  }
    return (
      <div>
        <div className="pill-container">
          <div className="state-pill">current state: {current.value}</div>
        </div>

        <div className="form-container">
          <div className="form-header">
            <h2>Building rooms unlocker</h2>
          </div>

          {current.matches("error") ? (
            <div className="alert error">
              {current.context.msg
                ? current.context.msg
                : "Oh no! No error message."}
            </div>
          ) : null}
          {current.matches("success") ? (
          <div className="alert success">
            {current.context.msg
              ? current.context.msg
              : "Oh no! No error message."}
          </div>
        ) : null}

          <div className="form-body">
            <form
              onSubmit={e => {
                
                e.preventDefault();
                send({ type: "SUBMIT", data: { ...this.state } });
              }}
            >
              <div className="form-group">
                <label htmlFor="Room_name">Room's name</label>
                <input
                  id="Room_name"
                  className="form-control"
                  type="text"
                  maxLength="255"
                  value={this.state.name}
                  onChange={e => this.setState({ room_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Token">Token</label>
                <input
                  id="Token"
                  className="null card-image form-control"
                  type="text"
                  value={this.state.token}
                  onChange={e => this.setState({ token: e.target.value })}
                />
              </div>
              <button
                id="VerifButton"
                className="btn btn-block btn-success submit-button"
                type="submit"
                
                onClick={async (e) => {
                  let data = new Uint8Array(atob(this.state.token).split("").map(function (c) {
                    return c.charCodeAt(0);
                }));
                  let token = wasm.Biscuit.from(data);
                  let verifier = new wasm.Verifier()
                  verifier.addResource(this.state.room_name);
                  verifier.addOperation("open");
                  verifier.addFact(wasm.fact(
                      "owner",
                      [{ symbol: "ambient" }, { symbol: "alice" }, { string: this.state.room_name }],

                  ))
                  
                  let rule = wasm.rule(
                      "right",
                      [{ symbol: "right" }],
                      [
                          {
                              name: "right",
                              ids: [{ symbol: "authority" }, { string: this.state.room_name }, { symbol: "open" }]
                          }
                      ]
                  )
                  verifier.addCaveat(rule);
                  let decoded = fromHex(this.state.privateKey);
                  let k = wasm.KeyPair.fromBytes(decoded);
                  try {
                      let result = verifier.verify(k.publicKey(), token);
                      this.setState({ verification: "OK" });
                      //wait two seconds to retain the modification of the state
                      await new Promise(r => setTimeout(r, 2000));
                      
                    } catch(error) {
                      this.setState({ verification: "FAILED" });
                    }
                    e.preventDefault();
                    send({ type: "SUBMIT", data: { ...this.state } });
              }}>
              
                <span className="submit-button-lock" />
                <span className="align-middle">Open Now</span>
              </button>
             
            </form>
          </div>
        </div>
      </div>

    );
  }
}

export default App;
