import json
import re
import logging
import asyncio
from typing import Dict, Any, Callable, Optional
from core.llm_client import LLMClient
from agents._utils import summarize_context

logger = logging.getLogger(__name__)

SYSTEM_BASE = """You are an IP Strategy AI specialized in Indian Intellectual Property Law.
Your role is to analyze ventures and recommend comprehensive IP protection strategies under Indian law.
All analysis must cite specific Indian statutes:
- Patents Act 1970 (with 2005 amendments)
- Trade Marks Act 1999
- Copyright Act 1957
- Designs Act 2000
- Indian Contract Act 1872 (trade secrets)
Reference Indian Patent Office guidelines, Indian court precedents, and startup IP schemes.
Return structured JSON."""

PATENT_ANALYSIS_PROMPT = """Perform a patent analysis for the following opportunity in the INDIAN context.

Domain: {domain}
Opportunity: {opportunity_json}
Full Context: {full_context}

Analyze patent potential under the INDIAN PATENTS ACT 1970:

1. PATENTABILITY ASSESSMENT:
   - Is the invention novel, non-obvious, and industrially applicable?
   - Section 3 considerations: does any exclusion apply? (Section 3(a) to 3(p))
   - What specific aspects are patentable vs not?

2. PRIOR ART SEARCH STRATEGY:
   - Key search terms for Indian and global databases
   - Expected prior art landscape
   - Freedom to operate considerations

3. PATENT FILING STRATEGY FOR INDIA:
   - Provisional vs complete specification recommendation
   - Filing timeline and milestones
   - PCT route vs direct filing
   - Startup fee discount (80% reduction under Indian rules)

4. PATENT PORTFOLIO RECOMMENDATIONS:
   - Number of patents to file
   - Divisionals and continuations strategy
   - Key jurisdictions for international filing

5. SECTION 3 ANALYSIS:
   - Detailed analysis of potential Section 3 objections
   - Strategies to overcome Section 3 exclusions

Return as JSON with keys: patentability_assessment, prior_art_search_strategy, freedom_to_operate, section_3_considerations, filing_strategy (as dict with type, jurisdictions, timeline, startup_fee_discount, estimated_cost_inr), estimated_patentability_score (1-10), likely_cpc_codes (list), indian_ipc_classes (list)"""

TRADEMARK_ANALYSIS_PROMPT = """Perform a trademark analysis for the following venture in the INDIAN market.

Domain: {domain}
Opportunity: {opportunity_json}

Analyze trademark protection under the INDIAN TRADE MARKS ACT 1999:

1. PROTECTABLE ELEMENTS:
   - Brand name possibilities
   - Logo and device elements
   - Taglines and slogans
   - Trade dress aspects
   - Sound marks (if applicable)

2. NICE CLASSIFICATION:
   - Primary classes for goods/services
   - Associated classes to consider
   - Class descriptions for Indian registry

3. REGISTRATION STRATEGY:
   - Filing approach (word vs device vs combined)
   - User claim vs proposed to be used
   - Multi-class filing strategy
   - International filing via Madrid Protocol

4. CLEARANCE SEARCH:
   - Search strategy for Indian registry
   - Potential conflicts and mitigation
   - Well-known mark considerations

Return as JSON with keys: protectable_elements (list), nice_classes (list), registration_strategy (str), clearance_required (bool), class_description (str)"""

COPYRIGHT_TRADE_SECRET_PROMPT = """Analyze copyright and trade secret protection for the following venture in INDIA.

Domain: {domain}
Opportunity: {opportunity_json}

1. COPYRIGHT ANALYSIS (Copyright Act 1957):
   - Copyrightable elements (software, documentation, content, databases, designs)
   - Ownership considerations (work-for-hire, assignment)
   - Licensing strategy for Indian market
   - Registration recommendation (voluntary but beneficial)

2. TRADE SECRET ANALYSIS (Indian Contract Act 1872):
   - Trade secret candidates (algorithms, formulas, processes, customer data)
   - Protection measures suitable for Indian legal framework
   - NDA and confidentiality agreement recommendations
   - Enforcement limitations under Indian law

3. DESIGN REGISTRATION (Designs Act 2000) — if applicable:
   - Protectable design elements
   - Novelty assessment for Indian market

Return as JSON with keys: copyrightable_elements (list), ownership_notes (str), licensing_strategy (str), trade_secret_candidates (list), protection_measures (list), recommendation (str)"""

IP_STRATEGY_SYNTHESIS_PROMPT = """Based on all IP analyses, create a comprehensive IP STRATEGY for the Indian market.

Domain: {domain}
Patent Analysis: {patent_analysis}
Trademark Analysis: {trademark_analysis}
Copyright & Trade Secret Analysis: {copyright_analysis}

Generate a complete IP strategy:

1. IP PORTFOLIO ROADMAP:
   - Step-by-step timeline for all IP filings in India
   - Priority order (what to file first)
   - Budget allocation across IP types
   - Key milestones (months 1-24)

2. COMMERCIALIZATION PATH:
   - How to monetize IP in Indian market
   - Licensing opportunities in India
   - Technology transfer possibilities
   - IP-backed funding options

3. ENFORCEMENT STRATEGY:
   - IP enforcement mechanisms in India
   - Customs recordal for border protection
   - Litigation strategy for Indian courts
   - Alternative dispute resolution (arbitration, mediation)

4. BUDGET ESTIMATE:
   - Total IP protection budget in INR
   - Year-wise breakdown
   - Cost optimization strategies (startup fee reductions)

5. KEY RECOMMENDATIONS:
   - Top 5 IP actions for the first year
   - Risk mitigation strategies
   - IP portfolio value estimation

Return as JSON with keys: portfolio_roadmap (str), budget_estimate (str), timeline_months (int), commercialization_path (str), estimated_ip_value (str), key_recommendations (list), enforcement_strategy (str)"""


def _extract_json(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    return json.loads(clean)


async def _run_step(llm: LLMClient, prompt: str, system: str, step_name: str, on_step: Optional[Callable] = None) -> dict:
    if on_step:
        await on_step(step_name)
    raw = await llm.complete(prompt, system=system, json_mode=True)
    return _extract_json(raw)


async def run_ip_strategist_multi(
    opportunity: dict,
    domain: str,
    llm: LLMClient,
    on_step: Optional[Callable] = None,
) -> Dict[str, Any]:
    system = SYSTEM_BASE
    opp_json = json.dumps(opportunity)
    if len(opp_json) > 2500:
        opp_json = opp_json[:2500] + "...[truncated]"
    full_context = summarize_context({"domain": domain, "opportunity": opportunity})

    if on_step:
        await on_step("Patent Analysis")
        await on_step("Trademark Analysis")
        await on_step("Copyright & Trade Secrets")
    step1, step2, step3 = await asyncio.gather(
        _run_step(llm, PATENT_ANALYSIS_PROMPT.format(
            domain=domain, opportunity_json=opp_json, full_context=full_context
        ), system, None, None),
        _run_step(llm, TRADEMARK_ANALYSIS_PROMPT.format(
            domain=domain, opportunity_json=opp_json
        ), system, None, None),
        _run_step(llm, COPYRIGHT_TRADE_SECRET_PROMPT.format(
            domain=domain, opportunity_json=opp_json
        ), system, None, None),
    )

    step4 = await _run_step(llm, IP_STRATEGY_SYNTHESIS_PROMPT.format(
        domain=domain,
        patent_analysis=summarize_context(step1),
        trademark_analysis=summarize_context(step2),
        copyright_analysis=summarize_context(step3),
    ), system, "IP Strategy Synthesis", on_step)

    result = {
        "patent_analysis": step1,
        "trademark_analysis": step2,
        "copyright_analysis": step3,
        "trade_secret_analysis": {
            "trade_secret_candidates": step3.get("trade_secret_candidates", []),
            "protection_measures": step3.get("protection_measures", []),
            "recommendation": step3.get("recommendation", ""),
        },
        "ip_strategy": step4,
    }
    return result
