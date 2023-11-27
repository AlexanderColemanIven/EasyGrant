import React, { Component } from 'react';
import { Button, Input, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './home-page.css';
import Grant from '../../components/grant-query';
const { Search } = Input; 

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
    handleSubmit = async (value) => {
      // 'value' is the search term input by the user, not an event object
      try {
        const response = await fetch('/api/database', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ post: value }), // Use 'value' directly
        });
    
        const body = await response.json();
        if (body.express) {
          let results = body.express.map(obj => Object.entries(obj));
          this.setState({ responseToPost: results });
        } else {
          this.setState({ responseToPost: [] }); // Use an empty array instead of an array with an empty string
        }
      } catch (error) {
        console.error('Error during fetch operation:', error);
        this.setState({ responseToPost: [] }); // Handle the error case
      }
    };

    render() {
      const { post, responseToPost } = this.state;
      return (
        <div className="home-page-container"> {/* Updated container class */}
          <header className="site-header">
            <span className="site-logo" onClick={this.redirectToHome}>
              EasyGrants
            </span>
            <div className="action-buttons"> {/* Updated class for action buttons */}
              <Button onClick={() => window.location.href="/postGrantsUser"}>Post a Grant</Button>
              <Button>About Us</Button>
            </div>
          </header>
          <div className="search-bar-container"> {/* Updated search container class */}
            <Search
              className="search-input" 
              value={this.state.post}
              onChange={e => this.setState({ post: e.target.value })}
              placeholder="Enter keyword..."
              onSearch={this.handleSubmit}
              enterButton={
                <Button className="search-button" icon={<SearchOutlined />}>Search</Button> 
              }
            />
            <div className="search-form-controls"> 
              <Select
                className="search-form-control" 
                onChange={selectedAmount => this.setState({ selectedAmount })}
                placeholder="Select Amount Range"
              >
                {/* ...options */}
              </Select>
              <DatePicker
                className="search-form-control"
                onChange={(date, dateString) => this.setState({ selectedDate: dateString })}
              />
              <Select
                className="search-form-control" 
                onChange={selectedEligibility => this.setState({ selectedEligibility })}
                placeholder="Select Eligibility"
                dropdownRender={menu => <div>{menu}</div>} // To handle custom dropdown visibility
              >
                {/* ...options */}
              </Select>
            </div>
          </div>
          {responseToPost.length > 0 && (
            <div className="grants-list-header"> {/* Updated class for grants list header */}
              <div className="grant-detail">Title</div>
              <div className="grant-detail">Deadline</div>
              <div className="grant-detail">Location</div>
              <div className="grant-detail">Notes</div>
            </div>
          )}
          {responseToPost.map((obj, index) => (
            <div className="grant-card-container" key={index}> {/* Updated class for grant card */}
              <Grant grant={obj} />
            </div>
          ))}
        </div>
      );
    }
    
}

export default HomePage;