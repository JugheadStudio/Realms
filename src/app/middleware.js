import { NextResponse } from 'next/server';

// This function will run for every request made to the server
export function middleware(req) {
  const token = req.cookies.get('authToken');  // Or use session, JWT, etc.
  
  if (!token && req.nextUrl.pathname === '/room') {
    // If the user is not authenticated, redirect to the login page
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Continue to the route if authenticated
  return NextResponse.next();
}

// Define which routes should use this middleware
export const config = {
  matcher: ['/room'],  // You can add other protected routes here
};