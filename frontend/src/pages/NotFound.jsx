import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="not-found">
        <h1 className="not-found__title">404</h1>
        <p className="not-found__text">This page doesn&apos;t exist on your path yet.</p>
        <Link to="/">
          <Button variant="gold">Back to Home</Button>
        </Link>
      </div>
    </>
  );
}
