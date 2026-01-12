'use client';
import { motion } from 'framer-motion';

export default function AddProductPage(){
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* محتوى صفحة الإضافة */}
    </motion.div>
  );
}
