import * as React from 'react';

function wrap(path: React.ReactNode){
  return function Icon({ className = '', ...rest }: React.SVGProps<SVGSVGElement>){
    return (
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
        {path}
      </svg>
    );
  }
}

export const Info = wrap(<g><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></g>);
export const Calculator = wrap(<g><rect x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="7" width="8" height="3"/><rect x="8" y="14" width="3" height="3"/><rect x="13" y="14" width="3" height="3"/></g>);
export const RefreshCcw = wrap(<g><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5h-2"/><polyline points="23 20 23 14 17 14"/></g>);
export const DollarSign = wrap(<g><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></g>);
export const Link = wrap(<g><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></g>);

