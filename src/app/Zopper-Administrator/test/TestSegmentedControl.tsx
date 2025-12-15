'use client';

import { usePathname, useRouter } from 'next/navigation';

interface Segment {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const segments: Segment[] = [
  { id: 'manage', label: 'Manage Tests', icon: '📋', path: '/Zopper-Administrator/test/manage' },
  { id: 'results', label: 'Test Results', icon: '📊', path: '/Zopper-Administrator/test/results' },
  { id: 'analysis', label: 'Analysis', icon: '📈', path: '/Zopper-Administrator/test/analysis' },
  { id: 'invites', label: 'Send Invites', icon: '📨', path: '/Zopper-Administrator/test/invites' },
  { id: 'questions', label: 'Question Bank', icon: '📝', path: '/Zopper-Administrator/test/questions' },
];

export default function TestSegmentedControl() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveSegment = () => {
    if (pathname?.includes('/manage') || pathname?.includes('/create') || pathname?.includes('/edit')) return 'manage';
    if (pathname?.includes('/analysis')) return 'analysis';
    if (pathname?.includes('/invites')) return 'invites';
    if (pathname?.includes('/questions')) return 'questions';
    return 'results';
  };

  const activeSegment = getActiveSegment();

  const handleSegmentClick = (segment: Segment) => {
    router.push(segment.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent, segment: Segment) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSegmentClick(segment);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = segments.findIndex(s => s.id === activeSegment);
      const nextIndex = e.key === 'ArrowLeft' 
        ? (currentIndex - 1 + segments.length) % segments.length
        : (currentIndex + 1) % segments.length;
      handleSegmentClick(segments[nextIndex]);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-gray-50 pb-4 mb-6">
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1 w-full max-w-3xl">
          {segments.map((segment) => {
            const isActive = activeSegment === segment.id;
            return (
              <button
                key={segment.id}
                onClick={() => handleSegmentClick(segment)}
                onKeyDown={(e) => handleKeyDown(e, segment)}
                className={`
                  flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium
                  transition-all duration-200 ease-in-out flex-1
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
              >
                <span className="text-sm sm:text-base">{segment.icon}</span>
                <span className="whitespace-nowrap hidden sm:inline">{segment.label}</span>
                <span className="whitespace-nowrap sm:hidden">{segment.label.replace('Test ', '').replace('Send ', '').replace('Insert ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
