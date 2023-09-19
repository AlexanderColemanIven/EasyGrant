import React, { useEffect, useState, Component } from 'react';
import './App.css';
import './frontend/grant-query';
import { Grant } from './frontend/grant-query';

class App extends Component {
  constructor(props) {
    super(props);
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
      const response = await fetch('/api/hello');
      const body = await response.text();
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
      if (body.express){
        let results = [];
        body.express.map((obj) => {
          results.push(Object.entries(obj));
        });
        this.setState({responseToPost: results});
      }else {
        this.setState({responseToPost: [""]});
      }
    };

    // This actually renders the data to the DOM
    render() {
      let {response, post, responseToPost} = this.state;
      console.log(responseToPost);
      return (
      <div>
        <header class="title">
          EasyGrant$
        </header>
        <div class="server-response">
          <p>{response}</p>
        <form onSubmit={this.handleSubmit}>
          <p>
            <strong>Post to Server:</strong>
          </p>
          <input
            type="text"
            value={post}
            onChange={e => this.setState({ post: e.target.value })}
          />
          <button type="submit">Submit</button>
          
        </form>
        <div>
          {responseToPost.map((obj) => {
          return <Grant grant={obj}></Grant>;})}
          </div>
        </div>
      </div>
      )
    }
}

export default App;