import React, { Component } from 'react';
import { Input, Button, Select, DatePicker  } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Grant from '../../components/grant-query';
import './home-page.css';

const { Search } = Input;
const { Option } = Select;

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: '',
      responseToPost: [],
      selectedAmount: '',
      selectedDate: '',
      selectedEligibility: ''
    };
  }

  handleSubmit = async value => {
    // If no value is passed, use the state's post
    const searchValue = value || this.state.post;
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: searchValue }),
      });
      const body = await response.json();
      this.setState({
        responseToPost: body.express ? body.express.map(obj => Object.entries(obj)) : [],
      });
    } catch (error) {
      console.error('Error during fetch operation:', error);
    }
  };

  redirectToHome = () => {
    window.location.href = '/';
  };

  render() {
    const { post, responseToPost } = this.state;
    return (
      <div>
        <header className="home-page-title">
          <span className="logo" onClick={this.redirectToHome}style={{ cursor: 'pointer' }}>
            EasyGrants
          </span>
          <div className="header-buttons">
            <Button onClick={() => window.location.href="/postGrantsUser"}>Post a Grant</Button>
            <Button>About Us</Button>
          </div>
        </header>
        <div className="home-page-search">
        <Search
          value={post}
          onChange={e => this.setState({ post: e.target.value })}
          placeholder="Enter keyword..."
          onSearch={this.handleSubmit}
          enterButton={<Button icon={<SearchOutlined />} />} 
        />
        <div className="form-controls">
            <Select
              className="form-control"
              onChange={selectedAmount => this.setState({ selectedAmount })}
              placeholder="Select Amount Range"
            >
              <Option value="1000">Up to $1,000</Option>
              <Option value="2000">Up to $2,000</Option>
              <Option value="3000+">$3,000+</Option>
              {/* ... other options */}
            </Select>
            <DatePicker
              className="form-control"
              onChange={(date, dateString) => this.setState({ selectedDate: dateString })}
            />
            <Select
              className="form-control"
              onChange={selectedEligibility => this.setState({ selectedEligibility })}
              placeholder="Select Eligibility"
              dropdownRender={menu => <div>{menu}</div>} // To handle custom dropdown visibility
            >
              {/* ...options */}
            </Select>
          </div>
        </div>
        {responseToPost.length > 0 && (
          <div className="display-box">
            {responseToPost.map((obj, index) => (
              <Grant key={index} grant={obj} />
            ))}
          </div>
        )}
        </div>
    );
  }
}

export default HomePage;
