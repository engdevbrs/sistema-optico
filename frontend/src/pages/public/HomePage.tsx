import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Calendar, Clock, Star, Eye, Phone, MapPin,
  Shield, Award, Heart, Zap, CheckCircle2, ArrowRight, Mail,
  Sparkles, Users, Activity, HelpCircle, ChevronDown, CreditCard,
  Banknote, Tag, Percent, Glasses, AlertCircle, Stethoscope,
  Headphones, Sun, MonitorSmartphone, CarFront, ScanEye, Frown,
  Package, Droplets, Grip, ChevronRight,
} from 'lucide-react'
import { useConfig } from '../../hooks/useConfig'
import { useWeeklySchedule } from '../../hooks/useAppointments'
import { usePublicReviews, usePublicAppointmentTypes, useActivePromotions } from '../../hooks/usePublicBooking'
import {
  FadeIn, Stagger, ScaleIn, AnimatedCounter, Float, Marquee,
} from '../../components/public/MotionComponents'
import { CheckupIllustration } from '../../components/public/Illustrations'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function HomePage() {
  const { data: config } = useConfig()
  const { data: schedule } = useWeeklySchedule()
  const { data: reviews } = usePublicReviews()
  const { data: appointmentTypes } = usePublicAppointmentTypes()
  const { data: promotions } = useActivePromotions()

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + r.calificacion, 0) / reviews.length
    : 0

  const faqItems = [
    { question: '¿Necesito una receta previa para agendar?', answer: 'No es necesario. Nuestros profesionales realizarán un examen visual completo durante tu cita y te darán la receta correspondiente si es necesaria.' },
    { question: '¿Cuánto dura la consulta?', answer: 'Dependiendo del tipo de consulta, entre 20 y 60 minutos. Una consulta general dura aproximadamente 45 minutos, un control 20 minutos y un examen visual completo 60 minutos.' },
    { question: '¿Atienden niños?', answer: 'Sí, atendemos pacientes de todas las edades. Los menores de edad deben venir acompañados por un adulto responsable.' },
    { question: '¿Puedo cancelar o reagendar mi cita?', answer: 'Sí, puedes cancelar o cambiar la fecha de tu cita desde el link que te enviamos al momento de reservar. Te pedimos hacerlo con al menos 24 horas de anticipación.' },
    { question: '¿Cómo llego y dónde los encuentro?', answer: 'Estamos ubicados en el Piso 2, Local 8. Contamos con estacionamiento gratuito para nuestros pacientes frente al edificio.' },
    { question: '¿Trabajan con seguros o Fonasa/Isapre?', answer: 'Emitimos boleta y receta oficial que puedes presentar en tu seguro o Isapre para reembolso. Consulta con tu aseguradora los montos cubiertos.' },
  ]

  const businessName = config?.nombre_optica ?? 'Óptica Chiguayante'

  return (
    <div style={{ overflow: 'hidden' }}>
      <Helmet>
        <title>{businessName} — Examen Visual Gratuito | Lentes y Marcos en Chiguayante</title>
        <meta name="description" content={`${businessName} en Chiguayante, Concepción. Examen visual gratuito con receta incluida. Lentes ópticos, lentes de sol, marcos Ray-Ban, Oakley y más. Agenda en 60 segundos.`} />
        <link rel="canonical" href="https://tuoptica.cl/" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          })}
        </script>
      </Helmet>

      {/* ═══════════════════════════════════════════════
          HERO — Full viewport, parallax, glassmorphism
          ═══════════════════════════════════════════════ */}
      <section ref={heroRef} aria-label="Examen visual gratuito" className="relative min-h-screen flex items-center justify-center">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 -z-10" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(59,130,246,0.08) 0%, transparent 60%), var(--bg-page)',
        }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full -z-10"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}
          animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[15%] left-[5%] w-[350px] h-[350px] rounded-full -z-10"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }}
          animate={{ x: [0, -20, 25, 0], y: [0, 20, -15, 0], scale: [1, 0.95, 1.08, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-5xl mx-auto px-4 sm:px-6 py-20 w-full text-center">
          {/* Rating pill */}
          {avgRating > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-8"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.05) inset',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.div key={s} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5 + s * 0.08, type: 'spring', stiffness: 500 }}>
                    <Star size={14} style={{ color: s <= Math.round(avgRating) ? '#F59E0B' : 'var(--border)', fill: s <= Math.round(avgRating) ? '#F59E0B' : 'transparent' }} />
                  </motion.div>
                ))}
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{avgRating.toFixed(1)}</span>
              <div className="w-px h-4" style={{ backgroundColor: 'var(--border)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{reviews?.length} reseñas verificadas</span>
            </motion.div>
          )}

          {/* Main heading — much larger */}
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Examen visual
            <br />
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6, type: 'spring', stiffness: 150 }}
              className="relative inline-block"
            >
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 40%, #EC4899 70%, #2563EB 100%)',
                backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-shift 5s ease infinite',
              }}>
                gratuito
              </span>
              {/* Underline decoration */}
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED, #EC4899)', opacity: 0.3 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.6, ease: 'easeOut' }}
              />
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-lg sm:text-xl lg:text-2xl mt-8 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Te evaluamos, te damos tu receta y te asesoramos con los mejores lentes — <strong style={{ color: 'var(--text-primary)' }}>sin costo</strong>. Agenda en 60 segundos.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link to="/reservar"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4.5 text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                  color: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(37,99,235,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
                }}
              >
                <Calendar size={22} />
                Agendar mi examen gratis
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
            {config?.telefono && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a href={`tel:${config.telefono.replace(/\s/g, '')}`}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4.5 text-lg font-medium"
                  style={{
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border)',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <Phone size={20} /> Llamar ahora
                </a>
              </motion.div>
            )}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10"
          >
            {[
              { icon: CheckCircle2, text: 'Examen completo' },
              { icon: CheckCircle2, text: 'Receta incluida' },
              { icon: CheckCircle2, text: 'Asesoría gratis' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 + i * 0.12 }}
                className="flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--badge-success-bg)' }}>
                  <Icon size={11} style={{ color: 'var(--status-success)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Availability badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.1, type: 'spring' }}
            className="inline-flex items-center gap-2 mt-8 px-5 py-2.5"
            style={{ backgroundColor: 'var(--badge-success-bg)', borderRadius: '12px', border: '1px solid var(--status-success)' }}
          >
            <motion.span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: 'var(--status-success)' }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--status-success)' }}>
              Cupos disponibles esta semana
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 rounded-full flex items-start justify-center pt-2" style={{ border: '2px solid var(--border)' }}>
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--text-muted)' }}
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS — Bento-style cards
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.1}>
            {[
              { value: 500, prefix: '+', label: 'Pacientes atendidos', icon: Users, gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)' },
              { value: avgRating > 0 ? avgRating : 5.0, label: 'Calificación promedio', icon: Star, gradient: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)', decimals: 1 },
              { value: 5, prefix: '+', label: 'Años de experiencia', icon: Award, gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)' },
              { value: 100, suffix: '%', label: 'Compromiso contigo', icon: Heart, gradient: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)' },
            ].map(({ value, prefix, suffix, label, icon: Icon, gradient, decimals }) => (
              <motion.div
                key={label}
                className="relative p-6 text-center overflow-hidden"
                style={{ background: gradient, border: '1px solid var(--border)', borderRadius: '20px' }}
                whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.3 }}
              >
                <Icon size={20} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <AnimatedCounter
                  value={value}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals ?? 0}
                  className="block text-4xl sm:text-5xl font-extrabold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                />
                <p className="text-xs font-medium mt-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SERVICES — Large cards, gradient accent
          ═══════════════════════════════════════════════ */}
      {appointmentTypes && appointmentTypes.length > 0 && (
        <section className="px-4 sm:px-6 py-24" id="servicios">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-16">
              <motion.span
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))', color: 'var(--btn-primary-bg)', borderRadius: '12px' }}
              >
                <Sparkles size={14} /> Servicios
              </motion.span>
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Consultas gratuitas,
                <br />
                <span style={{ color: 'var(--text-muted)' }}>siempre.</span>
              </h2>
            </FadeIn>

            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.1}>
              {appointmentTypes.map((type, i) => {
                const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1']
                const icons = [Eye, Award, Shield, Zap, Heart, Activity]
                const Icon = icons[i % icons.length]
                const color = colors[i % colors.length]
                return (
                  <motion.div
                    key={type.id}
                    whileHover={{ y: -8, boxShadow: `0 20px 60px ${color}15` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <Link to={`/reservar?tipo=${type.id}`}
                      className="group relative block p-7 h-full overflow-hidden"
                      style={{ border: '1px solid var(--border)', borderRadius: '24px', backgroundColor: 'var(--bg-surface)' }}
                    >
                      {/* Gradient accent top */}
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }} />

                      <div className="flex items-center justify-between mb-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
                          <Icon size={28} style={{ color }} />
                        </div>
                        <motion.span
                          className="text-xs font-extrabold px-3 py-1.5 tracking-wider"
                          style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--status-success)', borderRadius: '10px' }}
                          animate={{ scale: [1, 1.03, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          GRATIS
                        </motion.span>
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{type.nombre}</h3>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                        Incluye examen visual, receta profesional y asesoría personalizada.
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-semibold px-3 py-1.5" style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                          <Clock size={12} className="inline mr-1" />{type.duracion_min} min
                        </span>
                        <motion.span
                          className="inline-flex items-center gap-1 text-sm font-bold"
                          style={{ color }}
                        >
                          Reservar <ChevronRight size={14} className="transition-transform group-hover:translate-x-1.5" />
                        </motion.span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </Stagger>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — Horizontal timeline
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.1))', color: 'var(--status-success)', borderRadius: '12px' }}
            >
              <Zap size={14} /> Así de fácil
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              3 pasos,
              <br />
              <span style={{ color: 'var(--text-muted)' }}>0 complicaciones.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Desktop connecting line */}
            <FadeIn direction="none" delay={0.5}>
              <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-px" style={{
                background: 'linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent)',
              }} />
            </FadeIn>

            {[
              { num: '01', title: 'Agenda gratis', desc: 'Elige el tipo de consulta y el horario que te acomode.', icon: Calendar, color: '#3B82F6' },
              { num: '02', title: 'Te examinamos', desc: 'Evaluación visual completa + receta profesional incluida.', icon: Eye, color: '#10B981' },
              { num: '03', title: 'Te asesoramos', desc: 'Te ayudamos a elegir los lentes ideales para ti.', icon: CheckCircle2, color: '#8B5CF6' },
            ].map(({ num, title, desc, icon: Icon, color }, i) => (
              <FadeIn key={num} delay={0.1 + i * 0.2}>
                <motion.div
                  className="relative text-center p-8 h-full"
                  style={{ border: '1px solid var(--border)', borderRadius: '24px', backgroundColor: 'var(--bg-surface)' }}
                  whileHover={{ y: -6, boxShadow: `0 16px 48px ${color}12` }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step number */}
                  <motion.div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-xs font-extrabold tracking-wider"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}80)`, color: '#fff' }}
                    whileHover={{ scale: 1.15, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {num}
                  </motion.div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: `${color}08` }}
                  >
                    <Icon size={32} style={{ color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-12" delay={0.5}>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link to="/reservar"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-bold"
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  color: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
                }}
              >
                Agendar mi examen gratis <ArrowRight size={18} />
              </Link>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          WARNING SIGNS — Bento grid
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left large card */}
            <FadeIn direction="left" className="lg:col-span-2">
              <div className="p-8 h-full flex flex-col justify-between" style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
              }}>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-6"
                    style={{ backgroundColor: 'var(--badge-danger-bg)', color: 'var(--badge-danger-text)', borderRadius: '12px' }}
                  >
                    <AlertCircle size={12} /> Importante
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
                    ¿Reconoces estas señales?
                  </h2>
                  <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Si experimentas alguno de estos síntomas, es momento de una evaluación profesional.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Link to="/reservar"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold"
                    style={{ backgroundColor: 'var(--status-danger)', color: '#fff', borderRadius: '14px', boxShadow: '0 4px 16px rgba(239,68,68,0.25)' }}
                  >
                    Agendar examen <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </div>
            </FadeIn>

            {/* Right grid of symptom cards */}
            <FadeIn direction="right" className="lg:col-span-3">
              <Stagger className="grid grid-cols-2 sm:grid-cols-3 gap-3" staggerDelay={0.06}>
                {[
                  { icon: Headphones, text: 'Dolores de cabeza', color: '#EF4444' },
                  { icon: ScanEye, text: 'Vista borrosa', color: '#3B82F6' },
                  { icon: Eye, text: 'Fatiga visual', color: '#F59E0B' },
                  { icon: MonitorSmartphone, text: 'Acercas el celular', color: '#8B5CF6' },
                  { icon: CarFront, text: 'Manejar de noche', color: '#6366F1' },
                  { icon: Frown, text: 'Entrecierras ojos', color: '#10B981' },
                ].map(({ icon: Icon, text, color }) => (
                  <motion.div
                    key={text}
                    className="p-5 text-center"
                    style={{ backgroundColor: `${color}06`, border: '1px solid var(--border)', borderRadius: '20px' }}
                    whileHover={{ y: -4, borderColor: `${color}40`, boxShadow: `0 8px 24px ${color}10` }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: `${color}12` }}
                      whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon size={24} style={{ color }} />
                    </motion.div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{text}</p>
                  </motion.div>
                ))}
              </Stagger>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRODUCTS — Horizontal scroll feel
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', color: '#8B5CF6', borderRadius: '12px' }}
            >
              <Glasses size={14} /> Productos
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Todo para tu visión,
              <br />
              <span style={{ color: 'var(--text-muted)' }}>en un solo lugar.</span>
            </h2>
          </FadeIn>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" staggerDelay={0.06}>
            {[
              { icon: Glasses, name: 'Lentes ópticos', color: '#3B82F6' },
              { icon: Sun, name: 'Lentes de sol', color: '#F59E0B' },
              { icon: Grip, name: 'Marcos', color: '#8B5CF6' },
              { icon: Package, name: 'Estuches', color: '#10B981' },
              { icon: Droplets, name: 'Accesorios', color: '#6366F1' },
              { icon: ScanEye, name: 'Contacto', color: '#EF4444' },
            ].map(({ icon: Icon, name, color }) => (
              <motion.div
                key={name}
                className="text-center p-6"
                style={{ backgroundColor: `${color}05`, border: '1px solid var(--border)', borderRadius: '20px' }}
                whileHover={{ y: -6, borderColor: `${color}40`, boxShadow: `0 12px 36px ${color}12` }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${color}10` }}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon size={28} style={{ color }} />
                </motion.div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{name}</p>
              </motion.div>
            ))}
          </Stagger>

          {/* Value proposition banner */}
          <FadeIn className="mt-14" delay={0.2}>
            <motion.div
              className="relative overflow-hidden p-8 sm:p-10 text-center"
              style={{
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.06) 100%)',
                border: '1px solid var(--border)',
              }}
              whileHover={{ boxShadow: '0 8px 40px rgba(37,99,235,0.08)' }}
            >
              <p className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
                Examen + receta + asesoría = <span className="inline-block" style={{
                  backgroundImage: 'linear-gradient(135deg, #10B981, #34D399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>$0</span>
              </p>
              <p className="text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
                Todo gratis en una sola visita
              </p>
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Link to="/reservar"
                  className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-bold"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}
                >
                  <Calendar size={20} /> Agendar mi examen gratis <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          WHY US — Side by side with illustration
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <Float range={8} duration={6}>
                <CheckupIllustration className="w-full max-w-sm mx-auto" />
              </Float>
            </FadeIn>

            <FadeIn direction="right">
              <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.1))', color: 'var(--btn-primary-bg)', borderRadius: '12px' }}
              >
                <Award size={14} /> Por qué nosotros
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-8" style={{ color: 'var(--text-primary)' }}>
                Confianza que se ve en los resultados
              </h2>
              <Stagger className="space-y-4" staggerDelay={0.1}>
                {[
                  { icon: Zap, title: 'Todo gratis', desc: 'Examen, receta y asesoría sin costo.', color: '#3B82F6' },
                  { icon: Shield, title: 'Profesionales certificados', desc: 'Años de experiencia clínica.', color: '#10B981' },
                  { icon: Heart, title: 'Servicio completo', desc: 'Evaluamos, recetamos y equipamos.', color: '#F59E0B' },
                  { icon: Activity, title: 'Tecnología moderna', desc: 'Diagnósticos precisos y actualizados.', color: '#8B5CF6' },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <motion.div
                    key={title}
                    className="flex items-start gap-4 p-4"
                    style={{ border: '1px solid var(--border)', borderRadius: '16px' }}
                    whileHover={{ y: -3, borderColor: `${color}40`, boxShadow: `0 8px 24px ${color}08`, backgroundColor: `${color}03` }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10` }}>
                      <Icon size={22} style={{ color }} />
                    </div>
                    <div>
                      <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </Stagger>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS — Large featured review
          ═══════════════════════════════════════════════ */}
      {reviews && reviews.length > 0 && (
        <section className="px-4 sm:px-6 py-24" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.1))', color: '#F59E0B', borderRadius: '12px' }}
              >
                <Star size={14} /> Testimonios
              </span>
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Pacientes felices,
                <br />
                <span style={{ color: 'var(--text-muted)' }}>resultados reales.</span>
              </h2>
              {avgRating > 0 && (
                <motion.div
                  className="inline-flex items-center gap-3 mt-6 px-5 py-2.5"
                  style={{ backgroundColor: 'var(--badge-warning-bg)', borderRadius: '12px' }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} size={18} style={{ color: s <= Math.round(avgRating) ? '#F59E0B' : 'var(--border)', fill: s <= Math.round(avgRating) ? '#F59E0B' : 'transparent' }} />)}</div>
                  <span className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>{avgRating.toFixed(1)}</span>
                </motion.div>
              )}
            </FadeIn>

            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.1}>
              {reviews.map((review, i) => (
                <motion.div
                  key={i}
                  className="relative p-7"
                  style={{ border: '1px solid var(--border)', borderRadius: '24px', backgroundColor: 'var(--bg-surface)' }}
                  whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.06)' }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Large quote */}
                  <div className="text-7xl font-serif leading-none absolute top-4 right-6 opacity-[0.04]" style={{ color: 'var(--btn-primary-bg)' }}>"</div>
                  <div className="flex gap-0.5 mb-4">
                    {[1,2,3,4,5].map((s) => <Star key={s} size={16} style={{ color: s <= review.calificacion ? '#F59E0B' : 'var(--border)', fill: s <= review.calificacion ? '#F59E0B' : 'transparent' }} />)}
                  </div>
                  {review.comentario && <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-primary)' }}>{review.comentario}</p>}
                  <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff' }}
                    >
                      {((review.paciente as unknown as { nombre: string })?.nombre ?? 'P').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {(review.paciente as unknown as { nombre: string })?.nombre?.split(' ')[0] ?? 'Paciente'}
                      </p>
                      <p className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--status-success)' }}>
                        <CheckCircle2 size={10} /> Verificado
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          PROMOTIONS
          ═══════════════════════════════════════════════ */}
      {promotions && promotions.length > 0 && (
        <section className="px-4 sm:px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(248,113,113,0.1))', color: 'var(--status-danger)', borderRadius: '12px' }}
              >
                <Percent size={14} /> Ofertas
              </span>
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Promociones activas
              </h2>
            </FadeIn>

            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.1}>
              {promotions.map((promo) => (
                <motion.div
                  key={promo.id}
                  className="relative overflow-hidden p-7"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, transparent 100%)',
                  }}
                  whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(239,68,68,0.08)' }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #EF4444, #F97316)' }} />
                  <div className="flex items-start justify-between mb-4">
                    <Tag size={24} style={{ color: 'var(--status-danger)' }} />
                    <motion.span
                      className="text-2xl font-extrabold"
                      style={{ color: 'var(--status-danger)' }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      -{promo.porcentaje}%
                    </motion.span>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{promo.nombre}</h3>
                  {promo.categoria && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Aplica a: {(promo.categoria as unknown as { nombre: string }).nombre}</p>
                  )}
                  {promo.producto && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Producto: {(promo.producto as unknown as { nombre: string }).nombre}</p>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      Hasta el {new Date(promo.fecha_fin + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </Stagger>

            <FadeIn className="text-center mt-10" delay={0.2}>
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Link to="/reservar"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #F97316)', color: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(239,68,68,0.3)' }}
                >
                  Aprovechar oferta <ArrowRight size={18} />
                </Link>
              </motion.div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          PREPARATION + PAYMENT — Two columns
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FadeIn direction="left">
              <div className="p-8 h-full" style={{ border: '1px solid var(--border)', borderRadius: '24px' }}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>
                    <Stethoscope size={22} color="#fff" />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Antes de tu cita</h3>
                </div>
                <Stagger className="space-y-3" staggerDelay={0.06}>
                  {[
                    { icon: Glasses, text: 'Trae tus lentes actuales', color: '#3B82F6' },
                    { icon: Eye, text: 'Retira contactos 2h antes', color: '#8B5CF6' },
                    { icon: AlertCircle, text: 'Informa tus medicamentos', color: '#F59E0B' },
                    { icon: Users, text: 'Menores acompañados', color: '#10B981' },
                    { icon: Clock, text: 'Llega 5 min antes', color: '#EF4444' },
                  ].map(({ icon: Icon, text, color }) => (
                    <motion.div
                      key={text}
                      className="flex items-center gap-3 p-3.5"
                      style={{ borderRadius: '14px' }}
                      whileHover={{ backgroundColor: `${color}06` }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10` }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{text}</p>
                    </motion.div>
                  ))}
                </Stagger>
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="p-8 h-full" style={{ border: '1px solid var(--border)', borderRadius: '24px' }}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #818CF8)' }}>
                    <CreditCard size={22} color="#fff" />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Métodos de pago</h3>
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Múltiples formas de pago para tu comodidad
                </p>
                <Stagger className="grid grid-cols-2 gap-3" staggerDelay={0.08}>
                  {[
                    { icon: Banknote, label: 'Efectivo', desc: 'Pesos chilenos', color: '#10B981' },
                    { icon: CreditCard, label: 'Débito', desc: 'Todas las tarjetas', color: '#3B82F6' },
                    { icon: CreditCard, label: 'Crédito', desc: 'Visa, MC, Amex', color: '#8B5CF6' },
                    { icon: ArrowRight, label: 'Transferencia', desc: 'Bancaria', color: '#F59E0B' },
                  ].map(({ icon: Icon, label, desc, color }) => (
                    <motion.div
                      key={label}
                      className="p-4 text-center"
                      style={{ backgroundColor: `${color}06`, borderRadius: '16px', border: '1px solid var(--border)' }}
                      whileHover={{ y: -3, borderColor: `${color}40` }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon size={24} className="mx-auto mb-2" style={{ color }} />
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </motion.div>
                  ))}
                </Stagger>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          BRANDS — Infinite marquee
          ═══════════════════════════════════════════════ */}
      <section className="py-20 overflow-hidden">
        <FadeIn className="text-center mb-10 px-4">
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Trabajamos con las mejores marcas
          </p>
        </FadeIn>
        <Marquee speed={25}>
          {['Ray-Ban', 'Oakley', 'Tom Ford', 'Gucci', 'Prada', 'Essilor', 'Vogue', 'Carrera', 'Hugo Boss', 'Emporio Armani'].map((brand) => (
            <div key={brand} className="px-10 py-5 shrink-0" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
              <span className="text-xl font-extrabold tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{brand}</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ — Clean accordion
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))', color: 'var(--btn-primary-bg)', borderRadius: '12px' }}
            >
              <HelpCircle size={14} /> FAQ
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Preguntas
              <br />
              <span style={{ color: 'var(--text-muted)' }}>frecuentes</span>
            </h2>
          </FadeIn>

          <Stagger className="space-y-3" staggerDelay={0.06}>
            {faqItems.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SCHEDULE + LOCATION
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24" id="ubicacion">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.1))', color: 'var(--btn-primary-bg)', borderRadius: '12px' }}
            >
              <MapPin size={14} /> Encuéntranos
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Visítanos
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FadeIn direction="left">
              <div className="p-8 h-full" style={{ border: '1px solid var(--border)', borderRadius: '24px' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}>
                    <Clock size={18} color="#fff" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Horarios</h3>
                </div>
                <div className="space-y-1">
                  {schedule?.map((day, i) => {
                    const isToday = new Date().getDay() === day.dia_semana
                    return (
                      <motion.div
                        key={day.dia_semana}
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-3 px-4"
                        style={{
                          backgroundColor: isToday ? 'var(--badge-primary-bg)' : 'transparent',
                          borderRadius: '12px',
                          border: isToday ? '1.5px solid var(--btn-primary-bg)' : '1.5px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          {isToday && (
                            <motion.span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: 'var(--btn-primary-bg)' }}
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          <span className={`text-sm ${isToday ? 'font-bold' : 'font-medium'}`} style={{ color: isToday ? 'var(--btn-primary-bg)' : 'var(--text-primary)' }}>
                            {DAY_NAMES[day.dia_semana]}{isToday ? ' (Hoy)' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: day.activo ? (isToday ? 'var(--btn-primary-bg)' : 'var(--text-primary)') : 'var(--text-muted)' }}>
                          {day.activo ? `${day.hora_inicio.slice(0, 5)} - ${day.hora_fin.slice(0, 5)}` : 'Cerrado'}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="p-8 flex flex-col h-full" style={{ border: '1px solid var(--border)', borderRadius: '24px' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
                    <MapPin size={18} color="#fff" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Ubicación</h3>
                </div>
                <div className="space-y-3 flex-1">
                  {config?.direccion && (
                    <div className="flex items-start gap-3 p-4" style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '14px' }}>
                      <MapPin size={16} style={{ color: 'var(--btn-primary-bg)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{config.direccion}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Piso 2, Local 8</p>
                      </div>
                    </div>
                  )}
                  {config?.telefono && (
                    <motion.a
                      href={`tel:${config.telefono.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 p-4 block"
                      style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '14px' }}
                      whileHover={{ backgroundColor: 'var(--badge-primary-bg)' }}
                    >
                      <Phone size={16} style={{ color: 'var(--btn-primary-bg)' }} />
                      <span className="text-sm font-bold" style={{ color: 'var(--btn-primary-bg)' }}>{config.telefono}</span>
                    </motion.a>
                  )}
                  {config?.email && (
                    <motion.a
                      href={`mailto:${config.email}`}
                      className="flex items-center gap-3 p-4 block"
                      style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '14px' }}
                      whileHover={{ backgroundColor: 'var(--badge-primary-bg)' }}
                    >
                      <Mail size={16} style={{ color: 'var(--btn-primary-bg)' }} />
                      <span className="text-sm font-bold" style={{ color: 'var(--btn-primary-bg)' }}>{config.email}</span>
                    </motion.a>
                  )}
                </div>
                <motion.div
                  className="mt-6 rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}
                  whileHover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
                >
                  <iframe
                    title="Ubicación de la óptica"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d797.6312595741945!2d-73.0309093303338!3d-36.901706925826666!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9669b771bfc72d1d%3A0x172cf877d4f1138c!2sAv.%20O&#39;Higgins%201074%2C%20Chiguayante%2C%20B%C3%ADo%20B%C3%ADo!5e0!3m2!1ses-419!2scl!4v1773947332284!5m2!1ses-419!2scl"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA FINAL — Gradient glass
          ═══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <ScaleIn>
          <div className="max-w-4xl mx-auto relative overflow-hidden p-12 sm:p-20 text-center"
            style={{
              borderRadius: '32px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #7C3AED 40%, #2563EB 70%, #6366F1 100%)',
              backgroundSize: '300% 300%',
              animation: 'gradient-shift 8s ease infinite',
            }}
          >
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            {/* Glow orbs */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }}
              animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={40} color="#fff" className="mx-auto mb-6 opacity-80" />
              </motion.div>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Tu examen visual
                <br />gratuito te espera
              </h2>
              <p className="text-lg mt-5 text-white/70 max-w-xl mx-auto leading-relaxed">
                Agenda ahora — te atendemos en menos de 48 horas.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-white/60 text-sm font-medium">
                {['Sin costo', 'Sin cuenta', 'Sin compromiso'].map((item, i) => (
                  <motion.span
                    key={item}
                    className="flex items-center gap-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.12 }}
                  >
                    <CheckCircle2 size={14} /> {item}
                  </motion.span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link to="/reservar"
                    className="inline-flex items-center gap-2.5 px-10 py-5 text-lg font-extrabold"
                    style={{ backgroundColor: '#fff', color: '#1E3A8A', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
                  >
                    <Calendar size={22} /> Agendar ahora <ArrowRight size={18} />
                  </Link>
                </motion.div>
                {config?.telefono && (
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                    <a href={`tel:${config.telefono.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-2.5 px-10 py-5 text-lg font-medium text-white"
                      style={{ border: '2px solid rgba(255,255,255,0.2)', borderRadius: '16px' }}
                    >
                      <Phone size={20} /> {config.telefono}
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </ScaleIn>
      </section>
    </div>
  )
}

// ── FAQ Accordion ─────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      className="overflow-hidden"
      style={{ border: '1px solid var(--border)', borderRadius: '16px' }}
      whileHover={{ borderColor: 'var(--btn-primary-bg)' }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-base font-semibold pr-4" style={{ color: 'var(--text-primary)' }}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <ChevronDown size={20} style={{ color: 'var(--btn-primary-bg)' }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
