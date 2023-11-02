import React, {useState} from 'react';
import moment from 'moment';
import { Form, Input, InputNumber, Button, Select, DatePicker, message } from 'antd';
const { TextArea } = Input;
const { Option } = Select;
const PostGrantPage = () => {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const onFinish = async (values) => { 
    const grantWithDate = {
      ...values,
      dateSubmitted: new Date(),
    };
    try {
      const response = await fetch('/api/addToGrantQueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
  
      if (!response.ok) {
        throw new Error('Network response failed.');
      }
  
      const body = await response.json();
      console.log(body.message);
      message.success('Grant submitted successfully!');
    } catch (error) {
      console.error('Fetch Error:', error);
      message.error('Failed to submit the grant.');
  }
  };
  const handleCategoryChange = (value, option) => {
    // Handle category change
  };

  const validateDeadline = (_, value) => {
    if (!value || value.isAfter(moment())) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('Grant deadline cannot be in the past!'));
  };
  
  console.log("PostGrantPage component is rendering");
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Button type="primary" style={{ marginRight: '10px' }} onClick={() => window.location.href='/'}>
          Homepage
        </Button>
        <Button type="primary" onClick={() => window.location.href='/admin'}>
          Admin
        </Button>
      </div>
      <h1>Post a New Grant</h1>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Grant Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        
        <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
          <InputNumber />
        </Form.Item>

        <Form.Item label="Deadline" name="deadline" rules={[{ required: true, validator: validateDeadline }]}>
          <DatePicker />
        </Form.Item>


        <Form.Item label="Category" name="category">
          <Select
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            <Select.Option value="science">Science</Select.Option>
            <Select.Option value="arts">Arts</Select.Option>
            {/* Add more options here */}
          </Select>
        </Form.Item>

        <Form.Item label="Eligibility Criteria" name="eligibility">
          <Input.TextArea />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea />
        </Form.Item>

        {/* Add more fields as necessary */}

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PostGrantPage;