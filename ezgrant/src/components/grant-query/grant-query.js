// Import necessary modules and components
import React, { useState, useRef, useEffect } from "react";
import { 
    EnvironmentOutlined, DollarCircleOutlined, CalendarOutlined, 
    TagsOutlined, UserOutlined, IdcardOutlined, LinkOutlined, 
    InfoCircleOutlined, CheckCircleOutlined 
} from '@ant-design/icons';  // Import Ant Design icons
import { Card } from 'antd';  // Import Ant Design Card component
import './grant-query.css';  // Import custom CSS
// Define a constant for the field keys
const FIELD_KEYS = {
    NAME: "NAME",
    LOCATION: "LOCATION",
    AMOUNT: "AMOUNT",
    DEADLINE: "DEADLINE",
    CATEGORY: "CATEGORY",
    SPONSOR: "SPONSOR",
    LINK: "LINK",
    ABOUT: "ABOUT",
    // ELIGIBILITY: "ELIGIBILITY", // Ignored as per your instruction
  };

  // Define a mapping of field keys to their icons
  const FIELD_ICONS = {
    [FIELD_KEYS.NAME]: <IdcardOutlined />,
    [FIELD_KEYS.LOCATION]: <EnvironmentOutlined />,
    [FIELD_KEYS.AMOUNT]: <DollarCircleOutlined />,
    [FIELD_KEYS.DEADLINE]: <CalendarOutlined />,
    [FIELD_KEYS.CATEGORY]: <TagsOutlined />,
    [FIELD_KEYS.SPONSOR]: <UserOutlined />,
    [FIELD_KEYS.LINK]: <LinkOutlined />,
    [FIELD_KEYS.ABOUT]: <InfoCircleOutlined />,
    // ... Add other mappings as needed
  };
export const Grant = (props) => {
    // State to manage whether the card is expanded or not
    const [isExpanded, setIsExpanded] = useState(false);

    // Reference to the grant container for click outside functionality
    const grantRef = useRef(null);
   
    // Function to toggle the expanded/collapsed state of the card
    const handleExpandCollapse = () => {
        setIsExpanded(!isExpanded);        
    };


    return (
      <div data-testid="grant-container" ref={grantRef} className={`grant-card ${isExpanded ? "grant-card--expanded" : "grant-card--collapsed"}`}>
        <Card>
          <div className="grant-card__header">
            <div className="grant-card__title">
              {props.grant.find(([key]) => key === FIELD_KEYS.NAME)[1]}
            </div>
            <div className="grant-card__deadline">
              {props.grant.find(([key]) => key === FIELD_KEYS.DEADLINE)[1]}
            </div>
            <div className="grant-card__location">
              {props.grant.find(([key]) => key === FIELD_KEYS.LOCATION)[1]}
            </div>
          </div>
          <div className={`grant-card__about ${isExpanded ? "grant-card__about--expanded" : "grant-card__about--truncated"}`}>
            {props.grant.find(([key]) => key === FIELD_KEYS.ABOUT)[1]}
          </div>
          <div className="grant-action-links">
            <button className="grant-card__read-more" onClick={handleExpandCollapse}>
              {isExpanded ? "Read Less" : "Read More"}
            </button>
            <a href="#" className="grant-apply-link">Apply</a>
            <a href="#" className="grant-about-link">About</a>
          </div>
        </Card>
      </div>
    );
};