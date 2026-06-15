import json
import re
import logging
from typing import Dict, Any, Optional
from core.llm_client import LLMClient

logger = logging.getLogger(__name__)

IP_STRATEGIST_SYSTEM = """You are an IP Strategist AI specialized in INDIAN Intellectual Property Rights law and practice.
Your analysis must reference:
1. Indian Patents Act, 1970 (including amendments) — Section 3 (non-patentable inventions), Section 8 (foreign filing)
2. Indian Patent Office (IPO) practice, patent filing in India (Form 1-8)
3. Indian Trade Marks Act, 1999 — registration process, opposition, infringement
4. Indian Copyright Act, 1957 — software copyright, literary work
5. Indian Design Act, 2000 — design registration at CGPDTM
6. Indian IP filing costs (official fees for startups vs individuals vs companies)
7. CGPDTM (Controller General of Patents, Designs and Trade Marks) procedures
8. Indian IP commercialization — licensing, assignment, technology transfer
9. Indian court system for IP enforcement (Commercial Courts, IP Division)
10. International treaties India is signatory to (TRIPS, Paris Convention, PCT, Madrid Protocol, Berne Convention)
Always return structured JSON with India-specific recommendations."""

IP_STRATEGIST_PROMPT = """Perform a comprehensive IP strategy analysis for this business opportunity under INDIAN IP LAW:

Opportunity Title: {opportunity_title}
Description: {opportunity_description}
Domain: {domain}
Target Market (India): {target_market}
Key Innovation/Technology: {key_innovation}

IMPORTANT: All recommendations must be based on INDIAN IP LAW and practice:
- Indian Patents Act, 1970 (Sections 3 & 4 for patentability exclusions)
- Indian Trade Marks Act, 1999
- Indian Copyright Act, 1957
- Indian Design Act, 2000
- Indian Patent Office procedures and fee structure (startup concession available)
- CGPDTM filing requirements
- Indian IP enforcement mechanisms

Analyze across these IP dimensions:

1. PATENT ANALYSIS (Indian Patent Office):
   - Patentability assessment under Indian Patents Act (Section 3 exclusions)
   - Likely patent categories and IPC classifications
   - Indian patent filing strategy (provisional → complete, convention application)
   - Prior art search strategy for Indian context
   - Freedom-to-operate considerations in India
   - Filing strategy with Indian Patent Office (startup fee concession)
   - Estimated timeline for Indian patent grant

2. TRADEMARK ANALYSIS (Indian Trade Marks Act):
   - Brand elements worth protecting in India
   - Indian Nice classification classes needed
   - Registration strategy at Indian Trade Marks Registry
   - Potential conflicts or clearance needed in India

3. TRADE SECRET ANALYSIS (Indian Contract Act):
   - What should be kept as trade secret vs patented in India
   - Protection measures under Indian law
   - Employee/contractor NDA considerations under Indian law

4. COPYRIGHT ANALYSIS (Indian Copyright Act):
   - Copyrightable elements under Indian law (software, literary, artistic)
   - Ownership considerations under Indian Copyright Act
   - Licensing strategy for India

5. INDUSTRIAL DESIGN (Indian Design Act):
   - Design registration opportunities at CGPDTM
   - Ornamental features worth protecting

6. IP STRATEGY FOR INDIA:
   - Overall IP portfolio roadmap for Indian market
   - Budget estimate (with startup fee concessions)
   - Timeline for Indian filings
   - Commercialization strategy for Indian market
   - IP valuation estimate for Indian context
   - Enforcement strategy (Indian courts, IPAB)

Return EXACTLY as JSON:
{{
  "patent_analysis": {{
    "patentability_assessment": "assessment under Indian Patents Act",
    "likely_cpc_codes": ["G06Q 10/00"],
    "indian_ipc_classes": ["G06Q", "G06F"],
    "prior_art_search_strategy": "strategy for Indian and global prior art",
    "freedom_to_operate": "FTO analysis for Indian market",
    "filing_strategy": {{
      "type": "provisional",
      "jurisdictions": ["IN", "US", "EP"],
      "timeline": "timeline for Indian filing",
      "startup_fee_discount": "80% fee reduction for Indian startups",
      "estimated_cost_inr": "₹50000-100000"
    }},
    "estimated_patentability_score": 7,
    "section_3_considerations": "Any Section 3 exclusions that apply"
  }},
  "trademark_analysis": {{
    "protectable_elements": ["brand name", "logo"],
    "nice_classes": ["9", "35", "42"],
    "registration_strategy": "Indian TM registration approach",
    "clearance_required": true,
    "class_description": "Description of each class"
  }},
  "trade_secret_analysis": {{
    "trade_secret_candidates": ["algorithm", "customer list"],
    "protection_measures": ["NDA under Indian Contract Act", "access control"],
    "recommendation": "what to keep as secret vs patent in India"
  }},
  "copyright_analysis": {{
    "copyrightable_elements": ["source code", "documentation"],
    "ownership_notes": "ownership under Indian Copyright Act",
    "licensing_strategy": "recommended license type for India"
  }},
  "ip_strategy": {{
    "portfolio_roadmap": "step by step plan for India",
    "budget_estimate": "₹X - ₹Y",
    "timeline_months": 18,
    "commercialization_path": "license/sell/defensive",
    "estimated_ip_value": "₹X",
    "key_recommendations": ["rec1 for India context", "rec2"],
    "enforcement_strategy": "How to enforce IP rights in India"
  }}
}}

If MCP patent/trademark services are available, actual search results will be appended."""


async def run_ip_strategist(
    opportunity_title: str,
    opportunity_description: str,
    domain: str,
    target_market: str,
    key_innovation: str,
    llm: LLMClient,
) -> Dict[str, Any]:
    prompt = IP_STRATEGIST_PROMPT.format(
        opportunity_title=opportunity_title,
        opportunity_description=opportunity_description,
        domain=domain,
        target_market=target_market,
        key_innovation=key_innovation,
    )
    raw = await llm.complete(prompt, system=IP_STRATEGIST_SYSTEM, json_mode=True)
    result = _parse_json(raw)
    if not result:
        raise ValueError("LLM returned invalid IP strategy")
    return result


async def run_ip_strategist_full(opportunity: dict, domain: str, llm: LLMClient, mcp=None) -> Dict[str, Any]:
    ip_data = await run_ip_strategist(
        opportunity_title=opportunity.get("title", ""),
        opportunity_description=opportunity.get("description", ""),
        domain=domain,
        target_market=opportunity.get("target_customer", ""),
        key_innovation=opportunity.get("title", ""),
        llm=llm,
    )
    if mcp:
        try:
            patent_results = await mcp.patent.search_patents(opportunity.get("title", ""))
            if patent_results:
                ip_data["mcp_patent_results"] = patent_results[:5]
            tm_results = await mcp.trademark.search_trademarks(domain)
            if tm_results:
                ip_data["mcp_trademark_results"] = tm_results[:5]
        except Exception as e:
            logger.warning(f"MCP enrichment failed: {e}")
    return ip_data


def _parse_json(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    return json.loads(clean)
