import React from 'react';
import { StepCard, InfoBox, ResourceLink, LearnMore } from './shared';
import { Clock, IndianRupee } from 'lucide-react';

export default function CopyrightGuide() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Copyright Registration Guide (Copyright Act 1957)</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Copyright protects <strong>original works of authorship</strong>. In India, it is governed by the <strong>Copyright Act, 1957</strong> and administered by the <strong>Copyright Office</strong>. Copyright protects the <strong>expression</strong> of ideas, not the ideas themselves, and exists <strong>automatically</strong> from the moment of creation — registration is voluntary but provides legal advantages.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBox icon={Clock} title="Duration" variant="amber">
            <p>Literary/artistic works: <strong>Lifetime + 60 years</strong></p>
            <p>Registration: <strong>2–6 months</strong></p>
            <p>Films/sound: <strong>60 years</strong> from publication</p>
          </InfoBox>
          <InfoBox icon={IndianRupee} title="Costs (INR)" variant="emerald">
            <p>Literary/Artistic: <strong>₹500</strong> per work</p>
            <p>Software: <strong>₹500</strong> per work</p>
            <p>Cinematograph: <strong>₹5,000</strong> per work</p>
            <p>Sound Recording: <strong>₹2,000</strong> per work</p>
          </InfoBox>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Step-by-Step Process</h3>

        <StepCard number={1} title="Check What is Copyrightable">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Literary Works</strong> — Books, articles, research papers, <strong>computer programs/software</strong>, databases</li>
            <li><strong>Artistic Works</strong> — Paintings, drawings, photographs, architectural works, maps</li>
            <li><strong>Musical Works</strong> — Original compositions (not lyrics or sound recording)</li>
            <li><strong>Cinematograph Films</strong> — Movies, videos, animation</li>
            <li><strong>Sound Recordings</strong> — Recorded audio, podcasts, music recordings</li>
          </ul>
          <p className="mt-2"><strong>Requirements:</strong> The work must be (a) <strong>original</strong> (independent creation with minimal creativity), (b) <strong>fixed</strong> in tangible medium, and (c) not a mere idea/fact/system.</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://copyright.gov.in/" label="Copyright Office India" />
            <ResourceLink href="https://www.wipo.int/copyright/en/" label="WIPO — Copyright" />
          </div>
        </StepCard>

        <StepCard number={2} title="Prepare Application (Form XIV)">
          <ul className="list-disc list-inside space-y-1">
            <li>Statement of Particulars + Statement of Further Particulars</li>
            <li>Two copies of the work (for literary/artistic works)</li>
            <li>NOC from publisher (if published) and from author (if applicant is not the author)</li>
            <li>Power of Attorney (if filed through agent)</li>
            <li>For <strong>software</strong>: submit first 25 and last 25 pages of <strong>source code</strong> + object code</li>
          </ul>
          <p className="mt-2"><strong>Important:</strong> You only submit partial source code — this protects against copying while keeping your full code confidential.</p>
        </StepCard>

        <StepCard number={3} title="File Online & Examination">
          <ul className="list-disc list-inside">
            <li>File through Copyright Office e-filing portal (Form XIV)</li>
            <li>Receive a <strong>Diary Number</strong> immediately — serves as provisional proof</li>
            <li>Examiner checks: completeness, originality (prima facie), third-party claims</li>
            <li>Respond to objections within <strong>30 days</strong></li>
            <li>Hearing may be scheduled if objections persist</li>
          </ul>
          <div className="mt-2 flex gap-2 flex-wrap">
            <ResourceLink href="https://copyright.gov.in/frmLoginOptions.aspx" label="Copyright E-Filing Portal" />
          </div>
        </StepCard>

        <StepCard number={4} title="Registration & Post-Registration">
          <ul className="list-disc list-inside space-y-1">
            <li>Work entered in the <strong>Register of Copyrights</strong>; digital certificate issued</li>
            <li>Use <strong>© </strong> symbol (copyright notice) to deter infringement</li>
            <li>Registration effective from date of filing</li>
            <li><strong>License</strong> your work — specify scope, territory, duration, royalty</li>
            <li>File infringement suits in District Court or High Court</li>
            <li><strong>Customs recordal</strong> — register with Indian Customs to block import of infringing copies</li>
          </ul>
        </StepCard>
      </div>

      <LearnMore>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Official Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://copyright.gov.in/" label="Copyright Office India" /></li>
              <li><ResourceLink href="https://copyright.gov.in/frmLoginOptions.aspx" label="Copyright E-Filing Portal" /></li>
              <li><ResourceLink href="https://www.wipo.int/copyright/en/" label="WIPO — Copyright" /></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Educational Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://onlinecourses.nptel.ac.in/noc23_lw03/preview" label="NPTEL: Law of Copyright (IIT Kharagpur)" /></li>
              <li><ResourceLink href="https://spicyip.com/category/copyright" label="SpicyIP — Copyright Posts" /></li>
              <li><ResourceLink href="https://www.slajobs.com/category/ipr-copyright/" label="SLA Jobs — Copyright Articles" /></li>
            </ul>
          </div>
        </div>
      </LearnMore>
    </div>
  );
}
