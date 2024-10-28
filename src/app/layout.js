import React from 'react';
import SideNav from './components/SideNav.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export const metadata = {
  title: 'Realms',
  description: 'A demo application using Next.js 13',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="body-container">
          <div className="grid grid-cols-12 gap-4">
            <SideNav />
            <div className="col-span-10 p-4">
              <div className="main-content-container">
                {children}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}