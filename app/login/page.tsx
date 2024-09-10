// app/login/page.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import LoginLoading from './loading';

const LoginForm = dynamic(() => import('./LoginForm'), {
  loading: () => <LoginLoading />,
});

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}