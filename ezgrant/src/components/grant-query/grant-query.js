import React from "react";
import './grant-query.css'
export const Grant = (props) => {
    return (
        <>
        <div className="grant-container">
            {props.grant.map(([object_key,value], index) => {
                return (
                    <div key={index}>
                        {object_key}-{value}
                    </div>
                );
            })}
        </div>
        </>
    );
}