
import React from 'react';

export const FormLoading = () => {
  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-pulse flex flex-col w-full max-w-2xl">
          <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-1/2"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-6">
              <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
