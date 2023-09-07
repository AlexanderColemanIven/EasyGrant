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
        responseToPost: '',
     }
    }
  
    componentDidMount() {

      this.callApi()
      .then(res => this.setState({ response: res.express }))
      .catch(err => console.log(err));

      /*

      this.setState({ isLoading: true })
      let api_url = 'https://api.github.com/users';
      fetch(api_url).then(res => {
        // Handle if fetch gives a 404 error
        if(res.status >= 400) {
            throw new Error("Server responds with error!");
        }
        return res.json();
      }).then(
        users => {
          this.setState({
              users,
              isLoading: false
          })
      },
      // Idk man just handle any weird errors
      err => {
          this.setState({
              err,
              isLoading: false
          })
      }
      );
      //connectDB();
      */
    
    }

    callApi = async () => {
      const response = await fetch('/api/hello');
      const body = await response.json();
      if (response.status !== 200) throw Error(body.message);
      
      return body;
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
      const body = await response.text();
      
      this.setState({ responseToPost: body });
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
          Here is communication with a server (will be replaced by DB)
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
        <p>{this.state.responseToPost}</p>
        </div>
      </div>
      )
  }
  

}

/*
async function connectDB(){
  try{
  let conn = await oracledb.getConnection( {
    user:"ADMIN",
    password:"Bucknell17837",
    connectionString:"(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.us-ashburn-1.oraclecloud.com))(connect_data=(service_name=g2751c4161aebe7_ezgrantdatabase_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))"
  });

  const data = await conn.execute(`SELECT * FROM *`);

  console.log(data.rows);
  }catch(error){
    console.log(error);
  }
}
*/

export default App;

