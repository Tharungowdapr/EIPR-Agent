import json
import logging
import re
from typing import Dict, Any
from core.llm_client import LLMClient

logger = logging.getLogger(__name__)

OPPORTUNITY_SYSTEM = """You are an Entrepreneurship Opportunity Scout AI specialized in EIPR (Entrepreneurship & Intellectual Property Rights) for the INDIAN market context.
Your analysis must reference:
1. Startup India, Make in India, Atmanirbhar Bharat policies
2. DPIIT recognition, MSME classification, tax benefits for startups
3. Indian consumer behavior (value-conscious, mobile-first, digital payments)
4. Tier-2/3 city market opportunities, Bharat market (rural India)
5. Indian regulatory landscape (RBI, SEBI, IRDAI, FSSAI, CDSCO as applicable)
6. Current Indian startup ecosystem trends (funding winter, profitability focus, deep-tech)
7. Indian government schemes (PMFME, PLI, SIDBI, CGTMSE)
Always return structured JSON output."""

OPPORTUNITY_PROMPT = """Analyze the following domain/idea for the INDIAN market and find related business opportunities:

Domain/Idea: {input_text}
User Background/Skills (if provided): {user_context}

IMPORTANT: All analysis must be India-specific. Consider:
- Indian market size, demographics, and consumer behavior
- Bharat (rural India) vs urban India opportunities
- Indian regulatory environment and government policies
- Indian startup ecosystem context
- Make in India / Atmanirbhar Bharat alignment
- Indian pricing sensitivity and value propositions
- Regional language and cultural considerations
- Local competition landscape (Indian companies + global players in India)

Your task:
1. If user provided a domain (not a specific idea), search for related ideas and opportunities in that space for India
2. If user provided a specific idea, analyze it and find related/adjacent opportunities
3. For each opportunity found, provide:
   - Title and brief description
   - Type of entrepreneur suited (Innovative/Imitative/Fabian) with reasoning
   - Current market trend and gap being addressed in Indian context
   - Target customer segment (including Indian demographic specifics)
   - Feasibility score (1-10)
   - Key success factors
   - Potential challenges (including India-specific ones like regulatory, infrastructure)
   - Market size estimate (TAM/SAM/SOM in INR or USD)
   - Government scheme alignment (Startup India, MSME, etc.)
4. Also identify: emerging trends in India, what users currently get vs what's missing

Return a JSON object with:
{{
  "domain_analysis": {{
    "summary": "Overall analysis of the domain in Indian context",
    "current_market_landscape": "What exists today in India",
    "user_gaps": "What Indian users are missing",
    "emerging_trends": ["trend1", "trend2"],
    "impact_factors": ["factor1", "factor2"],
    "india_relevance": "Why this matters for the Indian economy"
  }},
  "opportunities": [
    {{
      "id": "opp-1",
      "title": "Opportunity title",
      "description": "Detailed description with Indian context",
      "entrepreneur_type": "innovative|imitative|fabian",
      "entrepreneur_type_reasoning": "Why this type fits Indian market",
      "market_gap": "What gap this fills in India",
      "target_customer": "Who will buy (Indian segment)",
      "feasibility_score": 8,
      "success_factors": ["factor1"],
      "challenges": ["challenge1"],
      "tam": "₹X Cr", "sam": "₹Y Cr", "som": "₹Z Cr",
      "innovation_level": "high|medium|low",
      "ip_potential": "What IP could be created",
      "government_alignment": "Which Indian govt schemes apply",
      "regulatory_notes": "Key Indian regulations to consider",
      "india_specific_risk": "Unique Indian market risks"
    }}
  ],
  "entrepreneurial_insights": {{
    "traits_needed": ["trait1"],
    "myths_busted": ["myth1 about Indian entrepreneurship"],
    "team_requirements": "What team is needed in Indian context",
    "recommended_approach": "How to proceed in India"
  }}
}}

Generate 5-8 diverse opportunities relevant to the Indian market. Consider both B2B and B2C angles."""


async def run_opportunity_scout(
    input_text: str,
    user_context: str,
    llm: LLMClient,
) -> Dict[str, Any]:
    prompt = OPPORTUNITY_PROMPT.format(input_text=input_text, user_context=user_context or "No specific background provided")
    raw = await llm.complete(prompt, system=OPPORTUNITY_SYSTEM, json_mode=True)
    result = _parse_json(raw)
    if not result or "opportunities" not in result:
        raise ValueError(f"LLM returned invalid response: missing 'opportunities' key")
    _enrich_from_mcp(result)
    return result


def _enrich_from_mcp(result: dict):
    for opp in result.get("opportunities", []):
        score = opp.get("feasibility_score", 5)
        if opp.get("innovation_level") == "high":
            score = min(10, score + 1)
        opp["feasibility_score"] = min(10, max(1, score))


def _parse_json(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    return json.loads(clean)
