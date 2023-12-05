import React, {useState} from 'react';
import moment from 'moment';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Button, Select, DatePicker, message, Menu} from 'antd';
const { TextArea } = Input;
const { Option } = Select;
const PostGrantPage = () => {
  const [form] = Form.useForm();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({});

  const postGrant = async (values) => { 
    // Log the form values
    const dateSubmitted = moment().format();
    values.DATESUBMITTED = dateSubmitted;
    values.DEADLINE = values.DEADLINE ? values.DEADLINE.format("MMMM D, YYYY") : null;
    
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

  const handleInputChange = (name, value) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleDatePickerChange = (date, fieldName) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [fieldName]: date ? date.format('MMMM D, YYYY') : null,
    }));
  };

  return (
    <div>
      <header className="home-page-title">
        <a href="/" className="logo" style={{ cursor: 'pointer', color: 'white', textDecoration: 'none' }}>
          EasyGrants
        </a>
        <div className="header-buttons">
          <Button>About Us</Button>
        </div>
      </header>
      <h1>Post a New Grant</h1>
      <Form form={form} onFinish={(values) => postGrant(values)}>
        <div>
          <Form.Item
            label="Title"
            name="NAME"
            rules={[
              { required: true, message: 'Please enter the title' },
              { max: 255, message: 'Title must be at most 255 characters' },
            ]}
          >
            <Input onChange={(e) => handleInputChange('NAME', e.target.value)} />
          </Form.Item>
        </div>
        <div>
          <Form.Item
            label="Location"
            name="LOCATION"
            rules={[
              { required: false, message: 'Please enter the location' },
              { max: 255, message: 'Location must be at most 255 characters' },
            ]}
          >
            <Input onChange={(e) => handleInputChange('LOCATION', e.target.value)} />
          </Form.Item>
        </div>
        <div>
          <Form.Item
            label="Link"
            name="LINK"
            rules={[
              { required: true, message: 'Please enter the link' },
              { max: 255, message: 'Link must be at most 255 characters' },
            ]}
          >
            <Input onChange={(e) => handleInputChange('LINK', e.target.value)} />
          </Form.Item>
        </div>
        <div>
          <Form.Item
            label="Amount"
            name="AMOUNT"
            rules={[
              { required: false, message: 'Please enter the amount' },
              { type: 'number', message: 'Amount must be a number' },
            ]}
          >
            <InputNumber 
              onChange={(value) => handleInputChange('AMOUNT', value)} 
              formatter={(value) => `${value}`.replace(/[^0-9]/g, '')}
              parser={(value) => value.replace(/[^0-9]/g, '')}
            />
          </Form.Item>
        </div>
        <div>
          <Form.Item
            label="Description"
            name="ABOUT"
            rules={[
              { required: false, message: 'Please enter the about information' },
              { max: 4000, message: 'Description must be at most 4000 characters' },
            ]}
          >
            <Input value={formValues.ABOUT} onChange={(e) => handleInputChange('ABOUT', e.target.value)} />
          </Form.Item>
        </div>
        <Form.Item
          label="Free"
          name="FREE"
          rules={[{ required: false, message: 'Please select the free information' }]}
        >
          <Select
            value={formValues.FREE === null ? 'Unknown' : formValues.FREE}
            onChange={(value) => handleInputChange('FREE', value)}
          >
            <Option value="Y">Yes</Option>
            <Option value="N">No</Option>
            <Option value="">Unknown</Option>
          </Select>
        </Form.Item>
        <div>
          <Form.Item
            label="Eligibility"
            name="ELIGIBILITY"
            rules={[{ required: false, message: 'Please enter the eligibility' }]}
          >
            <Select
              mode="tags"
              onChange={(values) => handleInputChange('ELIGIBILITY', values)}
            />
          </Form.Item>
        </div>
        <div>
          <Form.Item
            label="Deadline"
            name="DEADLINE"
            rules={[{ required: false, message: 'Please select a deadline' }]}
          >
            <DatePicker
              onChange={(date) => handleDatePickerChange(date, 'DEADLINE')}
              format="MMMM D, YYYY"
            />
          </Form.Item>
        </div>
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