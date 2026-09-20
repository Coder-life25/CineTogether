import React from 'react';
import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
      <Link to="/" className="flex items-center gap-2 pointer-events-auto">
        <div className="p-2 bg-accent/10 rounded-xl">
          <Film className="w-6 h-6 text-accent" />
        </div>
        <span className="text-xl font-bold tracking-tight text-text-primary">
          Cine<span className="text-accent">Together</span>
        </span>
      </Link>
    </header>
  );
};

export default Header;
