import json
import re
import logging
from typing import Dict, Any, Callable, Optional
from core.llm_client import LLMClient
from agents._utils import summarize_context

logger = logging.getLogger(__name__)

SYSTEM_BASE = """You are an EIPR Entrepreneurship & Market Analysis AI for the INDIAN market.
Your role is to identify business opportunities that align with the EIPR curriculum framework.
All analysis must be India-specific with:
- References to Indian government schemes (Startup India, Make in India, Skill India, MUDRA, Stand-Up India)
- Indian market data and consumer behavior patterns
- Indian regulatory and compliance considerations
- Indian socioeconomic context (tier 1/2/3 cities, rural vs urban, demographic dividend)
- References to Indian business case studies and examples
Return structured JSON."""

DOMAIN_ANALYSIS_PROMPT = """Analyze the following domain and project description for entrepreneurial opportunities in the INDIAN market.

Domain: {domain}
User Description: {description}
User Context: {context}

Perform a detailed domain analysis covering:

1. CURRENT MARKET LANDSCAPE IN INDIA:
   - What exists today in the Indian market for this domain
   - Key Indian players and their market share
   - Market size and growth trajectory in INR
   - Urban vs rural penetration

2. USER GAPS AND PAIN POINTS:
   - What Indian users/customers are missing
   - Specific gaps in tier 1, tier 2, and tier 3 cities
   - Pain points unique to Indian consumers

3. EMERGING TRENDS IN INDIA:
   - Technology adoption trends relevant to this domain
   - Regulatory changes creating opportunities
   - Demographic and behavioral shifts

4. IMPACT FACTORS:
   - Government policy initiatives affecting this domain
   - Infrastructure developments enabling opportunities
   - Cultural and social factors creating demand

5. INDIA RELEVANCE:
   - Why this domain matters for Indian economic development
   - Alignment with national priorities (Atmanirbhar Bharat, Digital India)
   - Employment generation and social impact potential

Return as JSON:
{{
  "summary": "Overall analysis summary",
  "current_market_landscape": "Detailed description of Indian market",
  "user_gaps": "Gaps and pain points in Indian context",
  "emerging_trends": ["trend1", "trend2", "trend3"],
  "impact_factors": ["factor1", "factor2"],
  "india_relevance": "Why this matters for India"
}}"""

OPPORTUNITIES_PROMPT = """Based on the domain analysis, generate specific entrepreneurial opportunities for the INDIAN market.

Domain: {domain}
Domain Analysis: {domain_analysis}

Generate {num_opportunities} detailed business opportunities for the Indian market. Each opportunity must be thoroughly analyzed with India-specific data and context.

For EACH opportunity, provide:
1. A compelling title specific to the Indian context
2. Detailed description with Indian market relevance (200-250 words)
3. Entrepreneur type classification with Indian reasoning:
   - INNOVATIVE: Creating something entirely new for the Indian market
   - IMITATIVE: Adapting a successful global model for Indian conditions
   - FABIAN: Improving upon existing Indian solutions cautiously
4. Market gap analysis specific to India
5. Target customer profile for Indian market (demographics, geography, behavior)
6. Feasibility score (1-10) considering Indian market realities
7. Market sizing: TAM, SAM, SOM in INR
8. Innovation level (high/medium/low) for Indian context
9. IP potential — what can be protected in India
10. Government scheme alignment
11. Regulatory notes for Indian compliance
12. Success factors for Indian market
13. Challenges specific to Indian market conditions
14. India-specific risks

Return as JSON:
{{
  "opportunities": [
    {{
      "title": "Opportunity Title",
      "description": "Detailed description...",
      "entrepreneur_type": "innovative/imitative/fabian",
      "entrepreneur_type_reasoning": "Why this type fits Indian market",
      "market_gap": "What gap this fills in India",
      "target_customer": "Indian customer segment",
      "feasibility_score": 7,
      "tam": "₹X Cr",
      "sam": "₹Y Cr",
      "som": "₹Z Cr",
      "innovation_level": "high/medium/low",
      "ip_potential": "What IP could be created",
      "government_alignment": "Which Indian schemes apply",
      "regulatory_notes": "Indian regulations to consider",
      "success_factors": ["factor1", "factor2"],
      "challenges": ["challenge1", "challenge2"],
      "india_specific_risk": "Unique Indian market risks"
    }}
  ]
}}"""

ENTREPRENEURIAL_INSIGHTS_PROMPT = """Generate entrepreneurial insights for the identified opportunities in the Indian market.

Domain: {domain}
Opportunities: {opportunities_json}

Provide:
1. Key entrepreneurial traits needed for success in the Indian market for these opportunities
2. Common myths about Indian entrepreneurship that these opportunities debunk
3. Team requirements — what skills and roles are needed, considering Indian talent availability
4. Recommended approach for Indian entrepreneurs — how to proceed step by step
5. Required skills and expertise areas

Return as JSON:
{{
  "entrepreneurial_insights": {{
    "traits_needed": ["trait1 for Indian market"],
    "myths_busted": ["myth about Indian entrepreneurship"],
    "team_requirements": "What team is needed in Indian context",
    "recommended_approach": "How to proceed in India"
  }}
}}"""


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


async def run_opportunity_scout_multi(
    description: str,
    user_context: str,
    llm: LLMClient,
    domain: str = "",
    on_step: Optional[Callable] = None,
) -> Dict[str, Any]:
    if len(description) > 2500:
        description = description[:2500] + "...[truncated]"
    if len(user_context) > 1500:
        user_context = user_context[:1500] + "...[truncated]"
    system = SYSTEM_BASE

    step1 = await _run_step(llm, DOMAIN_ANALYSIS_PROMPT.format(
        domain=domain, description=description, context=user_context or "Not specified"
    ), system, "Domain Analysis", on_step)

    num_opps = max(5, min(8, len(description) // 100 + 3))
    step2 = await _run_step(llm, OPPORTUNITIES_PROMPT.format(
        domain=domain, domain_analysis=summarize_context(step1), num_opportunities=num_opps
    ), system, "Opportunity Identification", on_step)

    step3 = await _run_step(llm, ENTREPRENEURIAL_INSIGHTS_PROMPT.format(
        domain=domain, opportunities_json=summarize_context({"opportunities": step2.get("opportunities", [])})
    ), system, "Entrepreneurial Insights", on_step)

    result = {**step1, **step2, **step3}
    return result
