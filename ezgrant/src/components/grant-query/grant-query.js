// Import necessary modules and components
import React, { useState, useRef, useEffect } from "react";
import { 
    EnvironmentOutlined, DollarCircleOutlined, CalendarOutlined, 
    TagsOutlined, UserOutlined, IdcardOutlined, LinkOutlined, 
    InfoCircleOutlined, CheckCircleOutlined 
} from '@ant-design/icons';  // Import Ant Design icons
import { useClickOutside } from '../../hooks/useClickOutside';  // Import custom hook
import { Card } from 'antd';  // Import Ant Design Card component
import './grant-query.css';  // Import custom CSS

export const Grant = (props) => {
    // State to manage whether the card is expanded or not
    const [isExpanded, setIsExpanded] = useState(false);

    // Reference to the grant container for click outside functionality
    const grantRef = useRef(null);

    // Function to toggle the expanded state of the card
    const handleExpandCollapse = () => {
        setIsExpanded(!isExpanded);
    };

    // Use custom hook to handle click outside the card to collapse it
    useClickOutside(grantRef, () => {
        if (isExpanded) {
            setIsExpanded(false);
        }
    });

    return (
        // Main container for the grant card
        <div ref={grantRef} className={"grant-container" + (isExpanded ? " expanded" : "")}>
            <Card
                // Handle card click to expand/collapse, avoid action if an anchor tag is clicked
                onClick={(e) => {
                    if (e.target.tagName.toLowerCase() !== 'a') {
                        handleExpandCollapse();
                    }
                }}
                // Card title
                title={props.grantName || "No Grant Name Available"}
                // Add class for styling if card is expanded
                className={isExpanded ? "expanded-card" : ""}
                // Extra contains the collapse/expand toggle
                extra={<a onClick={handleExpandCollapse}>{isExpanded ? "Collapse" : "Expand"}</a>}
                // Dynamic styling based on expanded state
                style={{
                    width: isExpanded ? "100%" : "300px",
                    maxHeight: isExpanded ? "100vh" : "300px",
                    overflowY: "auto",
                }}
            >
                {/* Loop through grant properties and render them */}
                {props.grant.map(([object_key, value], index) => {
                    let icon;  // Initialize icon variable
                    // Map object keys to specific icons
                    if (object_key === "NAME") icon = <IdcardOutlined />;
                    // ... (other icons mappings)
                    // Generate the field display
                    return (
                        <div key={index} className="grant-field">
                            <span className="grant-field-icon">{icon}</span>
                            <span className="grant-field-name">{object_key}</span>-<span className="grant-field-value">{value}</span>
                        </div>
                    );
                })}
                {/* Action links at the bottom of the card */}
                <div className="grant-action-links">
                    <a href="#" className="grant-apply-link">Apply</a>
                    <a href="#" className="grant-learn-more-link">Learn More</a>
                </div>
            </Card>
        </div>
    );
};
