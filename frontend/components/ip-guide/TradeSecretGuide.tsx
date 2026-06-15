import React from 'react';
import { StepCard, InfoBox, ResourceLink, LearnMore } from './shared';
import { Clock, AlertTriangle } from 'lucide-react';

export default function TradeSecretGuide() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Trade Secret Protection Guide</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Trade secrets are confidential business information providing competitive advantage. Unlike patents or trademarks, they are <strong>NOT registered</strong> — they are protected through <strong>confidentiality obligations</strong> and <strong>contracts</strong>. In India, trade secrets are protected under the <strong>Indian Contract Act, 1872</strong> and principles of <strong>equity</strong>, as there is no specific trade secrets legislation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBox icon={Clock} title="Duration" variant="amber">
            <p>Protection: <strong>Unlimited</strong> (while secrecy is maintained)</p>
            <p>No registration or government fees</p>
            <p>Lost once publicly disclosed</p>
          </InfoBox>
          <InfoBox icon={AlertTriangle} title="Examples" variant="blue">
            <p>Customer lists &amp; databases</p>
            <p>Manufacturing processes &amp; formulas</p>
            <p>Software algorithms &amp; source code</p>
            <p>Business strategies &amp; financial data</p>
          </InfoBox>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Key Protection Strategies</h3>

        <StepCard number={1} title="Identify & Classify Trade Secrets">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Technical:</strong> Formulas, algorithms, manufacturing processes, R&D data, prototypes</li>
            <li><strong>Commercial:</strong> Customer lists, supplier lists, pricing strategies, marketing plans</li>
            <li><strong>Financial:</strong> Revenue projections, profit margins, cost structures, funding strategies</li>
            <li><strong>Operational:</strong> SOPs, training manuals, internal processes</li>
          </ul>
          <p className="mt-2">Classify each asset by sensitivity level: <strong>Confidential → Restricted → Internal → Public</strong></p>
        </StepCard>

        <StepCard number={2} title="Implement Security Measures">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Physical:</strong> Locked cabinets, access cards, clean desk policy, shredding</li>
            <li><strong>Digital:</strong> Encryption (AES-256), 2FA, VPN, DLP tools, restricted file sharing</li>
            <li><strong>Access:</strong> Role-based control, principle of least privilege, terminate ex-employee access immediately</li>
            <li><strong>Document:</strong> Watermarking, version control, audit trails, DRM</li>
          </ul>
        </StepCard>

        <StepCard number={3} title="Use Confidentiality Agreements (NDAs)">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Unilateral NDA</strong> — One party discloses (use when pitching to investors)</li>
            <li><strong>Mutual NDA</strong> — Both parties exchange (use in collaborations)</li>
            <li><strong>Employee NDA</strong> — Signed at onboarding (essential for every startup)</li>
            <li><strong>Contractor NDA</strong> — Signed by vendors and contractors</li>
          </ul>
          <p className="mt-2"><strong>Key clauses:</strong> Definition of confidential info, obligations, exclusions, term (perpetual for trade secrets), jurisdiction, remedies (injunction + damages).</p>
        </StepCard>

        <StepCard number={4} title="Employment Contract IP Clauses">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Assignment of Inventions</strong> — All IP created during employment belongs to employer</li>
            <li><strong>Confidentiality</strong> — Binding even after termination</li>
            <li><strong>Return of Property</strong> — Obligation to return all confidential materials upon exit</li>
            <li><strong>Exit Interview</strong> — Remind departing employees of ongoing obligations</li>
          </ul>
        </StepCard>

        <StepCard number={5} title="Legal Enforcement in India">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Civil:</strong> Suit for breach of confidence / breach of contract / breach of fiduciary duty</li>
            <li><strong>Injunctions:</strong> Interim (temporary) and permanent injunctions to stop disclosure</li>
            <li><strong>Damages:</strong> Compensatory damages or accounts of profits</li>
            <li><strong>Criminal:</strong> IPC Sections 408 (criminal breach of trust), 420 (cheating)</li>
            <li><strong>IT Act 2000:</strong> Section 66 — unauthorized access to confidential data</li>
          </ul>
          <p className="mt-2"><strong>Limitations:</strong> No specific trade secret law in India. Reverse engineering is generally allowed unless contractually prohibited. Proof of misappropriation is difficult.</p>
        </StepCard>
      </div>

      <LearnMore>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Official Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://www.wipo.int/tradesecrets/en/" label="WIPO — Trade Secrets" /></li>
              <li><ResourceLink href="https://www.dipp.gov.in/" label="DPIIT India" /></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Educational Resources</p>
            <ul className="space-y-2 text-sm">
              <li><ResourceLink href="https://nptel.ac.in/courses/109106102/" label="NPTEL: IPR — Trade Secrets Module" /></li>
              <li><ResourceLink href="https://spicyip.com/category/trade-secrets" label="SpicyIP — Trade Secrets" /></li>
            </ul>
          </div>
        </div>
      </LearnMore>
    </div>
  );
}
