import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-md"
      >
        <h1 className="text-8xl font-bold text-accent">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-text-secondary">The room you're looking for might have been closed, or the link is incorrect.</p>
        <Link to="/">
          <Button size="lg" className="mt-4">Return Home</Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
