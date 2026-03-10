import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './tailwind.css';
import { emit } from '@tauri-apps/api/event';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);

// Signal to the backend that the frontend is ready to be shown
emit('frontend-ready').catch(() => {});
