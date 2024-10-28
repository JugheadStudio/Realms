import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-screen w-64 bg-gray-800 text-white">
      <div className="p-6">
        <h1 className="text-3xl font-bold">My App</h1>
      </div>
      <nav className="mt-10">
        <ul>
          <li className="mb-6">
            <Link href="/">Home
            </Link>
          </li>
          <li className="mb-6">
            <Link href="/about">About
            </Link>
          </li>
          <li className="mb-6">
            <Link href="/contact">Contact
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
