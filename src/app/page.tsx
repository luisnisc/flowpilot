"use client";
import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Componente para las secciones con animación de entrada
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

// Componente para las tarjetas de características
const FeatureCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}) => {
  return (
    <AnimatedSection
      delay={delay}
      className="bg-white rounded-xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-300"
    >
      <div className="text-blue-600 mb-4 text-4xl">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-blue-500">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </AnimatedSection>
  );
};

// Componente para imágenes con animación paralax mejorado
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

// Componente para el indicador de progreso (bola en rieles)
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

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const ballX = useTransform(scrollYProgress, [0, 1], ["0%", "93%"]);

  // Cambiar el estilo del navbar al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Indicador de progreso */}
      <ProgressTracker />

      {/* Navbar con animación */}
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
            ></motion.div>
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
                className={`px-4 py-2 rounded-full font-medium ${
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

      {/* Hero Section con animación */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90 z-10"></div>
          {/* Partículas animadas de fondo */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
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
            <Link href="/register">
              <motion.button
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-full font-bold text-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Empieza gratis ahora
              </motion.button>
            </Link>
            <Link href="#features">
              <motion.button
                className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full font-bold text-lg transition-colors"
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
            className="w-10 h-10 text-white/50"
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

      {/* Sección de características con efectos 3D */}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={
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
              }
              title="Tableros Kanban"
              description="Visualiza el flujo de trabajo de tu equipo con tableros Kanban personalizables y de fácil uso."
              delay={0.1}
            />

            <FeatureCard
              icon={
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
              }
              title="Seguimiento en tiempo real"
              description="Mantente al día con actualizaciones instantáneas sobre el progreso de tus proyectos y tareas."
              delay={0.2}
            />

            <FeatureCard
              icon={
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
              }
              title="Gestión de equipos"
              description="Asigna tareas, colabora en proyectos y coordina a tu equipo desde un solo lugar."
              delay={0.3}
            />

            <FeatureCard
              icon={
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
              }
              title="Análisis y estadísticas"
              description="Obtén información valiosa sobre el rendimiento del equipo y el progreso de los proyectos."
              delay={0.4}
            />

            <FeatureCard
              icon={
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
              }
              title="Notificaciones"
              description="Mantente informado con alertas y recordatorios personalizados sobre fechas de entrega y actualizaciones."
              delay={0.5}
            />

            <FeatureCard
              icon={
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
              }
              title="Personalización"
              description="Adapta la plataforma a las necesidades de tu equipo con flujos de trabajo personalizados."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Sección de capturas de pantalla con paralaje */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Explora FlowPilot en acción
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Visualiza cómo FlowPilot puede transformar la gestión de tus
                proyectos con estas capturas de pantalla.
              </p>
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

            {/* Collage de 3 imágenes que muestran las características clave del proyecto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Imagen de información general del proyecto - más grande a la izquierda */}
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

              {/* Columna derecha con chat y estadísticas */}
              <div className="space-y-4 md:space-y-6">
                {/* Chat en tiempo real */}
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

                {/* Estadísticas del proyecto */}
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

            {/* Etiquetas explicativas */}
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

      {/* Sección de testimonios con efecto carrusel */}
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

      {/* Sección de llamada a la acción */}
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

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">FlowPilot</h3>
              <p className="text-blue-300">
                Solución avanzada para la gestión de proyectos en tiempo real.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    Características
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    Precios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    Guías
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Recursos</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    Documentación
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    Soporte
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contacto</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-blue-300">info@flowpilot.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-blue-400 text-sm">
              &copy; 2025 FlowPilot. Todos los derechos reservados.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a
                href="https://github.com/luisnisc/flowpilot"
                className="text-blue-400 hover:text-white transition-colors"
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
        </div>
      </footer>
    </>
  );
}
