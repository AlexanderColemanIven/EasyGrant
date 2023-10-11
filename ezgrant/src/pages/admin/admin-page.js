import React, { useState } from "react";
import { Form, Input, Button, Alert, Layout, Menu, Dropdown } from 'antd';
import {UserOutlined} from '@ant-design/icons';
import "./admin-page.css";

const { Header, Content, Sider } = Layout;

function AdminPage() {
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form] = Form.useForm();

  const errors = {
    uname: "Invalid username",
    pass: "Invalid password"
  };
  const menu = (
    <Menu>
      <Menu.Item key="1">
        Settings
      </Menu.Item>
      <Menu.Item key="2">
        Log Out
      </Menu.Item>
    </Menu>
  );
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

  return (
    <div className="admin-page">
      {isSubmitted ? (
        <Layout style={{ minHeight: '100vh', minWidth: '100vw'}}>
          <Header className="admin-header">
            <Button type="text" className="grant-button">View Grant Submissions</Button>
            <div className="admin-user-info">
              <Dropdown overlay={menu}>
                <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                  Emily Martin <UserOutlined />
                </a>
              </Dropdown>
            </div>
          </Header>
          <Content className="admin-content">
            {/* More admin functionalities here */}
          </Content>
        </Layout>
      ) : (
        <div className="admin-signin-container admin-signin-background">
          <div className="admin-page-title">Sign In</div>
          <Form form={form} onFinish={handleSubmit}>
            <Form.Item
              label="Username"
              name="uname"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Password"
              name="pass"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
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
