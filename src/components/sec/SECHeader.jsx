'use client';

export default function SECHeader() {
  return (
    <header className="bg-black text-white px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-3.5 md:py-4 flex justify-end items-center sticky top-0 z-50 shadow-lg">
      <button className="relative hover:opacity-80 transition-opacity">
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5"></span>
      </button>
    </header>
  );
}
