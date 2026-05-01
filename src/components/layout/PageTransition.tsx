import { useLocation } from 'react-router-dom';
import { useRef, useEffect, useState, type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animClass, setAnimClass] = useState('animate-page-enter');
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key !== prevKey.current) {
      prevKey.current = location.key;
      setAnimClass('');
      requestAnimationFrame(() => {
        setDisplayChildren(children);
        setAnimClass('animate-page-enter');
      });
    } else {
      setDisplayChildren(children);
    }
  }, [location.key, children]);

  return <div className={animClass}>{displayChildren}</div>;
}
