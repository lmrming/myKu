import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="skeleton h-4 w-24 rounded mb-2"></div>
          <div className="skeleton h-8 w-16 rounded"></div>
        </div>
        <div className="skeleton w-12 h-12 rounded-full"></div>
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="skeleton h-12 w-full"></div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-14 w-full border-t border-gray-100 dark:border-gray-700"></div>
      ))}
    </div>
  );
};

export const SkeletonForm = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-6">
      <div className="skeleton h-8 w-48 rounded mx-auto mb-8"></div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <div className="skeleton h-4 w-24 rounded mb-2"></div>
          <div className="skeleton h-12 w-full rounded"></div>
        </div>
      ))}
      <div className="skeleton h-12 w-full rounded mt-6"></div>
    </div>
  );
};

export const SkeletonChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="skeleton h-6 w-32 rounded mb-4"></div>
      <div className="skeleton h-64 w-full rounded"></div>
    </div>
  );
};

export const SkeletonTodo = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
      <div className="skeleton h-8 w-32 rounded mx-auto mb-8"></div>
      <div className="skeleton h-12 w-full rounded mb-6"></div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton h-14 w-full rounded mb-3"></div>
      ))}
    </div>
  );
};

export default {
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  SkeletonChart,
  SkeletonTodo
};