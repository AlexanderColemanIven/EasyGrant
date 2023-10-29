const React = require('react');
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom'
import Grant from '.';


describe('Testing Grant Scorecard', () => {
  // Define mock grant data
  const grantData = [
    ['NAME', 'Test Grant'],
    ['LOCATION', 'Bucknell'],
    ['LINK', 'www.google.com'],
    ['AMOUNT', '$1000'],
    ['ABOUT', 'This grant was created to test the app'],
    ['FREE', 'Y'],
    ['ELIGIBILITY', 'Anyone who can code'],
    ['DEADLINE', 'December'],
  ];

  // check that all fields in scorecard are rendered
  it('renders all fields correctly', () => {
    // Render the Grant component with the mock data
    render(<Grant grant={grantData} />);
    // Use screen queries to make assertions
    expect(screen.getByText('Test Grant')).toBeInTheDocument();
    expect(screen.getByText('Bucknell')).toBeInTheDocument();
    expect(screen.getByText('www.google.com')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
    expect(screen.getByText('This grant was created to test the app')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
    expect(screen.getByText('Anyone who can code')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
  });


  it('grant expansion functions correctly', async () => {
    // Render the Grant component with the mock data
    render(<Grant grant={grantData} />);

    const grantContainer = screen.getByTestId('grant-container');

    act(() => {
      // Simulate a click event on the component
      grantContainer.click();
    });

    // check grant-container expanded
    await waitFor(() => {
      setTimeout(() => {
        expect(grantContainer).toHaveClass('expanded');
      }, 500); // class name wont update instantly
    });
  });

});