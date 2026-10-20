'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { ArrowRight, Eye, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Reveal, Stagger } from './fx/motion';
import { Marquee } from './fx/kinetic';
import { LightField } from './fx/LightField';

const DEFAULT_CORE_VALUES = [
  { title: 'Biblical Faithfulness', desc: 'Unwavering commitment to the inerrancy and authority of Scripture.' },
  { title: 'Christ-Centeredness', desc: 'Exalting Jesus Christ in all doctrine, preaching, worship, and living.' },
  { title: 'Academic Excellence', desc: 'Rigorous exegesis, scholarship, and intellectual discipline.' },
  { title: 'Spiritual Formation', desc: 'Deep prayer, fasting, holy character, and fruit of the Spirit.' },
  { title: 'Servant Leadership', desc: 'Sacrificial, humble ministry patterned after Christ washing feet.' },
  { title: 'Moral Integrity', desc: 'Transparency, financial accountability, and spotless character.' },
  { title: 'Great Commission', desc: 'Passionate evangelism, urban church planting, and global missions.' },
  { title: 'Covenant Community', desc: 'Warm fellowship, accountability, and love in the body of Christ.' },
];

// Mission, vision and core values from Admin → Site settings (with the long-standing defaults), on a night-pine stage.
export const MissionVisionValuesSection: React.FC = () => {
  const { navigateTo, siteConfig } = usePCM();
  const mvv = siteConfig?.missionVisionValues;
  const coreValues = mvv?.coreValues && mvv.coreValues.length > 0 ? mvv.coreValues.map((v) => ({ title: v.title, desc: v.description })) : DEFAULT_CORE_VALUES;
  const half = Math.ceil(coreValues.length / 2);

  const panels = [
    {
      icon: Target,
      eyebrow: 'Our Sacred Mandate',
      title: mvv?.missionTitle || 'Our Mission',
      text:
        mvv?.missionStatement ||
        mvv?.mission ||
        'To provide Christ-centered theological and ministry education that equips faithful servants with biblical truth, spiritual maturity, and practical competence for effective leadership, discipleship, and evangelistic service in the Church and society.',
      refs: '2 Timothy 2:2 • Matthew 28:19–20',
    },
    {
      icon: Eye,
      eyebrow: 'Our Future Horizon',
      title: mvv?.visionTitle || 'Our Vision',
      text:
        mvv?.visionStatement ||
        mvv?.vision ||
        'To become a premier and globally trusted center for evangelical biblical education, spiritual formation, and kingdom leadership in the Philippines and Southeast Asia, raising up shepherds who transform generations for the glory of Jesus Christ.',
      refs: 'Ephesians 4:11–13 • Habakkuk 2:14',
    },
  ];

  const chip = (v: { title: string; desc: string }) => (
    <span
      key={v.title}
      title={v.desc}
      className="mx-2 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/85 backdrop-blur transition hover:border-[#e8c77a]/50 hover:text-[#f6e3b4]"
    >
      <ShieldCheck className="h-4 w-4 text-[#e8c77a]" />
      {v.title}
    </span>
  );

  return (
    <section className="font-text grain relative isolate w-full overflow-hidden bg-[#0b1d16] py-20 text-white lg:py-28">
      <LightField className="-z-10 opacity-60 mix-blend-screen" intensity={0.5} origin={[0.15, -0.2]} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6e3b4]">
            <Sparkles className="h-3.5 w-3.5" /> Institutional Foundations
          </span>
          <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            {mvv?.valuesTitle ? mvv.valuesTitle : (
              <>
                Mission, vision <span className="text-dawn italic">&amp; core values</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-sm text-white/70 sm:text-base">
            {mvv?.valuesSubtitle || 'The theological pillars, spiritual compass, and guiding principles of Philippine College of Ministry.'}
          </p>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {panels.map((p) => {
            const Icon = p.icon;
            return (
              <Stagger.Item key={p.eyebrow} className="h-full">
                <div className="h-full rounded-[2rem] bg-gradient-to-br from-[#e8c77a]/50 via-white/10 to-[#588b76]/40 p-px">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(2rem-1px)] bg-[#0f251c]/95 p-7 sm:p-10">
                    <span aria-hidden="true" className="font-display pointer-events-none absolute -right-2 -top-10 select-none text-[11rem] leading-none text-[#e8c77a]/10">
                      &rdquo;
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8c77a] to-[#f6e3b4] text-[#10261d]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#85aa9b]">{p.eyebrow}</span>
                        <span className="font-display block text-xl font-semibold">{p.title}</span>
                      </span>
                    </div>
                    <p className="font-display relative mt-7 text-xl leading-snug text-white/90 sm:text-2xl lg:text-[1.65rem]">{p.text}</p>
                    <p className="mt-auto pt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#e8c77a]">{p.refs}</p>
                  </div>
                </div>
              </Stagger.Item>
            );
          })}
        </Stagger>

        <Reveal className="mt-14">
          <div className="mb-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <h3 className="font-display text-2xl font-semibold">{mvv?.valuesTitle ? 'Our core values' : 'Our values'}</h3>
            <button onClick={() => navigateTo('about', 'values')} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#f6e3b4] transition hover:text-white">
              Read detailed value descriptors <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="space-y-3">
            <Marquee duration={45} label="Core values">{coreValues.slice(0, half).map(chip)}</Marquee>
            <Marquee duration={50} reverse label="Core values (continued)">
              {coreValues.slice(half).map(chip)}
            </Marquee>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
