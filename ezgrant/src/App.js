import React, { useEffect, useState, Component } from 'react';

import './App.css';
class App extends Component {
  constructor(props) {
    super(props);
    // Initialize state first
    this.state = {
        users: [],
        err: null,
        isLoading: false
     }
    }
  
    componentDidMount() {
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
    
    }

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
        <header>
          Idk, heres a list of sample github users to demo what an API req will look like:
        </header>
          {/* Here you can check whether the users array contains data or not. */}
          { users.length > 0 ?
              <ul>
                  {users.map( user => (
                      <li key={user.id} >
                          { user.login }
                      </li>
                  ))}
              </ul>
              : <div> No user found! </div> }
      </div>
      )
  }
  

}

export default App;
