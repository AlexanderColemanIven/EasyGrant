const React = require('react');
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom'
import AdminPage from '.';

describe('Testing admin page login', () => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });

    it('Testing login container renders', () => {
        render(<AdminPage />);
        expect(screen.getByTestId('signin-container')).toBeInTheDocument();
        expect(screen.getByTestId('username-input')).toBeInTheDocument();
        expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

})