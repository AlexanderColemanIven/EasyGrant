import React, { useEffect, useState, Component } from 'react';
import './App.css';

//const oracledb = require('oracledb');
//oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

class App extends Component {
  constructor(props) {
    super(props);
    // Initialize state first
    this.state = {
        response: '',
        post: '',
        responseToPost: [],
     }
    }
  
    componentDidMount() {

      this.callApi()
      .then(res => this.setState({ response: res.express}))
      .catch(err => console.log(err));
    }

    callApi = async () => {
      const response = await fetch('/api/hello')[0];
      const body = await response
      if (response.status !== 200) throw Error(body.message);
      
      return JSON.stringify(body);
    };
    
    handleSubmit = async e => {
      e.preventDefault();
      const response = await fetch('/api/world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: this.state.post }),
      });
      const body = await response.json();
      this.setState({ responseToPost: Object.entries(body.express) });
    };

    // This actually renders the data to the DOM
    render() {
      // Extract states in the local variable (state is confusing dw about it)
      let {users, err, isLoading} = this.state;
      if(err) {
          // Render the error message cause why make you open the console
          return (
          <div> { err.message } </div>
          )
      }
      if(isLoading) {
          return (
          <div> Loading... </div>
          )
      }
      return (
      <div>
        <header class="title">
          Communicating with the Database
        </header>
        <div class="server-response">
          <p>{this.state.response}</p>
        <form onSubmit={this.handleSubmit}>
          <p>
            <strong>Post to Server:</strong>
          </p>
          <input
            type="text"
            value={this.state.post}
            onChange={e => this.setState({ post: e.target.value })}
          />
          <button type="submit">Submit</button>
        </form>
        <div>{this.state.responseToPost.map(([object_key,value], index) => {
          return <li key={index}>{object_key}: {value}</li>;
        })}</div>
        </div>
      </div>
      )
  }
  

}

export default App;

