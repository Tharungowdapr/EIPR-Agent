import React from 'react';
import { StepCard, InfoBox, ResourceLink, LearnMore } from './shared';
import { Clock, IndianRupee } from 'lucide-react';

export default function TrademarkGuide() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Trademark Registration Guide (Trade Marks Act 1999)</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          A trademark is a distinctive sign that identifies your goods or services. In India, trademarks are governed by the <strong>Trade Marks Act, 1999</strong> and administered by the <strong>Indian Trademark Registry</strong> under CGPDTM.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBox icon={Clock} title="Timeline" variant="amber">
            <p>Registration: <strong>12–18 months</strong></p>
            <p>Examination: <strong>1–3 months</strong> after filing</p>
            <p>Opposition period: <strong>4 months</strong></p>
            <p>Validity: <strong>10 years</strong> (renewable)</p>
          </InfoBox>
          <InfoBox icon={IndianRupee} title="Costs (INR)" variant="emerald">
            <p>Filing (SME): <strong>₹4,500</strong>/class (e-filing)</p>
            <p>Filing (large): <strong>₹9,000</strong>/class (e-filing)</p>
            <p>Renewal (SME): <strong>₹5,000</strong>/class</p>
          </InfoBox>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Step-by-Step Process</h3>

        <StepCard number={1} title="Trademark Search">
          <p>Search the Indian Trademark Registry to ensure your mark is available:</p>
          <ul className="list-disc list-inside">
            <li>Search for identical and <strong>deceptively similar</strong> marks (phonetic, visual, conceptual similarity)</li>
            <li>Identify the correct <strong>NICE Classification</strong> (45 classes — 1-34 for goods, 35-45 for services)</li>
            <li>Check common law usage in your industry</li>
          </ul>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://ipresearch.ipindia.gov.in/TrademarkSearch/" label="Indian Trademark Search" />
            <ResourceLink href="https://www.wipo.int/classifications/nice/en/" label="NICE Classification (WIPO)" />
          </div>
        </StepCard>

        <StepCard number={2} title="Choose Mark Type">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Word Mark</strong> — Words/phrases (e.g., 'Google') — strongest protection</li>
            <li><strong>Device/Logo Mark</strong> — Graphic design, symbol</li>
            <li><strong>Combined Mark</strong> — Word + logo (most common, narrower protection)</li>
            <li><strong>Sound Mark</strong> — Distinctive sound (requires graphical notation)</li>
            <li><strong>Shape Mark</strong> — 3D product shape/packaging</li>
            <li><strong>Collective/Certification Mark</strong> — Association use / quality standards (e.g., ISI, FSSAI)</li>
          </ul>
        </StepCard>

        <StepCard number={3} title="File Form TM-A">
          <ul className="list-disc list-inside space-y-1">
            <li>File online through IP India e-filing portal</li>
            <li>Include: Applicant details, mark representation, class(es), user claim (date of first use or "proposed to be used")</li>
            <li>File in <strong>multiple classes</strong> if your business spans different categories (separate fee per class)</li>
          </ul>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://ipindiaonline.gov.in/trademarkefiling/" label="Trademark E-Filing Portal" />
          </div>
        </StepCard>

        <StepCard number={4} title="Examination & Publication">
          <ul className="list-disc list-inside">
            <li>Examiner checks <strong>absolute grounds</strong> (distinctiveness, deceptiveness) and <strong>relative grounds</strong> (conflict with prior marks)</li>
            <li>Respond to objections within <strong>1 month</strong></li>
            <li>If accepted, mark is published in the <strong>Trademark Journal</strong> for 4 months opposition</li>
            <li>If opposed, file a counter-statement within 2 months; hearings follow</li>
          </ul>
        </StepCard>

        <StepCard number={5} title="Registration & Enforcement">
          <ul className="list-disc list-inside space-y-1">
            <li>Certificate issued after opposition period passes</li>
            <li>Use <strong>® </strong> symbol only after registration (use <strong>™</strong> during application)</li>
            <li>Validity: <strong>10 years</strong> from filing, renewable every 10 years</li>
            <li><strong>Non-use for 5 consecutive years</strong> makes it vulnerable to cancellation</li>
            <li>File infringement suits in High Court — remedies: injunctions, damages, delivery-up</li>
            <li>Record licenses with Trademark Registry</li>
          </ul>
        </StepCard>
      </div>

      <LearnMore>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Official Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://ipindia.gov.in/trade-marks.htm" label="Trademark Registry India" /></li>
              <li><ResourceLink href="https://ipindiaonline.gov.in/trademarkefiling/" label="Trademark E-Filing" /></li>
              <li><ResourceLink href="https://www.wipo.int/trademarks/en/" label="WIPO — Trademarks" /></li>
              <li><ResourceLink href="https://www.wipo.int/madrid/en/" label="Madrid System (International TM)" /></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Educational Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://nptel.ac.in/courses/110105139/" label="NPTEL: IPR (IIT Madras)" /></li>
              <li><ResourceLink href="https://spicyip.com/category/trademark" label="SpicyIP — Trademark Posts" /></li>
              <li><ResourceLink href="https://www.slajobs.com/category/ipr-trademark/" label="SLA Jobs — IPR Trademark Articles" /></li>
            </ul>
          </div>
        </div>
      </LearnMore>
    </div>
  );
}
