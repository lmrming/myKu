/* Hallmark · component: hero-banner · genre: modern-minimal · theme: custom
 * states: default · hover · focus · active
 * contrast: pass (46–50)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, MapPin } from 'lucide-react';

/* ============================================
   Travel Hero Banner - "Pick a city."
   ============================================
   Design DNA:
   - Background: #0c0c0c (near-black)
   - Primary text: #ffffff (white)
   - Accent: #e74c3c (bright red)
   - Secondary accent: #f1c40f (yellow)
   - Body text: #a0a0a0 (light gray)
   - Fonts: Inter (sans-serif) + Playfair Display (italic)
   - Style: High-contrast, editorial, travel magazine
   ============================================ */

const HeroBanner = () => {
  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#0c0c0c',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Main Content Container */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 24px 60px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Top Row: Badge + Volume */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '48px',
          }}
        >
          {/* Left: Yellow arrow + VOL.14 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#f1c40f',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight
                style={{
                  width: '20px',
                  height: '20px',
                  color: '#0c0c0c',
                  transform: 'rotate(-45deg)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#f1c40f',
              }}
            >
              VOL.14
            </span>
          </motion.div>

          {/* Right: Tilted Badge */}
          <motion.div
            initial={{ opacity: 0, rotate: 8, scale: 0.9 }}
            animate={{ opacity: 1, rotate: 8, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              border: '2px solid #e74c3c',
              padding: '16px 20px',
              transform: 'rotate(8deg)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '4px',
              }}
            >
              DEPARTING TUESDAY
            </p>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '8px',
              }}
            >
              STAMPED IN LISBON
            </p>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#e74c3c',
                letterSpacing: '-0.02em',
              }}
            >
              06.MAY.26
            </p>
          </motion.div>
        </div>

        {/* Main Headline */}
        <div style={{ marginBottom: '24px' }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            Pick a city.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#e74c3c',
              lineHeight: 1.1,
              margin: '8px 0 0 0',
            }}
          >
            We’ll pack the rest.
          </motion.p>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#a0a0a0',
            maxWidth: '480px',
            marginBottom: '48px',
          }}
        >
          Curated travel experiences to the world&apos;s most vibrant destinations.
          Every detail planned, every moment memorable.
        </motion.p>

        {/* Data Table Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          {/* Left: City + Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* Big City Name */}
            <div>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                }}
              >
                NEXT DEPARTURE
              </p>
              <h2
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                LISBON
              </h2>
            </div>

            {/* Divider */}
            <div
              style={{
                width: '1px',
                height: '60px',
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
            />

            {/* Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock style={{ width: '24px', height: '24px', color: '#e67e22' }} />
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                06:42
              </span>
            </div>
          </div>

          {/* Right: Price */}
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#a0a0a0',
                marginBottom: '8px',
              }}
            >
              STARTING FROM
            </p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#e74c3c',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              €387
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#a0a0a0',
                  marginLeft: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                PER PERSON
              </span>
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: '40px' }}
        >
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              backgroundColor: '#e74c3c',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c0392b';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e74c3c';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Explore Trips
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </button>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      {/* Subtle grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: '#e74c3c',
          zIndex: 3,
        }}
      />
    </section>
  );
};

export default HeroBanner;
