'use client';

import { useState } from 'react';
import { Check, ChevronDown, ClipboardList, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

const COMPLIANCE_DATA: Record<string, { category: string; items: { name: string; description: string; link?: string }[] }[]> = {
  technology: [
    {
      category: 'Company Registration',
      items: [
        { name: 'Private Limited Registration', description: 'ROC registration under Companies Act 2013. Required for VC funding.', link: 'https://www.mca.gov.in' },
        { name: 'MSME Registration', description: 'Udyam registration for government benefits and subsidies.', link: 'https://udyamregister.gov.in' },
        { name: 'DPIIT Startup Recognition', description: 'Startup India recognition for tax holidays and IP benefits.', link: 'https://www.startupindia.gov.in' },
      ],
    },
    {
      category: 'Tax Compliance',
      items: [
        { name: 'GST Registration', description: 'Mandatory if turnover exceeds ₹20L (₹10L for NE states). Input tax credit available.', link: 'https://www.gst.gov.in' },
        { name: 'Professional Tax', description: 'State-specific. Applicable in most states for employers.' },
        { name: 'TDS Compliance', description: 'TDS deduction under Income Tax Act. Monthly/quarterly filing.' },
        { name: 'Startup Tax Holiday', description: '3-year tax holiday under Section 80-IAC for DPIIT recognized startups.' },
      ],
    },
    {
      category: 'IP Compliance',
      items: [
        { name: 'Patent Filing', description: 'Indian Patents Act 1970. Provisional before complete specification.', link: 'https://ipindia.gov.in' },
        { name: 'Trademark Registration', description: 'Trade Marks Act 1999. Class-wise registration at CGPDTM.', link: 'https://ipindia.gov.in' },
        { name: 'Copyright Registration', description: 'Copyright Act 1957. Voluntary but recommended for legal proof.', link: 'https://copyright.gov.in' },
        { name: 'IT Act Compliance', description: 'Information Technology Act 2000 for data protection and cybersecurity.' },
      ],
    },
    {
      category: 'Employment & Labour',
      items: [
        { name: 'EPFO Registration', description: 'Employee Provident Fund. Mandatory if 20+ employees.', link: 'https://www.epfindia.gov.in' },
        { name: 'ESIC Registration', description: 'Employee State Insurance. Gross salary ≤₹21,000/month.', link: 'https://www.esic.gov.in' },
        { name: 'Shop & Establishment Act', description: 'State-specific. Working hours, holidays, overtime rules.' },
      ],
    },
    {
      category: 'Data & Privacy',
      items: [
        { name: 'DPDP Act Compliance', description: 'Digital Personal Data Protection Act 2023. Consent management required.', link: 'https://www.meity.gov.in' },
        { name: 'IT Rules 2021', description: 'Intermediary Guidelines for social media and online platforms.' },
      ],
    },
  ],
  ecommerce: [
    {
      category: 'Company Registration',
      items: [
        { name: 'Private Limited / LLP', description: 'LLP recommended for small e-commerce, Pvt Ltd for scaling.', link: 'https://www.mca.gov.in' },
        { name: 'MSME Registration', description: 'Required for priority lending and government schemes.' },
        { name: 'DPIIT Recognition', description: 'Startup India benefits for e-commerce innovations.' },
      ],
    },
    {
      category: 'E-commerce Specific',
      items: [
        { name: 'GST Registration', description: 'Mandatory for e-commerce operators regardless of turnover.', link: 'https://www.gst.gov.in' },
        { name: 'TDS on E-commerce', description: 'Section 194-O: 1% TDS on e-commerce participant payments.' },
        { name: 'Legal Metrology Act', description: 'Mandatory declarations on packaged goods sold online.', link: 'https://www.legalmetrology.gov.in' },
        { name: 'FSSAI License', description: 'Food Safety license if selling food products.', link: 'https://www.fssai.gov.in' },
      ],
    },
    {
      category: 'Consumer Protection',
      items: [
        { name: 'Consumer Protection Act 2019', description: 'E-commerce rules — returns, refunds, grievance officer.', link: 'https://consumeraffairs.nic.in' },
        { name: 'Return & Refund Policy', description: 'Mandatory disclosure of return/refund/cancellation policy.' },
        { name: 'Grievance Redressal', description: 'Appoint grievance officer, display on platform.' },
      ],
    },
  ],
  healthcare: [
    {
      category: 'Healthcare Registration',
      items: [
        { name: 'Clinical Establishment Act', description: 'Registration for clinics, diagnostic centers, hospitals.' },
        { name: 'CDSCO Approval', description: 'Central Drugs Standard Control Organization for medical devices/drugs.', link: 'https://cdsco.gov.in' },
        { name: 'AYUSH Registration', description: 'For alternative medicine or wellness products.' },
      ],
    },
    {
      category: 'Data Privacy',
      items: [
        { name: 'DPDP Act', description: 'Digital Personal Data Protection Act for health data processing.', link: 'https://www.meity.gov.in' },
        { name: 'SPARK Compliance', description: 'SPARK (Simplified Platform for Application & Registration) for health startups.' },
      ],
    },
  ],
  fintech: [
    {
      category: 'RBI Compliance',
      items: [
        { name: 'NBFC License', description: 'Required if lending or taking deposits. Minimum net owned fund ₹2Cr.', link: 'https://www.rbi.org.in' },
        { name: 'PAI_Card License', description: 'Payment Aggregator / Payment Gateway license from RBI.', link: 'https://www.rbi.org.in' },
        { name: 'PPI License', description: 'Prepaid Payment Instruments (wallets) require RBI approval.', link: 'https://www.rbi.org.in' },
      ],
    },
    {
      category: 'Other Financial',
      items: [
        { name: 'SEBI Registration', description: 'Required for investment advisory, portfolio management.', link: 'https://www.sebi.gov.in' },
        { name: 'AML/KYC Compliance', description: 'Anti-Money Laundering standards and KYC norms as per PMLA.' },
        { name: 'IRDAI Registration', description: 'Insurance Regulatory Authority for insurtech.', link: 'https://www.irdai.gov.in' },
      ],
    },
  ],
  general: [
    {
      category: 'Company Registration',
      items: [
        { name: 'Company/Business Registration', description: 'ROC registration under Companies Act or LLP Act.', link: 'https://www.mca.gov.in' },
        { name: 'MSME/Udyam Registration', description: 'Recommended for all small businesses for priority lending.', link: 'https://udyamregister.gov.in' },
        { name: 'GST Registration', description: 'Mandatory if turnover exceeds threshold or for inter-state sales.', link: 'https://www.gst.gov.in' },
      ],
    },
    {
      category: 'Tax & Finance',
      items: [
        { name: 'Income Tax Filing', description: 'Annual filing required for all registered entities.' },
        { name: 'TDS Compliance', description: 'TDS on salaries, contractor payments, rent, professional fees.' },
        { name: 'Audit Requirements', description: 'Tax audit if turnover exceeds ₹1Cr (business) or ₹50L (profession).' },
      ],
    },
    {
      category: 'Labour & Employment',
      items: [
        { name: 'EPFO Registration', description: 'PF registration when 20+ employees.', link: 'https://www.epfindia.gov.in' },
        { name: 'ESIC Registration', description: 'Medical insurance for employees earning ≤₹21K/month.', link: 'https://www.esic.gov.in' },
        { name: 'POSH Act', description: 'Sexual Harassment of Women at Workplace Act. Internal committee required for 10+ employees.' },
      ],
    },
  ],
};

export function ComplianceChecklist({ domain }: { domain: string }) {
  const domainLower = domain.toLowerCase();
  const matchedKey = Object.keys(COMPLIANCE_DATA).find(k => domainLower.includes(k)) || 'general';
  const sections = COMPLIANCE_DATA[matchedKey] || COMPLIANCE_DATA.general;
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.category || null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleChecked = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList size={16} className="text-brand-400" />
        <h2 className="font-semibold text-[var(--text-primary)]">Industry Compliance Checklist (India)</h2>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        India-specific regulatory requirements for your domain. Check items off as you complete them.
      </p>
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.category} className="border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenSection(openSection === section.category ? null : section.category)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span>{section.category}</span>
              <ChevronDown size={14} className={clsx('transition-transform', openSection === section.category && 'rotate-180')} />
            </button>
            {openSection === section.category && (
              <div className="px-3 pb-2 space-y-1">
                {section.items.map((item) => (
                  <div key={item.name} className="flex items-start gap-2 py-1.5">
                    <button
                      onClick={() => toggleChecked(item.name)}
                      className={`flex h-4 w-4 mt-0.5 items-center justify-center rounded border-2 shrink-0 transition-colors ${
                        checked.has(item.name) ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--border-light)]'
                      }`}
                    >
                      {checked.has(item.name) && <Check size={10} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)]">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{item.description}</p>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 mt-0.5 shrink-0">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {checked.size > 0 && (
        <p className="text-xs text-emerald-400 mt-3">{checked.size}/{sections.reduce((sum, s) => sum + s.items.length, 0)} items completed</p>
      )}
    </div>
  );
}
