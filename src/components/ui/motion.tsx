import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Animation variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Animated components
interface MotionDivProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
}

export const FadeInUp = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={fadeInUp}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeInUp.displayName = 'FadeInUp';

export const FadeIn = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = 'FadeIn';

export const ScaleIn = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={scaleIn}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
ScaleIn.displayName = 'ScaleIn';

export const StaggerContainer = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerContainer.displayName = 'StaggerContainer';

// Hover scale button wrapper
interface HoverScaleProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ children, className, scale = 0.98, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileTap={{ scale }}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
HoverScale.displayName = 'HoverScale';

// Floating card with hover glow
interface FloatingCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'magenta' | 'violet';
}

export const FloatingCard = forwardRef<HTMLDivElement, FloatingCardProps>(
  ({ children, className, glowColor = 'cyan', ...props }, ref) => {
    const glowClasses = {
      cyan: 'hover:shadow-[0_0_40px_-10px_hsl(192_95%_60%/0.4)]',
      magenta: 'hover:shadow-[0_0_40px_-10px_hsl(330_85%_60%/0.4)]',
      violet: 'hover:shadow-[0_0_40px_-10px_hsl(280_80%_65%/0.4)]',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className={cn(
          'glass-card transition-shadow duration-300',
          glowClasses[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FloatingCard.displayName = 'FloatingCard';

// Page transition wrapper
export const PageTransition = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
PageTransition.displayName = 'PageTransition';

// Stagger item for use inside StaggerContainer
export const StaggerItem = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = 'StaggerItem';
