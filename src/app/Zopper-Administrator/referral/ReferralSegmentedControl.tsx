'use client';

import { usePathname, useRouter } from 'next/navigation';

interface Segment {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const segments: Segment[] = [
  { id: 'referrals', label: 'View Referrals', icon: '📄', path: '/Zopper-Administrator/referral/referrals' },
  { id: 'vouchers', label: 'Process Vouchers', icon: '🎟️', path: '/Zopper-Administrator/referral/vouchers' },
];

export default function ReferralSegmentedControl() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveSegment = () => {
    if (pathname?.includes('/vouchers')) return 'vouchers';
    return 'referrals';
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
        <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1 w-full max-w-2xl">
          {segments.map((segment) => {
            const isActive = activeSegment === segment.id;
            return (
              <button
                key={segment.id}
                onClick={() => handleSegmentClick(segment)}
                onKeyDown={(e) => handleKeyDown(e, segment)}
                className={`
                  flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium
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
                <span className="text-base">{segment.icon}</span>
                <span className="whitespace-nowrap">{segment.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
