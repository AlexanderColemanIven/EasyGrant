import React, { useEffect, useState, Component } from 'react';
import './easy-grants.css'
import Grant from '../grant-query';
import { Input } from 'antd';

class EasyGrants extends Component {
  constructor(props) {
    super(props);
    this.state = {
        response: '',
        post: '',
        responseToPost: [],
     }
    }
    
    handleSubmit = async e => {
      e.preventDefault();
      const response = await fetch('/api/database', {
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
          EasyGrants
        </header>
        <div class="server-response">
          <p>{response}</p>
        <form onSubmit={this.handleSubmit}>
          <p>
            <strong>Post to Server:</strong>
          </p>
          <Input.Search
            placeholders="input search text"
            enterButton="submit"
            size="large"
            value={post}
            type="text"
            onChange={e => this.setState({ post: e.target.value})}
            onSearch={this.handleSubmit}
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

export default EasyGrants;