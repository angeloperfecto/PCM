'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { usePCM } from '@/lib/store';
import { ArrowRight, Award, BookOpen, Compass, Flame, Heart, Users } from 'lucide-react';
import { Reveal, Stagger } from './fx/motion';
import { RotatingSeal } from './fx/kinetic';

const FOUNDED = 1992;

export const DEVELOPMENT_PILLARS = [
  { title: 'Biblical Knowledge', desc: 'Mastery of Old & New Testament canonical Scriptures in original Greek and Hebrew.', icon: BookOpen },
  { title: 'Spiritual Maturity', desc: 'Disciplines of constant prayer, fasting, holiness, and vibrant walk with the Holy Spirit.', icon: Flame },
  { title: 'Christ-Like Character', desc: 'Uncompromising integrity, moral purity, and humble pastoral vulnerability.', icon: Heart },
  { title: 'Visionary Leadership', desc: 'Strategic organizational governance, elder board wisdom, and team mobilization.', icon: Award },
  { title: 'Ministry Competence', desc: 'Expository homiletics, pastoral counseling, crisis care, and church administration.', icon: Compass },
  { title: 'Servant-Heartedness', desc: 'Washing the feet of the church body and sacrificing for the marginalized.', icon: Users },
];

// About PCM: a photo that opens like a window as you scroll, a turning founding seal, and the six formation pillars.
export const AboutSection: React.FC = () => {
  const { navigateTo, siteConfig } = usePCM();
  const homeAbout = siteConfig?.homeAbout;
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: frame, offset: ['start end', 'center center'] });
  const clip = useTransform(scrollYProgress, [0, 1], ['inset(14% 10% 14% 10% round 2rem)', 'inset(0% 0% 0% 0% round 2rem)']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  const years = new Date().getFullYear() - FOUNDED;

  return (
    <section className="font-text relative w-full overflow-hidden bg-[#f7f5ef] py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        {/* Photo window */}
        <div className="relative lg:col-span-5">
          <motion.div ref={frame} style={reduce ? { clipPath: 'inset(0 round 2rem)' } : { clipPath: clip }} className="relative h-[420px] overflow-hidden sm:h-[520px]">
            <motion.div className="absolute inset-0" style={reduce ? undefined : { scale }}>
              <Image src="/images/pcm-class-discussion.jpg" alt="PCM students in a class discussion in the library" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1d16]/95 via-[#10261d]/30 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f6e3b4]">Philippine Theological Heritage</span>
              <h3 className="font-display mt-2 text-2xl font-semibold leading-tight">Rigorous exegesis meets pastoral piety</h3>
              <p className="mt-2 max-w-sm text-sm text-white/75">Forming faithful shepherds for Philippine local churches and overseas Filipino diaspora.</p>
            </div>
          </motion.div>

          <RotatingSeal
            text="Founded 1992 · Lamtang, Benguet · "
            className="absolute -right-2 -top-8 h-36 w-36 rounded-full bg-[#10261d] text-[#f6e3b4] shadow-[0_20px_50px_-20px_rgba(16,38,29,0.8)] sm:-right-8 sm:h-44 sm:w-44"
          >
            <span className="text-center">
              <span className="font-display block text-4xl font-semibold leading-none text-white sm:text-5xl">{years}</span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#85aa9b]">years of faithfulness</span>
            </span>
          </RotatingSeal>
        </div>

        {/* Editorial */}
        <div className="lg:col-span-7">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#588b76]/30 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#588b76]">
              {homeAbout?.badgeText || 'Institutional Heritage Since 1992'}
            </span>
            <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.04] text-[#10261d] sm:text-5xl lg:text-[3.6rem]">
              Forming lives. Equipping ministers. <em className="italic text-[#588b76]">Serving the Kingdom.</em>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[#18392b]/85 sm:text-lg">
              Founded on June 12, 1992 in Baguio City and situated in Lamtang, Benguet, <strong className="font-semibold text-[#10261d]">Philippine College of Ministry (PCM)</strong> stands as
              a premier theological institution in Northern Luzon and nationwide networks, committed to the historic Christian faith, the inerrancy of Holy Scripture, and
              the urgent imperative of the Great Commission.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#18392b]/70 sm:text-base">
              We do not merely confer academic credentials; we prayerfully cultivate men and women into godly shepherds, missionary church planters, Christian educators,
              and community leaders equipped to confront the intellectual and spiritual challenges of contemporary Southeast Asia.
            </p>
          </Reveal>

          <Stagger className="mt-10 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {DEVELOPMENT_PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Stagger.Item key={p.title}>
                  <div className="group flex gap-4 border-t border-[#18392b]/10 py-5">
                    <span className="font-display w-7 shrink-0 pt-0.5 text-sm text-[#588b76]/70">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-[#10261d]">
                        <Icon className="h-4 w-4 text-[#588b76] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-125" />
                        <span className="bg-gradient-to-r from-[#e8c77a] to-[#e8c77a] bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_2px]">
                          {p.title}
                        </span>
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#18392b]/65">{p.desc}</p>
                    </div>
                  </div>
                </Stagger.Item>
              );
            })}
          </Stagger>

          <Reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              id="about-btn-learn-more"
              onClick={() => navigateTo('about')}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#18392b] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#10261d]"
            >
              Learn more about PCM <ArrowRight className="h-4 w-4 text-[#e8c77a] transition-transform group-hover:translate-x-1" />
            </button>
            <button
              id="about-btn-faith"
              onClick={() => navigateTo('about', 'faith')}
              className="px-2 py-2 text-sm font-semibold text-[#588b76] underline decoration-[#e8c77a] decoration-2 underline-offset-4 transition hover:text-[#10261d]"
            >
              Read our Statement of Faith →
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
