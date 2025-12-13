'use client';

import Image from 'next/image';
import styles from '@/styles/PineLeaves.module.css';

interface PineLeavesProps {
  position: 'left' | 'right';
}

export default function PineLeaves({ position }: PineLeavesProps) {
  return (
    <div
      className={`${styles.pineWrapper} ${
        position === 'left' ? styles.left : styles.right
      }`}
    >
      <Image
        src={position === 'left' ? '/images/pine left.png' : '/images/pine right.png'}
        alt=""
        width={320}
        height={160}
        className={styles.pineImage}
        priority
      />
    </div>
  );
}
