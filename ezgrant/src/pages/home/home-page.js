import React, { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './home-page.css';
import Grant from '../../components/grant-query';

const { Search } = Input;

const HomePage = () => {
  const [state, setState] = useState({
    response: '',
    post: '',
    responseToPost: [],
    selectedAmount: '',
    selectedDate: '',
    selectedEligibility: ''
  });

  const setResponseToPost = (data) => {
    setState((prevState) => ({ ...prevState, responseToPost: data }));
  };

  useEffect(() => {
    const fetchMainGrantQueue = async () => {
      try {
        const response = await fetch('/api/getMainGrantQueue', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const body = await response.json();
        if (body.express) {
          const results = body.express.map((obj) => Object.entries(obj));
          setResponseToPost(results);
        } else {
          setResponseToPost([]);
        }
      } catch (error) {
        console.error('Error during fetch operation:', error);
        setResponseToPost([]);
      }
    };

    fetchMainGrantQueue();
  }, []);

  const handleSearch = async (value) => {
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: value }),
      });

      const body = await response.json();
      if (body.express) {
        let results = body.express.map((obj) => Object.entries(obj));
        setResponseToPost(results);
      } else {
        setResponseToPost([]);
      }
    } catch (error) {
      console.error('Error during fetch operation:', error);
      setResponseToPost([]);
    }
  };

  const redirectToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="home-page-container">
      <header className="home-site-header">
      <div className="home-site-logo" onClick={redirectToHome}>
          EasyGrants
        </div>
        <div className="action-buttons">
          <Button onClick={() => window.location.href="/postGrantsUser"}>Post a Grant</Button>
          <Button>About Us</Button>
        </div>
      </header>
      <div className="home-search-bar-container">
        <Search
          className="home-search-input" 
          value={state.post}
          onChange={(e) => setState((prevState) => ({ ...prevState, post: e.target.value }))}
          placeholder="Enter keyword..."
          onSearch={handleSearch}
          enterButton={<Button className="home-search-button" icon={<SearchOutlined />}>Search</Button>}
        />
        <div className="home-search-form-controls">
          <Select
            onChange={selectedAmount => setState({ ...state, selectedAmount })}
            placeholder="Select Amount Range"
          >
            {/* ...options */}
          </Select>
          <DatePicker
            onChange={(date, dateString) => setState({ ...state, selectedDate: dateString })}
          />
          <Select
            onChange={selectedEligibility => setState({ ...state, selectedEligibility })}
            placeholder="Select Eligibility"
            dropdownRender={menu => <div>{menu}</div>}
          >
            {/* ...options */}
          </Select>
        </div>
      </div>
      {state.responseToPost.length > 0 && (
        <div className="home-grant-header">
          <div className="home-grant-detail">Title</div>
          <div className="home-grant-detail">Deadline</div>
          <div className="home-grant-detail">Location</div>
          <div className="home-grant-detail">Notes</div>
        </div>
      )}
      {state.responseToPost.map((obj, index) => (
        <div className="home-grant-card-container" key={index}>
          <Grant grant={obj} />
        </div>
      ))}
    </div>
  );
};

export default HomePage;
