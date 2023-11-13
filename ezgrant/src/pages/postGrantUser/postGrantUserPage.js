import React, {useState} from 'react';
import moment from 'moment';
import { Form, Input, InputNumber, Button, Select, DatePicker, message, Menu} from 'antd';
const { TextArea } = Input;
const { Option } = Select;
const PostGrantPage = () => {
  const [form] = Form.useForm();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const onFinish = async (values) => { 
    const dateSubmitted = moment().format(); // This will give you the current date and time
    // Include this in the data you send to your API
    const grantData = {
      ...values,
      dateSubmitted: dateSubmitted
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
      form.resetFields(); 
    } catch (error) {
      console.error('Fetch Error:', error);
      message.error('Failed to submit the grant.');
  }
  };
  const handleCategoryChange = (value, option) => {
    // Handle category change
  };

  const validateDeadline = (_, value) => {
    if (!value) {
      // If no value is provided, the field is required
      return Promise.reject(new Error('Please select a deadline.'));
    } else if (value.isBefore(moment().startOf('day'))) {
      // If the selected date is before the start of today, reject the promise
      return Promise.reject(new Error('Grant deadline cannot be in the past!'));
    }
    // Otherwise, resolve the promise (the date is either today or in the future)
    return Promise.resolve();
  };
  
  
  
  console.log("PostGrantPage component is rendering");
  
  return (
    <div>
       <header className="home-page-title">
       <a href="/" className="logo" style={{ cursor: 'pointer', color: 'white', textDecoration: 'none'} }>
            EasyGrants
          </a>
          <div className="header-buttons">
            <Button>About Us</Button>
          </div>
        </header>
      <h1>Post a New Grant</h1>
      <Form layout="vertical" onFinish={onFinish} form={form}>
        <Form.Item label="Grant Name" name="name" rules={[{ required: true }]}>
          <Input style={{ maxWidth: '400px' }} />
        </Form.Item>

        <Form.Item label="Link" name="link" rules={[{ required: true }]}>
          <Input style={{ maxWidth: '400px' }} />
        </Form.Item>

        <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
          <InputNumber />
        </Form.Item>

        <Form.Item label="Deadline" name="deadline" rules={[{ required: true, validator: validateDeadline }]}>
          <DatePicker />
        </Form.Item>



        <Form.Item label="Category" name="category">
          <Select
          style={{ maxWidth: '200px' }} 
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
          <Input.TextArea
            style={{ maxWidth: '1400px' }} 
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea 
           style={{ maxWidth: '1400px' }} 
           autoSize={{ minRows: 2, maxRows: 6 }}
          />
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