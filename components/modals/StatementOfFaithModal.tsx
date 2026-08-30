'use client';

import React from 'react';
import { usePCM } from '@/lib/store';
import { X, ShieldCheck, BookOpen, CheckCircle } from 'lucide-react';

export const StatementOfFaithModal: React.FC = () => {
  const { isStatementOfFaithModalOpen, setStatementOfFaithModalOpen } = usePCM();

  if (!isStatementOfFaithModalOpen) return null;

  const doctrinalArticles = [
    {
      num: 'Article I',
      title: 'The Holy Scriptures',
      text: 'We believe that the sixty-six canonical books of the Old and New Testaments are the verbally inspired Word of God, wholly inerrant in the original manuscripts, infallible, and the supreme, final authority in all matters of faith, doctrine, and conduct.',
      refs: '2 Timothy 3:16–17; 2 Peter 1:20–21; Psalm 119:105',
    },
    {
      num: 'Article II',
      title: 'The Triune God',
      text: 'We believe in one God, eternally existing in three co-equal persons: Father, Son, and Holy Spirit; identical in nature, equal in power and glory, having the exact same perfections and attributes.',
      refs: 'Deuteronomy 6:4; Matthew 28:19; 2 Corinthians 13:14',
    },
    {
      num: 'Article III',
      title: 'The Lord Jesus Christ',
      text: 'We believe in the absolute deity of the Lord Jesus Christ, His virgin birth, His sinless human life, His miracles, His vicarious and substitutionary death on the cross, His bodily resurrection, His ascension to the right hand of the Father, and His personal, visible return in power and glory.',
      refs: 'John 1:1, 14; 1 Corinthians 15:3–4; Hebrews 1:3; Titus 2:13',
    },
    {
      num: 'Article IV',
      title: 'The Holy Spirit',
      text: 'We believe that the Holy Spirit is a divine person who convicts the world of sin, righteousness, and judgment; who regenerates sinners, baptizes all believers into the Body of Christ at salvation, indwells them permanently, and empowers them for godly living and ministerial fruitfulness.',
      refs: 'John 16:8–11; Romans 8:9; Galatians 5:22–23',
    },
    {
      num: 'Article V',
      title: 'The Creation & Fall of Man',
      text: 'We believe that God created man in His own image and likeness, innocent of sin; but by voluntary transgression man fell into sin, incurring both physical death and spiritual alienation from God. Consequently, all human beings are born with a sinful nature and are utterly lost apart from divine grace.',
      refs: 'Genesis 1:26–27; Romans 3:23; Romans 5:12; Ephesians 2:1–3',
    },
    {
      num: 'Article VI',
      title: 'Salvation by Grace through Faith Alone',
      text: 'We believe that salvation is the gift of God brought to man by sovereign grace and received solely by personal faith in the Lord Jesus Christ, whose precious blood was shed on Calvary for the forgiveness of our sins, not by any works of human merit.',
      refs: 'Ephesians 2:8–9; John 14:6; Acts 4:12; Titus 3:5',
    },
    {
      num: 'Article VII',
      title: 'The Church & The Ordinances',
      text: 'We believe that the universal Church is the spiritual Body and Bride of Christ, composed of all born-again believers. We observe two ordinances instituted by Christ: Water Baptism by immersion for believers and the Lord’s Supper in memorial of His sacrificial death.',
      refs: 'Matthew 28:19–20; 1 Corinthians 11:23–26; Ephesians 1:22–23',
    },
    {
      num: 'Article VIII',
      title: 'Christian Living & Pastoral Integrity',
      text: 'We believe that every believer is called to a life of personal holiness, separation from worldly and corrupt practices, loving service toward others, and radical devotion to the Great Commission to preach the Gospel to all nations.',
      refs: '1 Peter 1:15–16; Romans 12:1–2; Matthew 28:19–20',
    },
    {
      num: 'Article IX',
      title: 'The Blessed Hope & Return of Christ',
      text: 'We believe in the personal, premillennial, and imminent return of our Lord Jesus Christ for His redeemed people, which is the comforting and blessed hope of the Church.',
      refs: '1 Thessalonians 4:13–18; Revelation 19:11–16; Titus 2:13',
    },
    {
      num: 'Article X',
      title: 'The Resurrection & Eternal Destiny',
      text: 'We believe in the bodily resurrection of both the saved and the lost: the saved unto eternal conscious joy in the presence of God in the new heavens and new earth, and the lost unto eternal conscious punishment in the lake of fire.',
      refs: 'Matthew 25:46; Revelation 20:11–15; John 5:28–29',
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#18392B] text-white p-6 border-b border-[#588B76]/40 flex items-start justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#588B76]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#85AA9B] font-bold">
                Doctrinal Foundation
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              PCM STATEMENT OF FAITH
            </h3>
          </div>

          <button
            onClick={() => setStatementOfFaithModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preamble */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-sm">
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
            &ldquo;Philippines College of Ministry subscribes without mental reservation to the historic, orthodox evangelical faith. All trustees, faculty, and graduating candidates affirm the following doctrinal tenets as the bedrock of our theological instruction.&rdquo;
          </div>

          {/* Articles */}
          <div className="space-y-6">
            {doctrinalArticles.map((art, idx) => (
              <div key={idx} className="border-b border-slate-200 pb-5 space-y-1.5 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#18392B] text-[#85AA9B] px-2 py-0.5 rounded">
                    {art.num}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#18392B]">
                    {art.title}
                  </h4>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {art.text}
                </p>
                <p className="text-[11px] text-[#588B76] font-mono font-medium">
                  Scripture References: {art.refs}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:px-8 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setStatementOfFaithModalOpen(false)}
            className="bg-[#18392B] hover:bg-[#14234b] text-white text-xs font-semibold px-6 py-2.5 rounded transition cursor-pointer"
          >
            I Affirm & Understand
          </button>
        </div>
      </div>
    </div>
  );
};
