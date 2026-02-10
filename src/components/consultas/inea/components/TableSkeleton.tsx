import { motion } from 'framer-motion';

interface TableSkeletonProps {
    isDarkMode: boolean;
}

export default function TableSkeleton({ isDarkMode }: TableSkeletonProps) {
    return (
        <>
            {[...Array(10)].map((_, i) => (
                <tr key={i} className={`border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                    <td className="px-4 py-3.5">
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                            className={`h-4 w-24 rounded ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`}
                        />
                    </td>
                    <td className="px-4 py-3.5">
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.1 }}
                            className={`h-4 w-full max-w-md rounded ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`}
                        />
                    </td>
                    <td className="px-4 py-3.5">
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.2 }}
                            className={`h-4 w-32 rounded ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`}
                        />
                    </td>
                    <td className="px-4 py-3.5">
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.3 }}
                            className={`h-4 w-36 rounded ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`}
                        />
                    </td>
                    <td className="px-4 py-3.5">
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.4 }}
                            className={`h-6 w-24 rounded-full ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`}
                        />
                    </td>
                    <td className="px-4 py-3.5">
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.5 }}
                            className={`h-6 w-28 rounded-full ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`}
                        />
                    </td>
                </tr>
            ))}
        </>
    );
}
