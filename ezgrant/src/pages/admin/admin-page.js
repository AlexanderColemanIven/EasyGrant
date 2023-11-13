import React, { useState, useEffect } from "react";
import moment from "moment";
import { Form, Input, Button, Alert, Layout, Menu, Dropdown, Table, message} from 'antd';
import "./admin-page.css";
import { Card, Empty } from 'antd';
import {
  EnvironmentOutlined, DollarCircleOutlined, CalendarOutlined,
  TagsOutlined, UserOutlined, IdcardOutlined, LinkOutlined,
  InfoCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

function ExpandedGrantCard({ grant }) {
  // Define the structure of your expanded grant card here
  return (
    <Card title={grant.name}>
      <p>Amount: {grant.amount}</p>
      <p>Deadline: {grant.deadline}</p>
      {/* ... other grant details */}
    </Card>
  );
}



function AdminPage() {
  const logout = () => {
    setIsSubmitted(false);
  };
  const [grants, setGrants] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [form] = Form.useForm();
  const [isViewing, setIsViewing] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const errors = {
    uname: "Invalid username",
    pass: "Invalid password"
  };
  const menu = (
    <Menu>
      <Menu.Item key="1">
        Settings
      </Menu.Item>
      <Menu.Item key="2" onClick={logout}>
        Log Out
      </Menu.Item>
    </Menu>
  );
  const handleDelete = async (grant) => {
    try {
      const response = await fetch(`/api/removeFromGrantQueue/${grant.id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Network response failed.');
      }
  
      const newGrants = grants.filter((g) => g.id !== grant.id);
      setGrants(newGrants);
      message.success('Grant deleted successfully!');
    } catch (error) {
      console.error('Fetch Error:', error);
      message.error('Failed to delete the grant.');
    }
  };
  const handleModify = () => {
    // Placeholder for future implementation (baseed on discussion with team)
  };

  const TimeAgo = ({ date }) => {
    // Create a moment object from the passed date prop
    const timeAgo = moment(date).fromNow();
  
    // Render it in your component
    return <span>{timeAgo}</span>;
  };
  
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline) => {
        // Format the date to show full month name, day, and full year
        return deadline ? moment(deadline).format('MMMM D YYYY') : 'No deadline set';
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Eligibility',
      dataIndex: 'eligibility',
      key: 'eligibility',
    },
    {
      title: 'Date Submitted',
      dataIndex: 'dateSubmitted',
      key: 'dateSubmitted',
      render: (date) => {
        return date ? moment(date).fromNow() : 'Time unavailable';
      },
    },
    
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <span>
          { <button onClick={() => handleView(record)}>View</button> }
          { <button onClick={() => handleModify(record)}>Modify</button> }
          { <button onClick={() => handleDelete(record)}>Delete</button> }
        </span>
      ),
    },
  ];

  const handleView = (grant) => {
    setIsViewing(true);
    setSelectedGrant(grant);
  };
  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const response = await fetch('/api/getGrantQueue');
        if (!response.ok) {
          throw new Error('HTTP error! status: ${response.status}');
        }
        const data = await response.json();
        console.log("Grants data: ", data);  // Log grants data to the console
        setGrants(data);
    }
      catch (error) {
        console.error('Fetch Error:', error);
      }
    };
  
    fetchGrants();
  }, []);
 
  
  const handleSubmit = async (values) => {
    const { uname, pass } = values;
   
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post: [uname, pass] }),
      });

      if (!response.ok) {
        throw new Error('Network response failed.');
      }

      const body = await response.json();
      if(body.express.match_username && body.express.match_password) {
        setIsSubmitted(true);
        setErrorMessages({});
        setLoggedInUser(uname);
      } else {
        setErrorMessages({
          name: body.express.match_username ? "pass" : "uname",
          message: body.express.match_username ? errors.pass : errors.uname
        });
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  };
  const ExpandedGrantCard = ({ grant }) => {
    return (
      <Card
        title={grant.name}
        className="expanded-card"
        style={{
          width: '100%',
          maxHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        <div>
          <span className="grant-field-icon"><IdcardOutlined /></span>
          <span className="grant-field-name">Name</span>-<span className="grant-field-value">{grant.name}</span>
        </div>
        <div>
          <span className="grant-field-icon"><DollarCircleOutlined /></span>
          <span className="grant-field-name">Amount</span>-<span className="grant-field-value">{grant.amount}</span>
        </div>
        <div>
          <span className="grant-field-icon"><CalendarOutlined /></span>
          <span className="grant-field-name">Deadline</span>-<span className="grant-field-value">{new Date(grant.deadline).toLocaleDateString()}</span>
        </div>
        {/* ... (other fields) */}
      </Card>
    );
  };

  return (
    <div className="admin-page">
      <header className="home-page-title">
        <a href="/" className="logo" style={{ cursor: 'pointer', color: 'white', textDecoration: 'none'} }>
            EasyGrants
        </a>
      </header>
      {isSubmitted ? (
        <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
          <Header className="admin-header">
            <div className="admin-user-info">
              <Dropdown overlay={menu}>
                <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                  {loggedInUser} <UserOutlined />
                </a>
              </Dropdown>
              <Button
                type="link"
                style={{ color: '#1890ff' }}
                onClick={() => window.location.href = '/'}
              >
                Home
              </Button>
            </div>
          </Header>
          <Content className="admin-content">
            {isViewing ? (
              <div onClick={() => setIsViewing(false)}>
                <ExpandedGrantCard grant={selectedGrant} />
              </div>
            ) : grants.length > 0 ? (
              <Table dataSource={grants} columns={columns} rowKey="id" />
            ) : (
              <Empty description="No user-submitted grants yet!" />
              )}
          </Content>
        </Layout>
      ) : (
        <div className="admin-signin-container admin-signin-background">
          <div className="admin-page-title">Sign In</div>
          <Form form={form} onFinish={handleSubmit}>
            <Form.Item
              data-testid="username-input"
              label="Username"
              name="uname"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              data-testid="password-input"
              label="Password"
              name="pass"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button data-tesid="submit" type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
            {errorMessages.name && (
              <Alert message={errorMessages.message} type="error" showIcon />
            )}
          </Form>
        </div>
      )}
    </div>
  );
  
}

export default AdminPage;