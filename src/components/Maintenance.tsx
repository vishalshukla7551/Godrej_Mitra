'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Maintenance() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                    duration: 1.2,
                    ease: [0.22, 1, 0.36, 1],
                    type: "spring",
                    stiffness: 100
                }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#5E1846]"
            >
                Sales<span className="text-[#3056FF]">mitr</span>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-12 text-center"
            >
                <div className="relative inline-block">
                    <motion.div
                        animate={{
                            rotate: [0, 5, -5, 5, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="text-6xl mb-6"
                    >
                        🚧
                    </motion.div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    Under Maintenance
                </h2>
                <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
                    We're polishing things up to give you a better experience.
                    Please check back in a little while.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="mt-16 text-center"
            >
                <div className="flex items-center justify-center text-gray-500 gap-2">
                    <span className="text-sm">Powered by</span>
                    <Image
                        src="/zopper-icon.png"
                        alt="Zopper icon"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                    />
                    <span className="text-lg font-bold text-gray-900">Zopper</span>
                </div>
            </motion.div>

            {/* Decorative elements */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_bottom_left,_rgba(94,24,70,0.05),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(48,86,255,0.05),_transparent_40%)]" />
        </main>
    );
}
