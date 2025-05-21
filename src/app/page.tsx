"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";

const AnimatedSection = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  delay,
  isActive = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  isActive?: boolean;
}) => {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg p-6 transform transition-all duration-700 h-full relative ${
        isActive
          ? "ring-1 ring-blue-300 shadow-xl"
          : "hover:ring-1 hover:ring-blue-200 shadow-md"
      }`}
      animate={{
        y: isActive ? -3 : 0,
      }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      layout
    >
      <div
        className={`mb-3 ${
          isActive ? "text-blue-600" : "text-blue-400"
        } transition-colors duration-700`}
      >
        <div className="w-8 h-8">{icon}</div>
      </div>
      <h3
        className={`text-lg font-bold mb-2 ${
          isActive ? "text-blue-600" : "text-blue-500"
        } transition-colors duration-700`}
      >
        {title}
      </h3>
      <p
        className={`${
          isActive ? "text-gray-700" : "text-gray-500"
        } text-sm transition-colors duration-700`}
      >
        {description}
      </p>

      <motion.div
        className="absolute -bottom-0.5 left-0 right-0 mx-auto h-0.5 rounded-full bg-blue-500/60"
        animate={{
          width: isActive ? "50%" : "0%",
          opacity: isActive ? 1 : 0,
        }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
};

const ParallaxImage = ({
  className,
  imageUrl,
  alt,
  delay = 0,
}: {
  className?: string;
  imageUrl: string;
  alt: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden rounded-xl shadow-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div className="w-full h-full" style={{ y }}>
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </motion.div>
    </motion.div>
  );
};

const ProgressTracker = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 origin-left z-50"
      style={{ scaleX }}
    />
  );
};

const FeaturesCarousel = ({ features }: { features: any }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const getItemsToShow = useCallback(() => {
    if (viewportWidth >= 1280) return 5;
    if (viewportWidth >= 1024) return 3;
    if (viewportWidth >= 768) return 3;
    if (viewportWidth >= 640) return 1;
    return 1;
  }, [viewportWidth]);

  const itemsToShow = getItemsToShow();

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || isPaused || isTransitioning) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, isAutoPlaying, isPaused, isTransitioning]);

  const nextSlide = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setDirection(1);

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }, 50);
  };

  const prevSlide = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setDirection(-1);

    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? features.length - 1 : prevIndex - 1,
      );

      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }, 50);
  };

  const handleTouchStart = (e: any) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: any) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (isTransitioning) return;

    if (touchStart - touchEnd > 75) {
      nextSlide();
    }

    if (touchStart - touchEnd < -75) {
      prevSlide();
    }
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;

    setIsTransitioning(true);
    setDirection(index > currentIndex ? 1 : -1);

    setTimeout(() => {
      setCurrentIndex(index);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }, 50);
  };

  const getVisibleFeatures = useCallback(() => {
    let visibleItems = [];
    const itemsOnEachSide = Math.floor(itemsToShow / 2);

    for (let i = -itemsOnEachSide; i <= itemsOnEachSide; i++) {
      let index = currentIndex + i;

      if (index < 0) index = features.length + index;
      if (index >= features.length) index = index % features.length;

      visibleItems.push({
        feature: features[index],
        index,
        isActive: i === 0,
        distance: Math.abs(i),
      });
    }

    return visibleItems;
  }, [currentIndex, features, itemsToShow]);

  const renderDots = () => {
    return (
      <div className="flex justify-center space-x-2 mt-8">
        {features.map((_: string, index: number) => (
          <motion.button
            key={`dot-${index}`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => goToSlide(index)}
            className="relative h-2 rounded-full transition-all duration-700 ease-in-out cursor-pointer"
            style={{
              width: index === currentIndex ? 20 : 8,
              backgroundColor: index === currentIndex ? "#2563eb" : "#93c5fd",
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0 bg-blue-400 rounded-full opacity-0"
              animate={{ opacity: index === currentIndex ? [0, 0.2, 0] : 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative py-12 px-4 overflow-hidden">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-500"
        onClick={prevSlide}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        disabled={isTransitioning}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </motion.button>

      <div
        ref={carouselRef}
        className=""
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          className="flex items-center justify-center"
          initial={false}
        >
          <div className="flex gap-4 md:gap-6 px-4 justify-center items-center">
            {getVisibleFeatures().map(
              ({ feature, index, isActive, distance }) => (
                <motion.div
                  key={`feature-${index}`}
                  className={`flex-shrink-0 w-56 sm:w-64 md:w-72 transition-all`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isActive ? 1 : 0.6 - distance * 0.1,
                    scale: isActive ? 1 : 0.88 - distance * 0.03,
                    filter: isActive
                      ? "blur(0px)"
                      : `blur(${distance * 0.7}px)`,
                    x: direction * (isActive ? 0 : distance * 5),
                  }}
                  transition={{
                    duration: 0.9,
                    ease: [0.25, 0.1, 0.25, 1],
                    opacity: { duration: 1.2 },
                    scale: { duration: 0.9 },
                    filter: { duration: 1 },
                  }}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    isActive={isActive}
                  />
                </motion.div>
              ),
            )}
          </div>
        </motion.div>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-500 cursor-pointer"
        onClick={nextSlide}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        disabled={isTransitioning}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.button>

      {renderDots()}
    </div>
  );
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const ballX = useTransform(scrollYProgress, [0, 1], ["0%", "93%"]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <ProgressTracker />
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-6 py-4 ${
          isScrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <motion.div
              className="text-blue-600 mr-2"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 500 500"
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current"
              >
                <path d="M200 134c4.6 0 9.2-.1 13.8-.2 6.4 0 10.8.6 15.9 4.7 1.9 2.3 1.8 3.9 1.8 6.8a97 97 0 0 1-.2 9.5c.1 4.8 0 9.5.1 14.3 0 8.3 0 16.5-.2 24.8-2.1 8.2-2.1 8.2-4.2 12-5.5 4.5-9.8 5.4-16.7 5.1-3.6-.1-7.2-.3-10.8-.4.1 1.2.1 2.4.2 3.7.3 7.9.5 15.8.8 23.7.1 3.9.2 7.7.4 11.6-.1 1.9-.1 1.9-1.1 4.9h22c3.3 0 6.7 0 10.2 0 3.9 0 7.8-.1 11.8-.1h3.7c7 0 7 0 13-3.1a31 31 0 0 0 7.3-7c1.9-2.3 3.8-4.6 5.6-6.9 5-1.5 7.3-1.1 10.7 2.2 1.4 1.9 1.4 1.9 1.4 5.9h-2c-.4.9-.4.9-.8 1.7-4.4 8.1-12.4 15-20.4 19.5-2.9.8-2.9.8-12.9.8v34c4.6 0 9.2 0 13.9 0 4.8 1.4 7.4 2.7 10 7a70 70 0 0 1 .6 21c.1 6.7.1 13.4.2 20.1.1 7.6.1 15.2-.1 22.8-.2 6-1.1 9.5-5.2 13.9-4.6 3.2-10.8 2.4-16.2 2.4h-2a290 290 0 0 1-26.3.1H247.4c-5.9 0-11.4-.4-16.5-3.8-2.3-3.5-2.4-6.2-2.6-10.2v-21.4c-.1-5.3-.1-10.6-.2-15.9-.1-1.1-.1-1.1-.1-2.2.3-8.2.3-8.2 2.9-11.8 7.1-6 13.4-4.4 22.8-4.4v-34h-84v33c5 .3 9.9.7 15 1 4.6 1.3 6.3 2.2 9.4 5.8 4.3 8.4 2.8 18.9 2.6 28a192 192 0 0 1-.3 24.6c-.1.9-.1.9-.1 1.9-.1 5.7-1.2 9-5.2 13.1-2.3 1.8-3.7 2.2-6.6 2.3-2.5.1-5 .1-7.5.1h-2.7a315 315 0 0 1-28.9.1h-2.6c-6.3 0-11.5-.6-17-4.1-3.2-4.7-2.8-9.2-2.7-14.8v-4.6a1082 1082 0 0 0 0-18.2c0-5 0-10 0-15v-2.9c.1-7.6.1-7.6 2.5-11.5 2.3-2 3.9-2.9 6.8-3.7.8-.2 1.6-.5 2.4-.7 2.6-.4 4.9-.5 7.6-.5h2.4c.9 0 .9 0 1.9.1a481 481 0 0 1-.5-23.6c-.1-3.9-.1-7.9-.1-11.8-.1-1.8-.1-1.8-.2-3.9 0-4.1.4-6.9 1.8-10.7 4.2-3.8 8.3-3.3 13.8-3.3h3.5a399 399 0 0 0 24.2-.9c.3-13.9.7-27.7 1-42h-19c-5 0-5 0-7-3a127 127 0 0 1-.3-13c0-3.8 0-3.8-.1-5.7 0-5.1-.1-10.2-.1-15.3 0-7.8-.1-15.5-.2-23.3 0-2.5-.1-4.9-.1-7.4l-.1-1.9c0-9 0-9 3-12 3.5-2.4 5.2-3 9.3-2.9z" />

                {/* Avión */}
                <path d="M377 147c1 .5 1 .5 2 1 2 5.9 0 10.9-1.8 16.6a148 148 0 0 1-5.2 26l-3.5 14.4c-2.4 10-5 20-7.8 29.9-.3.8-.5 1.7-.8 2.5-1.3 4.5-2.7 8.1-6.2 11.5-4.4.2-7.1-.8-10.4-3.4-.8-.8-1.7-1.7-2.6-2.6v-2l-1.8-.8c-2.6-1.4-4.8-3-7-4.7l-2.4-1.8c-.6-.5-1.2-1.1-1.8-1.7v-2l-1.7-.7c-2.9-1.6-5.2-3.4-7.6-5.6-.9-.8-1.8-1.5-2.7-2.3-2-2.4-2-2.4-2.1-4.8 1.6-3.8 4.1-6.5 6.8-9.5l1.6-1.8c1-1.2 2.1-2.4 3.2-3.5 4.3-4.8 8.4-9.7 12.5-14.7l1.1-1.5h-1c-.6.6-1.3 1.2-1.9 1.8a35 35 0 0 1-5.5 5.2c-2.2 2-2.2 2-4.2 2v2c-1.7 1.6-3.5 3.1-5.4 4.6-1 .8-2 1.7-3 2.5-2.6 1.9-2.6 1.9-4.6 1.9v2c-5.5 5-5.5 5-8 5v2l-3 2c-2.6-.9-4.7-1.8-7.1-3l-2-1c-1.3-.7-2.7-1.3-4-2-1.8-.9-3.6-1.8-5.5-2.7-9.3-4.5-9.3-4.5-12.5-8.3-.3-3.8-.3-3.8 0-7 6.7-3.5 13.5-6.6 20.6-9.4.9-.4 1.9-.8 2.9-1.2 6.6-2.7 13.3-5.1 20-7.4 5-1.7 9.8-3.7 14.6-6 8.7-3.9 17.5-7.7 26.5-11 3.1-1.1 6.2-2.3 9.2-3.7 4.2-1.7 6.8-1.6 11.3-1.3z" />
              </svg>
            </motion.div>
            <span
              className={`font-bold text-xl ${
                isScrolled ? "text-blue-600" : "text-white"
              }`}
            >
              FlowPilot
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <motion.button
                className={`px-4 py-2 rounded-full font-medium cursor-pointer ${
                  isScrolled
                    ? "bg-blue-600 text-white"
                    : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Iniciar sesión
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90 z-10"></div>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 100 + 10,
                height: Math.random() * 100 + 10,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 100 - 50],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 z-20 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Gestión de proyectos <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              llevada al siguiente nivel
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-blue-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            FlowPilot optimiza el flujo de trabajo de tu equipo con herramientas
            intuitivas para la gestión de proyectos en tiempo real.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/login">
              <motion.button
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-full font-bold text-lg transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Empieza gratis ahora
              </motion.button>
            </Link>
            <Link href="#features">
              <motion.button
                className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full font-bold text-lg transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explorar características
              </motion.button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </section>

      <section
        id="features"
        className="py-20 bg-gradient-to-b from-white to-blue-50"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-blue-500">
                Funcionalidades destacadas
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Descubre las herramientas que hacen de FlowPilot la solución
                perfecta para equipos que buscan maximizar su productividad.
              </p>
            </AnimatedSection>
          </div>

          <FeaturesCarousel
            features={[
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                ),
                title: "Tableros Kanban",
                description:
                  "Visualiza el flujo de trabajo de tu equipo con tableros Kanban personalizables y de fácil uso.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "Seguimiento en tiempo real",
                description:
                  "Mantente al día con actualizaciones instantáneas sobre el progreso de tus proyectos y tareas.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
                title: "Gestión de equipos",
                description:
                  "Asigna tareas, colabora en proyectos y coordina a tu equipo desde un solo lugar.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
                title: "Análisis y estadísticas",
                description:
                  "Obtén información valiosa sobre el rendimiento del equipo y el progreso de los proyectos.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                ),
                title: "Notificaciones",
                description:
                  "Mantente informado con alertas y recordatorios personalizados sobre fechas de entrega y actualizaciones.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                ),
                title: "Personalización",
                description:
                  "Adapta la plataforma a las necesidades de tu equipo con flujos de trabajo personalizados.",
              },
            ]}
          />
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Explora FlowPilot en acción
              </h2>
            </AnimatedSection>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16">
            <div className="space-y-12">
              <AnimatedSection>
                <h3 className="text-2xl font-bold mb-4 text-blue-600">
                  Tableros Kanban intuitivos
                </h3>
                <p className="text-gray-600 mb-6">
                  Organiza y visualiza las tareas de tu equipo con una interfaz
                  drag-and-drop que facilita el seguimiento del progreso.
                </p>
              </AnimatedSection>

              <ParallaxImage
                className="w-full h-64 md:h-80"
                imageUrl="/TableroKanban.png"
                alt="Tablero Kanban de FlowPilot"
              />
            </div>

            <div className="space-y-12 mt-12 lg:mt-24">
              <AnimatedSection delay={0.2}>
                <h3 className="text-2xl font-bold mb-4 text-blue-600">
                  Dashboard personalizado
                </h3>
                <p className="text-gray-600 mb-6">
                  Visualiza el estado de tus proyectos y tareas en un panel de
                  control intuitivo y personalizable según tus necesidades.
                </p>
              </AnimatedSection>
              <ParallaxImage
                className="w-full h-64 md:h-80"
                imageUrl="/Dashboard.png"
                alt="Dashboard de FlowPilot"
                delay={0.2}
              />
            </div>
          </div>

          <div className="mt-20">
            <AnimatedSection>
              <h3 className="text-2xl font-bold mb-4 text-blue-600">
                Vista detallada del proyecto
              </h3>
              <p className="text-gray-600 mb-8">
                Accede a una vista completa de cada proyecto, con todas sus
                tareas, miembros del equipo y progreso general.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
                className="md:col-span-2 h-64 md:h-[350px]"
              >
                <ParallaxImage
                  className="w-full h-full rounded-xl overflow-hidden"
                  imageUrl="/ProjectDetails.png"
                  alt="Información general del proyecto"
                  delay={0.1}
                />
              </motion.div>

              <div className="space-y-4 md:space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="h-[150px] md:h-[165px]"
                >
                  <ParallaxImage
                    className="w-full h-full rounded-xl overflow-hidden"
                    imageUrl="/Chat.png"
                    alt="Chat en tiempo real"
                    delay={0.2}
                  />
                  <p className="text-sm font-medium text-blue-600">
                    Chat en tiempo real
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="h-[150px] md:h-[165px]"
                >
                  <ParallaxImage
                    className="w-full h-full rounded-xl overflow-hidden"
                    imageUrl="/Stats.png"
                    alt="Estadísticas del proyecto"
                    delay={0.3}
                  />
                  <p className="text-sm font-medium text-blue-600">
                    Estadísticas avanzadas
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-center">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-blue-600">
                  Información general del proyecto
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-blue-500">
                Lo que dicen nuestros usuarios
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Descubre cómo FlowPilot está ayudando a equipos de todo tipo a
                mejorar su productividad y gestión de proyectos.
              </p>
            </AnimatedSection>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatedSection delay={0.1}>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    A
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Ana García</h4>
                    <p className="text-gray-500 text-sm">Project Manager</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "FlowPilot ha revolucionado cómo gestionamos nuestros
                  proyectos. La interfaz intuitiva y las actualizaciones en
                  tiempo real han mejorado enormemente nuestra eficiencia."
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    C
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Carlos Rodríguez</h4>
                    <p className="text-gray-500 text-sm">CTO, Innovatech</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Desde que implementamos FlowPilot, hemos reducido en un 40%
                  el tiempo dedicado a la gestión de tareas. La visualización de
                  Kanban es simplemente perfecta."
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    L
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Laura Martínez</h4>
                    <p className="text-gray-500 text-sm">
                      Team Lead, Designflow
                    </p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Mi equipo de diseño ahora puede colaborar sin problemas
                  gracias a FlowPilot. La capacidad de ver quién está trabajando
                  en qué tarea en tiempo real ha eliminado la duplicación de
                  esfuerzos."
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                ¿Listo para llevar tu gestión de proyectos al siguiente nivel?
              </h2>
              <p className="text-xl max-w-2xl mx-auto mb-8 text-blue-100">
                Únete a los equipos que ya están optimizando su flujo de trabajo
                con FlowPilot.
              </p>

              <motion.div
                className="inline-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/login">
                  <span className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg inline-block">
                    Comienza tu prueba
                  </span>
                </Link>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-blue-900 to-blue-800 text-white pt-16 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={`footer-circle-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 30 - 15],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-4">
              <div className="flex items-center mb-6">
                <div className="text-blue-400 mr-2">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 500 500"
                    xmlns="http://www.w3.org/2000/svg"
                    className="fill-current"
                  >
                    <path d="M200 134c4.6 0 9.2-.1 13.8-.2 6.4 0 10.8.6 15.9 4.7 1.9 2.3 1.8 3.9 1.8 6.8a97 97 0 0 1-.2 9.5c.1 4.8 0 9.5.1 14.3 0 8.3 0 16.5-.2 24.8-2.1 8.2-2.1 8.2-4.2 12-5.5 4.5-9.8 5.4-16.7 5.1-3.6-.1-7.2-.3-10.8-.4.1 1.2.1 2.4.2 3.7.3 7.9.5 15.8.8 23.7.1 3.9.2 7.7.4 11.6-.1 1.9-.1 1.9-1.1 4.9h22c3.3 0 6.7 0 10.2 0 3.9 0 7.8-.1 11.8-.1h3.7c7 0 7 0 13-3.1a31 31 0 0 0 7.3-7c1.9-2.3 3.8-4.6 5.6-6.9 5-1.5 7.3-1.1 10.7 2.2 1.4 1.9 1.4 1.9 1.4 5.9h-2c-.4.9-.4.9-.8 1.7-4.4 8.1-12.4 15-20.4 19.5-2.9.8-2.9.8-12.9.8v34c4.6 0 9.2 0 13.9 0 4.8 1.4 7.4 2.7 10 7a70 70 0 0 1 .6 21c.1 6.7.1 13.4.2 20.1.1 7.6.1 15.2-.1 22.8-.2 6-1.1 9.5-5.2 13.9-4.6 3.2-10.8 2.4-16.2 2.4h-2a290 290 0 0 1-26.3.1H247.4c-5.9 0-11.4-.4-16.5-3.8-2.3-3.5-2.4-6.2-2.6-10.2v-21.4c-.1-5.3-.1-10.6-.2-15.9-.1-1.1-.1-1.1-.1-2.2.3-8.2.3-8.2 2.9-11.8 7.1-6 13.4-4.4 22.8-4.4v-34h-84v33c5 .3 9.9.7 15 1 4.6 1.3 6.3 2.2 9.4 5.8 4.3 8.4 2.8 18.9 2.6 28a192 192 0 0 1-.3 24.6c-.1.9-.1.9-.1 1.9-.1 5.7-1.2 9-5.2 13.1-2.3 1.8-3.7 2.2-6.6 2.3-2.5.1-5 .1-7.5.1h-2.7a315 315 0 0 1-28.9.1h-2.6c-6.3 0-11.5-.6-17-4.1-3.2-4.7-2.8-9.2-2.7-14.8v-4.6a1082 1082 0 0 0 0-18.2c0-5 0-10 0-15v-2.9c.1-7.6.1-7.6 2.5-11.5 2.3-2 3.9-2.9 6.8-3.7.8-.2 1.6-.5 2.4-.7 2.6-.4 4.9-.5 7.6-.5h2.4c.9 0 .9 0 1.9.1a481 481 0 0 1-.5-23.6c-.1-3.9-.1-7.9-.1-11.8-.1-1.8-.1-1.8-.2-3.9 0-4.1.4-6.9 1.8-10.7 4.2-3.8 8.3-3.3 13.8-3.3h3.5a399 399 0 0 0 24.2-.9c.3-13.9.7-27.7 1-42h-19c-5 0-5 0-7-3a127 127 0 0 1-.3-13c0-3.8 0-3.8-.1-5.7 0-5.1-.1-10.2-.1-15.3 0-7.8-.1-15.5-.2-23.3 0-2.5-.1-4.9-.1-7.4l-.1-1.9c0-9 0-9 3-12 3.5-2.4 5.2-3 9.3-2.9z" />
                    <path d="M377 147c1 .5 1 .5 2 1 2 5.9 0 10.9-1.8 16.6a148 148 0 0 1-5.2 26l-3.5 14.4c-2.4 10-5 20-7.8 29.9-.3.8-.5 1.7-.8 2.5-1.3 4.5-2.7 8.1-6.2 11.5-4.4.2-7.1-.8-10.4-3.4-.8-.8-1.7-1.7-2.6-2.6v-2l-1.8-.8c-2.6-1.4-4.8-3-7-4.7l-2.4-1.8c-.6-.5-1.2-1.1-1.8-1.7v-2l-1.7-.7c-2.9-1.6-5.2-3.4-7.6-5.6-.9-.8-1.8-1.5-2.7-2.3-2-2.4-2-2.4-2.1-4.8 1.6-3.8 4.1-6.5 6.8-9.5l1.6-1.8c1-1.2 2.1-2.4 3.2-3.5 4.3-4.8 8.4-9.7 12.5-14.7l1.1-1.5h-1c-.6.6-1.3 1.2-1.9 1.8a35 35 0 0 1-5.5 5.2c-2.2 2-2.2 2-4.2 2v2c-1.7 1.6-3.5 3.1-5.4 4.6-1 .8-2 1.7-3 2.5-2.6 1.9-2.6 1.9-4.6 1.9v2l-3 2c-2.6-.9-4.7-1.8-7.1-3l-2-1c-1.3-.7-2.7-1.3-4-2-1.8-.9-3.6-1.8-5.5-2.7-9.3-4.5-9.3-4.5-12.5-8.3-.3-3.8-.3-3.8 0-7 6.7-3.5 13.5-6.6 20.6-9.4.9-.4 1.9-.8 2.9-1.2 6.6-2.7 13.3-5.1 20-7.4 5-1.7 9.8-3.7 14.6-6 8.7-3.9 17.5-7.7 26.5-11 3.1-1.1 6.2-2.3 9.2-3.7 4.2-1.7 6.8-1.6 11.3-1.3z" />
                  </svg>
                </div>
                <span className="font-bold text-2xl text-white">FlowPilot</span>
              </div>

              <p className="text-blue-100 mb-6">
                Solución avanzada para la gestión de proyectos en tiempo real.
                Optimiza el flujo de trabajo de tu equipo con herramientas
                intuitivas.
              </p>

              <div className="flex space-x-4">
                <a
                  href="https://github.com/luisnisc/flowpilot"
                  className="bg-blue-800/50 hover:bg-blue-700/50 p-2 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-lg font-bold mb-4 text-white border-b border-blue-700/50 pb-2">
                Producto
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-blue-200 hover:text-white transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    Características
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-lg font-bold mb-4 text-white border-b border-blue-700/50 pb-2">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center group">
                  <div className="bg-blue-800/50 p-2 rounded-full mr-3 group-hover:bg-blue-700 transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <a
                    href="mailto:info@flow-pilot.dev"
                    className="text-blue-200 hover:text-white transition-colors"
                  >
                    info@flow-pilot.dev
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800/50 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 md:mb-0">
                <Link
                  href="/register"
                  className="text-sm text-blue-300 hover:text-white transition-colors"
                >
                  Registrarse
                </Link>
                <span className="text-blue-700">•</span>
                <Link
                  href="/login"
                  className="text-sm text-blue-300 hover:text-white transition-colors"
                >
                  Iniciar sesión
                </Link>
              </div>

              <p className="text-blue-300 text-sm">
                &copy; {new Date().getFullYear()} FlowPilot. Todos los derechos
                reservados.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block absolute bottom-0 right-0 opacity-10">
          <svg width="350" height="350" viewBox="0 0 200 200">
            <path
              fill="currentColor"
              d="M36.4,-60.1C45.9,-54.4,51.5,-41.9,59.2,-29.7C67,-17.5,76.9,-5.8,76.2,5.5C75.5,16.8,64.1,27.8,54,39.1C43.9,50.5,35.1,62.1,23.7,67.1C12.2,72,-1.9,70.1,-14.8,65.7C-27.6,61.2,-39.2,54,-48.4,43.9C-57.6,33.7,-64.4,20.5,-70.9,4.6C-77.4,-11.3,-83.5,-30,-77,-41.6C-70.6,-53.3,-51.5,-57.9,-35.1,-61.1C-18.8,-64.2,-5.1,-65.9,7.1,-66.9C19.4,-68,38.8,-68.5,36.4,-60.1Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>
      </footer>
    </>
  );
}
