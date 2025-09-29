// Homepage - /pages/index.js

import Link from 'next/link';

export default function HomePage() {
   return (
    <div>
      <h1>Welcome to the User Authentication Prototype</h1>
      <p>This is the public homepage.</p>
      <Link href="/auth/login">Go to Login</Link>
      {' | '}
      <Link href="/auth/register">Register</Link>
    </div>
  );
}