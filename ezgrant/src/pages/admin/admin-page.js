import React, { useState } from "react";
import ReactDOM from "react-dom";

import "./admin-page.css";

function AdminPage() {
  // React States
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const errors = {
    uname: "invalid username",
    pass: "invalid password"
  };

  const handleSubmit = async (event) => {
    //Prevent page reload
    event.preventDefault();

    let { uname, pass } = document.forms[0];
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: [uname.value, pass.value] }),
    });
    const body = await response.json();
    if(body.express){
      console.log(body.express);
      if(body.express.match_username && body.express.match_password){
        setIsSubmitted(true);
      } else if(body.express.match_username === false){
        setErrorMessages({ name: "uname", message: errors.uname });
      } else {
        setErrorMessages({ name: "pass", message: errors.pass });
      }
    }
  };

  // Generate JSX code for error message
  const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <div className="error">{errorMessages.message}</div>
    );

  // JSX code for login form
  const renderForm = (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <label>Username </label>
          <input type="text" name="uname" required />
          {renderErrorMessage("uname")}
        </div>
        <div className="input-container">
          <label>Password </label>
          <input type="password" name="pass" required />
          {renderErrorMessage("pass")}
        </div>
        <div className="button-container">
          <input className="admin-login-submit" type="submit" />
        </div>
      </form>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-login-form">
        <div className="admin-page-title">Sign In</div>
        {isSubmitted ? <div>User is successfully logged in</div> : renderForm}
      </div>
    </div>
  );
}

export default AdminPage;