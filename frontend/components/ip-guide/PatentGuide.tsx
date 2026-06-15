import React from 'react';
import { StepCard, InfoBox, ResourceLink, LearnMore } from './shared';
import { Clock, IndianRupee } from 'lucide-react';

export default function PatentGuide() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Patent Filing Guide (Indian Patents Act 1970)</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          A patent is an exclusive right granted for an invention — a product or process that provides a new technical solution. In India, patents are governed by the <strong>Patents Act, 1970</strong> and administered by the <strong>Indian Patent Office</strong> under CGPDTM.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBox icon={Clock} title="Timeline" variant="amber">
            <p>Total timeline: <strong>3–5 years</strong> (filing to grant)</p>
            <p>Examination: <strong>6–12 months</strong> after request</p>
            <p>Startup fast-track: <strong>~12 months</strong> via expedited examination</p>
          </InfoBox>
          <InfoBox icon={IndianRupee} title="Estimated Costs (INR)" variant="emerald">
            <p>Filing (startup/SME): <strong>₹1,600</strong> (e-filing)</p>
            <p>Examination: <strong>₹4,000</strong> (SME) / <strong>₹20,000</strong> (large)</p>
            <p>Professional fees: <strong>₹25,000–₹1,00,000+</strong></p>
            <p><strong>Startup benefit:</strong> 80% fee reduction under Startup India IP Scheme</p>
          </InfoBox>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Step-by-Step Process</h3>

        <StepCard number={1} title="Determine Patentability">
          <p>Verify your invention meets the three criteria under Indian law:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Novelty</strong> — Not published or used anywhere before filing</li>
            <li><strong>Inventive Step</strong> — Not obvious to a person skilled in the art</li>
            <li><strong>Industrial Applicability</strong> — Can be made or used in industry</li>
          </ul>
          <p className="mt-2"><strong>Section 3 Exclusions:</strong> Check your invention isn't excluded — frivolous inventions, discoveries, mathematical methods, business methods, computer programs per se, algorithms, and medical treatment methods are NOT patentable in India.</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://ipindia.gov.in/writereaddata/Portal/ev/sections-index.html" label="Patents Act 1970 — Full Text" />
            <ResourceLink href="https://www.wipo.int/patents/en/" label="WIPO Patent Basics" />
            <ResourceLink href="https://spicyip.com" label="SpicyIP Blog" />
          </div>
        </StepCard>

        <StepCard number={2} title="Prior Art Search">
          <p>Search existing patents and publications worldwide to ensure your invention is novel:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Search Indian database (InPASS) for Indian patents</li>
            <li>Search international databases — USPTO, Espacenet (EPO), PATENTSCOPE (WIPO), Google Patents</li>
            <li>Check non-patent literature — IEEE, Google Scholar, arXiv, ResearchGate</li>
            <li>Hire a professional search firm for comprehensive results (₹10,000–₹50,000)</li>
          </ul>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://ipresearch.ipindia.gov.in/PatentSearch/" label="Indian Patent Database (InPASS)" />
            <ResourceLink href="https://worldwide.espacenet.com/" label="Espacenet (European Patent Office)" />
            <ResourceLink href="https://patents.google.com/" label="Google Patents" />
            <ResourceLink href="https://www.wipo.int/patentscope/en/" label="WIPO PATENTSCOPE" />
          </div>
        </StepCard>

        <StepCard number={3} title="Draft the Patent Specification">
          <p className="font-medium">Option A: Provisional Specification (Recommended)</p>
          <ul className="list-disc list-inside">
            <li>Filed when the invention isn't fully developed — establishes an early <strong>priority date</strong></li>
            <li>Lower fee, simpler format — describes the invention broadly</li>
            <li>Provides <strong>12 months</strong> to file the complete specification</li>
          </ul>
          <p className="font-medium mt-2">Option B: Complete Specification</p>
          <ul className="list-disc list-inside">
            <li>Must include: Title, Field, Background, Summary, Detailed Description, Drawings, <strong>Claims</strong> (most important), and Abstract</li>
            <li><strong>Claims</strong> define the legal boundary — independent claims (broadest) and dependent claims (narrower)</li>
            <li>India requires disclosure of the <strong>best mode</strong> of performing the invention</li>
          </ul>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://ipindia.gov.in/writereaddata/Portal/ev/31_1_file/1-2_guidelines.pdf" label="Indian Patent Manual" />
            <ResourceLink href="https://www.startupindia.gov.in/content/sih/en/ipr.html" label="Startup India IP Portal" />
          </div>
        </StepCard>

        <StepCard number={4} title="File the Application">
          <p>Choose the appropriate application type:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Ordinary Application</strong> — Direct filing in India (Form 1 + Form 2)</li>
            <li><strong>Convention Application</strong> — Filed within 12 months of first filing in a convention country</li>
            <li><strong>PCT Application</strong> — International protection in 150+ countries (national phase at 31 months)</li>
          </ul>
          <p className="mt-2"><strong>Required Forms:</strong> Form 1 (Application), Form 2 (Specification), Form 3 (Foreign filing undertaking), Form 5 (Inventorship declaration), Form 26 (Power of Attorney if via agent)</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://ipindiaonline.gov.in/" label="Indian Patent E-Filing Portal" />
            <ResourceLink href="https://www.wipo.int/pct/en/" label="PCT System (WIPO)" />
          </div>
        </StepCard>

        <StepCard number={5} title="Publication">
          <ul className="list-disc list-inside">
            <li>Automatic publication <strong>18 months</strong> from priority date</li>
            <li>Request <strong>early publication</strong> (Form 9) — published within 1 month</li>
            <li>After publication, application is open for public inspection and third-party opposition</li>
          </ul>
        </StepCard>

        <StepCard number={6} title="Request for Examination">
          <ul className="list-disc list-inside">
            <li>Must request examination (Form 18) within <strong>48 months</strong> from filing — otherwise application is <strong>withdrawn</strong></li>
            <li><strong>Expedited Examination</strong> (Form 18A): Available for startups, small entities — 2-4 months turnaround</li>
            <li>Respond to First Examination Report (FER) within <strong>6 months</strong> (extendable by 3 months)</li>
          </ul>
        </StepCard>

        <StepCard number={7} title="Respond to Examination Report & Grant">
          <ul className="list-disc list-inside space-y-1">
            <li>Amend claims to distinguish from cited prior art</li>
            <li>Provide technical arguments demonstrating inventive step</li>
            <li>Request a hearing if objections persist</li>
            <li>Pay sealing fee (Form 24) within 6 months of grant notification</li>
            <li>Patent term: <strong>20 years</strong> from filing date</li>
            <li>Pay renewal fees <strong>annually</strong> from the 3rd year</li>
          </ul>
        </StepCard>
      </div>

      <LearnMore>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Official Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://ipindia.gov.in/" label="Intellectual Property India — Official Portal" /></li>
              <li><ResourceLink href="https://ipindiaonline.gov.in/" label="Patent E-Filing Portal" /></li>
              <li><ResourceLink href="https://www.startupindia.gov.in/content/sih/en/ipr.html" label="Startup India IPR Scheme" /></li>
              <li><ResourceLink href="https://www.wipo.int/patents/en/" label="WIPO — Patents" /></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Educational Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://nptel.ac.in/courses/109106102/" label="NPTEL: IPR (IIT Kharagpur)" /></li>
              <li><ResourceLink href="https://onlinecourses.swayam2.ac.in/cec21_lw02/preview" label="SWAYAM: IPR and Competition Law" /></li>
              <li><ResourceLink href="https://spicyip.com/" label="SpicyIP — Indian IP Blog" /></li>
              <li><ResourceLink href="https://indiankanoon.org/" label="Indian Case Law (Indian Kanoon)" /></li>
            </ul>
          </div>
        </div>
      </LearnMore>
    </div>
  );
}
