

import React, { Component } from 'react';
import './home-page.css';
import Grant from '../../components/grant-query';

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
        response: '',
        post: '',
        responseToPost: [],
        selectedAmount: '',
        selectedDate: '',
        selectedEligibility: ''
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
      } else {
        this.setState({responseToPost: [""]});
      }
    };

    render() {
      let {response, post, responseToPost} = this.state;
      return (
      <div>
        <header className="home-page-title">
          <span>EasyGrants</span>
          <div className="header-buttons">
            <button onClick={() => window.location.href="/admin"}>Admin</button>
            <button>Sign In</button>
            <button>Register</button>
            <button>About Us</button>
          </div>
        </header>
        <div className="search-section">
          <form onSubmit={this.handleSubmit}>
            <input
              type="text"
              className="home-page-search"
              value={post}
              onChange={e => this.setState({ post: e.target.value })}
              placeholder="Enter keyword..."
            />
            <div className="button-group">
              <button type="submit">Post Grants</button>
              <button>Search by Eligibility</button>
              <button>Date</button>
              <button>Amount</button>
            </div>
            <div>
                <select className="dropdown" onChange={e => this.setState({ selectedAmount: e.target.value })}>
                    <option value="">Select Amount Range</option>
                    <option value="1-1000">1-1000</option>
                    <option value="1000-10000">1000-10000</option>
                    <option value="10000-20000">10000-20000</option>
                    <option value="20000-30000">20000-30000</option>
                    <option value="40000-50000">40000-50000</option>
                    <option value="50000+">50000+</option>
                </select>
                <input type="date" className="date-input" onChange={e => this.setState({ selectedDate: e.target.value })} />
                <select className="dropdown" onChange={e => this.setState({ selectedEligibility: e.target.value })}>
                    <option value="">Select Eligibility</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>
          </form>
        </div>
        {responseToPost.length > 0 && 
        <div className="display-box">
          {responseToPost.map((obj) => {
            return <Grant grant={obj}></Grant>;
          })}
        </div>}
      </div>
      )
    }
}

export default HomePage;