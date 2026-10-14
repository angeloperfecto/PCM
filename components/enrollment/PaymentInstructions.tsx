'use client';

import React, { useState } from 'react';
import { Building2, Copy, Smartphone, Store } from 'lucide-react';
import { usePCM } from '@/lib/store';
import type { PaymentInstructions as Instructions } from '@/lib/types';

export function hasPaymentInstructions(p?: Instructions | null): boolean {
  return !!p && !!(p.gcashNumber || p.bankAccounts?.some((b) => b.accountNumber) || p.cashierLocation || p.notes);
}

// Where and how to pay, from Enrollment & Records → Tuition & Fee Policy → Payment instructions.
export const PaymentInstructions: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { enrollmentSystemConfig } = usePCM();
  const p = enrollmentSystemConfig?.paymentInstructions;
  const [copied, setCopied] = useState<string | null>(null);

  if (!hasPaymentInstructions(p)) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" data-testid="payment-instructions">
        Payment details have not been published yet. Please contact the PCM Finance Office for the GCash number or bank account before paying.
      </p>
    );
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard not available */
    }
  };
  const CopyButton = ({ value }: { value: string }) => (
    <button type="button" onClick={() => copy(value)} className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50">
      <Copy className="h-3 w-3" /> {copied === value ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className={`space-y-2 rounded-xl border border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'} text-xs`} data-testid="payment-instructions">
      <p className="font-bold text-[#18392B]">How to pay</p>
      <ul className="space-y-2">
        {p!.gcashNumber && (
          <li className="flex flex-wrap items-center gap-2">
            <Smartphone className="h-4 w-4 shrink-0 text-[#588B76]" />
            <span>
              <strong>GCash</strong> {p!.gcashName ? `· ${p!.gcashName}` : ''} · <span className="font-mono">{p!.gcashNumber}</span>
            </span>
            <CopyButton value={p!.gcashNumber} />
          </li>
        )}
        {(p!.bankAccounts || [])
          .filter((b) => b.accountNumber)
          .map((b) => (
            <li key={`${b.bank}-${b.accountNumber}`} className="flex flex-wrap items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-[#588B76]" />
              <span>
                <strong>{b.bank}</strong> · {b.accountName} · <span className="font-mono">{b.accountNumber}</span>
                {b.branch ? ` · ${b.branch}` : ''}
              </span>
              <CopyButton value={b.accountNumber} />
            </li>
          ))}
        {p!.cashierLocation && (
          <li className="flex items-start gap-2">
            <Store className="mt-0.5 h-4 w-4 shrink-0 text-[#588B76]" />
            <span>
              <strong>Pay in person:</strong> {p!.cashierLocation}
              {p!.cashierHours ? ` (${p!.cashierHours})` : ''}
            </span>
          </li>
        )}
      </ul>
      {p!.notes && <p className="whitespace-pre-line text-slate-600">{p!.notes}</p>}
      <p className="text-[11px] text-slate-500">After paying, report the payment below with the reference or receipt number so the Finance Office can verify it.</p>
    </div>
  );
};
