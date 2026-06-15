import React from 'react';
import { StepCard, InfoBox, ResourceLink, LearnMore } from './shared';
import { Clock, IndianRupee } from 'lucide-react';

export default function DesignGuide() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Industrial Design Registration Guide (Designs Act 2000)</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          An industrial design protects the <strong>visual appearance</strong> of a product — its shape, configuration, pattern, or ornamentation. In India, designs are governed by the <strong>Designs Act, 2000</strong> and administered by the <strong>Patent Office</strong> under CGPDTM.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBox icon={Clock} title="Timeline" variant="amber">
            <p>Registration: <strong>6–12 months</strong></p>
            <p>Initial validity: <strong>10 years</strong></p>
            <p>Renewable: <strong>+5 years</strong> (15 years max)</p>
          </InfoBox>
          <InfoBox icon={IndianRupee} title="Costs (INR)" variant="emerald">
            <p>Filing (SME): <strong>₹1,000</strong> per design</p>
            <p>Filing (large): <strong>₹2,000</strong> per design</p>
            <p>Renewal (SME): <strong>₹2,000</strong></p>
          </InfoBox>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Step-by-Step Process</h3>

        <StepCard number={1} title="Check Design Registrability">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Novelty</strong> — Must be new/original, not published in India or abroad</li>
            <li><strong>Applied to Article</strong> — Applied to a specific article by industrial process</li>
            <li><strong>Appeal to the Eye</strong> — Visible and judged solely by the eye (no functional features)</li>
            <li><strong>Not Contrary to Public Order</strong></li>
          </ul>
          <p className="mt-2"><strong>Cannot be registered:</strong> Mere mechanical devices, trademarks/logos, artistic works (covered by copyright), functional features, methods of construction.</p>
        </StepCard>

        <StepCard number={2} title="Prepare Representations">
          <ul className="list-disc list-inside">
            <li>Submit <strong>photographs/drawings</strong> from multiple views (front, back, top, perspective)</li>
            <li>Solid lines = design being claimed; dotted lines = portions NOT claimed</li>
            <li>Specify the <strong>article</strong> and <strong>Locarno Classification</strong> class</li>
          </ul>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://www.wipo.int/classifications/locarno/en/" label="Locarno Classification (WIPO)" />
          </div>
        </StepCard>

        <StepCard number={3} title="File Application & Registration">
          <ul className="list-disc list-inside">
            <li>File Form 1 online through IP India Design E-Filing portal</li>
            <li>Multiple designs in same class can be filed in one application</li>
            <li>Priority claim within 6 months if first filed in convention country</li>
            <li>If accepted, design is <strong>registered</strong> and Certificate issued</li>
            <li>Registered designs published in Patent Office Journal after registration</li>
          </ul>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://ipindiaonline.gov.in/designefiling/" label="Design E-Filing Portal" />
          </div>
        </StepCard>

        <StepCard number={4} title="Post-Registration">
          <ul className="list-disc list-inside space-y-1">
            <li>Use design registration number on product/packaging</li>
            <li><strong>Piracy of Registered Design</strong> — applying identical/deceptively similar design without consent is illegal</li>
            <li>File infringement suit in High Court — remedies: injunction, damages, delivery-up</li>
            <li>Maximum penalty for design piracy: <strong>₹25,000</strong> per offence (cumulative)</li>
            <li>License the design through registered agreement</li>
          </ul>
        </StepCard>
      </div>

      <LearnMore>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Official Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://ipindia.gov.in/designs.htm" label="Design Office India" /></li>
              <li><ResourceLink href="https://ipindiaonline.gov.in/designefiling/" label="Design E-Filing Portal" /></li>
              <li><ResourceLink href="https://www.wipo.int/designs/en/" label="WIPO — Industrial Designs" /></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Educational Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://spicyip.com/category/designs" label="SpicyIP — Design Posts" /></li>
            </ul>
          </div>
        </div>
      </LearnMore>
    </div>
  );
}
