import json
import re
import logging
from typing import Dict, Any
from core.llm_client import LLMClient

logger = logging.getLogger(__name__)

BUSINESS_ARCHITECT_SYSTEM = """You are a Business Architect AI specialized in entrepreneurship strategy for the INDIAN market.
Cover: India-specific business planning, SWOC Analysis, Porter's Generic Strategies, 4Ps Marketing, STP, UVP.
Always reference:
1. Indian company registration (ROC, MSME registration, DPIIT recognition)
2. Indian tax structure (GST slabs, Income Tax, TDS, Professional Tax)
3. Indian business culture and negotiation practices
4. Indian labor laws and compliance (EPFO, ESIC, Shop & Establishment)
5. Make in India / Atmanirbhar Bharat alignment
6. Indian startup ecosystem — incubators, accelerators, innovation hubs
7. Indian consumer behavior (value-conscious, family decision-making, festival season)
8. Tier-1 vs Tier-2 vs Tier-3 city strategies
9. Indian digital payment ecosystem (UPI, RuPay, BBPS)
10. Indian competition landscape (local players, global MNCs)
Always return structured JSON."""

BUSINESS_ARCHITECT_PROMPT = """Create a comprehensive business strategy for INDIA MARKET:

Opportunity: {opportunity}
Domain: {domain}
Target Market (India): {target_market}
User Inputs/Constraints: {user_inputs}

IMPORTANT: All strategies must be INDIA-SPECIFIC:
- Indian company registration (Private Limited / LLP / One Person Company)
- MSME registration benefits, DPIIT startup recognition
- GST registration and compliance
- Indian pricing strategies (affordability, value pricing, freemium for India)
- Indian distribution channels (retail, e-commerce, D2C, local distributors)
- Indian promotion strategies (festival marketing, regional language content)
- Indian consumer behavior and cultural nuances
- Indian funding ecosystem (angel networks, VC, Startup India Seed Fund, SIDBI)

Generate:

1. BUSINESS PLAN ELEMENTS (India-specific):
   - Executive Summary
   - Company Description (with Indian registration recommendations)
   - Market Analysis (TAM/SAM/SOM in INR)
   - Product/Service Description
   - Business Model (revenue streams relevant to India)

2. STRATEGIC ANALYSIS:
   - SWOC Analysis (Strengths, Weaknesses, Opportunities, Challenges in Indian context)
   - Vision, Mission, Goals, Objectives (VMGO)
   - Porter's Generic Strategy recommendation for India
   - Competitive Strategy against Indian and global players

3. MARKETING PLAN (4Ps + STP + UVP for India):
   - Segmentation, Targeting, Positioning (India-specific segments)
   - Unique Value Proposition for Indian consumers
   - Product strategy (regional variations, Indian language support)
   - Pricing (India value pricing)
   - Place (Indian distribution channels)
   - Promotion (Digital marketing for India — WhatsApp, YouTube, regional social media)

4. GROWTH STRATEGY FOR INDIA:
   - Bharat expansion (Tier-2/3/4 city strategy)
   - Strategic alliance opportunities in India
   - Scaling roadmap for Indian market
   - Exit strategies relevant to Indian startup ecosystem

Return as JSON:
{{
  "business_plan": {{
    "executive_summary": "text with India context",
    "company_description": "text with Indian registration recommendations",
    "market_analysis": {{
      "tam": "₹X Cr", "sam": "₹Y Cr", "som": "₹Z Cr",
      "market_trends": ["India-specific trend1"],
      "competitor_landscape": "Indian competitor analysis"
    }},
    "business_model": {{
      "revenue_streams": ["stream1 for India"],
      "pricing_strategy": "India pricing strategy",
      "unit_economics": "unit economics in INR"
    }}
  }},
  "strategic_analysis": {{
    "swoc": {{
      "strengths": ["s1 in Indian context"],
      "weaknesses": ["w1 in Indian context"],
      "opportunities": ["o1 in India"],
      "challenges": ["c1 in India"]
    }},
    "vmgo": {{
      "vision": "text",
      "mission": "text",
      "goals": ["India-market goal1"],
      "objectives": ["obj1"]
    }},
    "porter_strategy": {{
      "recommended": "cost_leadership|differentiation|focus",
      "reasoning": "Why this works in India"
    }},
    "competitive_advantage": "India-specific advantage"
  }},
  "marketing_plan": {{
    "stp": {{
      "segments": ["India segment1"],
      "target": "Indian target customer",
      "positioning": "positioning for Indian market"
    }},
    "uvp": "India-specific UVP",
    "four_ps": {{
      "product": "with Indian localization",
      "price": "India pricing strategy",
      "place": "Indian distribution channels",
      "promotion": "India marketing channels"
    }},
    "digital_marketing": {{
      "seo_strategy": "with Indian language keywords",
      "sem_strategy": "India PPC strategy",
      "social_media": "India platforms (WhatsApp, YouTube, Instagram)",
      "content_marketing": "Indian language content strategy"
    }}
  }},
  "growth_strategy": {{
    "organic_growth": "India growth plan",
    "strategic_alliances": ["Indian partner1"],
    "scaling_roadmap": "India scaling plan",
    "exit_strategies": ["acquisition by Indian company", "IPO in India"]
  }}
}}
"""


async def run_business_architect(
    opportunity: str,
    domain: str,
    target_market: str,
    user_inputs: str,
    llm: LLMClient,
) -> Dict[str, Any]:
    prompt = BUSINESS_ARCHITECT_PROMPT.format(
        opportunity=opportunity,
        domain=domain,
        target_market=target_market,
        user_inputs=user_inputs or "No additional constraints",
    )
    raw = await llm.complete(prompt, system=BUSINESS_ARCHITECT_SYSTEM, json_mode=True)
    result = _parse_json(raw)
    if not result:
        raise ValueError("LLM returned invalid business analysis")
    return result


def _parse_json(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    return json.loads(clean)
