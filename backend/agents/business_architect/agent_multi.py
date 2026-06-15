import json
import re
import logging
import asyncio
from typing import Dict, Any, Callable, Optional
from core.llm_client import LLMClient
from agents._utils import summarize_context

logger = logging.getLogger(__name__)

SYSTEM_BASE = """You are a Business Architect AI specialized in entrepreneurship strategy for the INDIAN market.
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
Return structured JSON."""

EXEC_SUMMARY_PROMPT = """Generate the executive summary and company description for the INDIAN market.

Opportunity: {opportunity}
Domain: {domain}
Target Market (India): {target_market}
User Inputs: {user_inputs}

1. EXECUTIVE SUMMARY:
   - Concise overview of the business concept for India
   - Problem being solved in Indian context
   - Solution with Indian market relevance
   - Key value proposition for Indian consumers
   - Highlight: why now is the right time for India

2. COMPANY DESCRIPTION:
   - Business name and mission for Indian market
   - Recommended legal structure (Pvt Ltd / LLP / OPC / Partnership)
   - MSME registration benefits
   - DPIIT startup recognition pathway
   - Registered office location strategy (tier 1 vs tier 2 city)
   - Key milestones and timeline for Indian operations

IMPORTANT: "executive_summary" must be a PLAIN STRING, not an object/dict.
Return as JSON:
{{
  "executive_summary": "India-focused summary with all key elements (plain string only, no nested fields)",
  "company_description": {{
    "business_name": "Suggested name",
    "legal_structure": "Private Limited / LLP / OPC",
    "legal_structure_reasoning": "Why this structure suits Indian context",
    "msme_registration": "Benefits for this venture",
    "dpiit_startup_recognition": "Eligibility and pathway",
    "location_strategy": "Office location recommendation for India",
    "key_milestones": ["milestone1 for Indian timeline"]
  }}
}}"""

MARKET_ANALYSIS_PROMPT = """Perform a detailed market analysis for the INDIAN market.

Opportunity: {opportunity}
Domain: {domain}
Target Market (India): {target_market}

1. MARKET SIZING (all figures in INR):
   - TAM (Total Addressable Market) for India
   - SAM (Serviceable Available Market)
   - SOM (Serviceable Obtainable Market)
   - Year-over-year growth rate for Indian market
   - Market growth drivers specific to India

2. MARKET TRENDS:
   - Technology adoption trends in India
   - Consumer behavior shifts post-COVID
   - Regulatory changes creating market opportunities
   - Demographic trends (young population, rising income, urbanization)

3. COMPETITOR LANDSCAPE:
   - Key Indian players and their market positioning
   - Global MNCs operating in India and their strategy
   - Unorganized sector competition (important for India)
   - Competitive advantages and gaps
   - Entry barriers for Indian market

4. CUSTOMER SEGMENTATION:
   - Primary target segment in India
   - Secondary segments
   - Geographic focus (which states/cities first)
   - Customer persona for Indian consumer

Return as JSON:
{{
  "market_size": {{
    "tam": "₹X Cr",
    "sam": "₹Y Cr",
    "som": "₹Z Cr",
    "growth_rate_pct": 15,
    "growth_drivers": ["driver1 for India"]
  }},
  "market_trends": ["trend1 specific to India"],
  "competitor_landscape": {{
    "indian_players": [{{"name": "Player1", "strength": "market share/position in India", "weakness": "gap to exploit"}}],
    "global_players": [{{"name": "MNC1", "india_strategy": "how they approach India", "weakness_in_india": "localization gap"}}],
    "unorganized_sector": "Impact of unorganized competition in India",
    "entry_barriers": ["barrier1 for Indian market"]
  }},
  "customer_segmentation": {{
    "primary_segment": "description in Indian context",
    "secondary_segments": ["segment1 for India"],
    "geographic_focus": "Which Indian states/cities first",
    "customer_persona": "Detailed Indian buyer persona"
  }}
}}"""

STRATEGIC_ANALYSIS_PROMPT = """Perform strategic analysis for the INDIAN market context.

Opportunity: {opportunity}
Domain: {domain}
Target Market (India): {target_market}
Market Analysis: {market_analysis}

1. SWOC ANALYSIS (India-specific):
   - Strengths: Internal capabilities relevant to Indian market
   - Weaknesses: Internal limitations in Indian context
   - Opportunities: External factors in Indian ecosystem
   - Challenges: External threats in Indian market (note: Challenges instead of Threats for Indian constructiveness)

2. VMGO (Vision, Mission, Goals, Objectives):
   - Vision: Long-term aspiration for Indian impact
   - Mission: Purpose aligned with Indian needs
   - Goals: 3-5 SMART goals for Indian market
   - Objectives: Measurable objectives with Indian timelines

3. PORTER'S GENERIC STRATEGY:
   - Recommend: cost_leadership / differentiation / focus
   - Reasoning with Indian market realities
   - How to execute in Indian context

4. COMPETITIVE ADVANTAGE:
   - Sustainable moat in Indian market
   - What makes this hard to copy in India
   - Network effects, brand trust, distribution advantages

Return as JSON:
{{
  "swoc": {{
    "strengths": ["s1 in Indian context"],
    "weaknesses": ["w1 in Indian context"],
    "opportunities": ["o1 in Indian context"],
    "challenges": ["c1 in Indian context"]
  }},
  "vmgo": {{
    "vision": "long-term vision for India impact",
    "mission": "purpose for Indian market",
    "goals": ["SMART goal1 for India"],
    "objectives": ["measurable objective1"]
  }},
  "porter_strategy": {{
    "recommended": "cost_leadership/differentiation/focus",
    "reasoning": "Why this fits Indian market conditions",
    "execution_approach": "How to implement in India"
  }},
  "competitive_advantage": {{
    "sustainable_moat": "What protects this business in India",
    "defensibility": "Why hard to replicate in Indian context",
    "key_differentiators": ["diff1 relevant to Indian consumers"]
  }}
}}"""

MARKETING_PLAN_PROMPT = """Create a comprehensive marketing plan for the INDIAN market.

Opportunity: {opportunity}
Domain: {domain}
Target Market (India): {target_market}
Strategic Context: {strategic_context}

1. STP (Segmentation, Targeting, Positioning for India):
   - Segments: How Indian market is segmented (geography, income, age, language)
   - Target: Which segment(s) to target first in India
   - Positioning: How to position in Indian consumers' minds

2. UNIQUE VALUE PROPOSITION:
   - UVP that resonates with Indian consumers
   - Why Indian customers should choose this over alternatives
   - Emotional and rational appeals for Indian audience

3. 4Ps MARKETING MIX FOR INDIA:
   - Product: Indian localization, regional variations, language support
   - Price: India-value pricing, freemium models, EMI options
   - Place: Indian distribution channels (retail, e-commerce, D2C, local distributors)
   - Promotion: Festival marketing, regional language content, celebrity endorsements

4. DIGITAL MARKETING STRATEGY:
   - SEO: Keywords for Indian search behavior (Hindi + regional languages)
   - SEM: Google Ads strategy for Indian keywords (lower CPC than US)
   - Social Media: India platform focus (WhatsApp Business, YouTube, Instagram, ShareChat)
   - Content Marketing: Regional language content, video-first approach for India
   - Influencer Marketing: Indian micro-influencers, regional influencers

Return as JSON:
{{
  "stp": {{
    "segments": ["India-specific segment1 based on geography/income/language"],
    "target": "Primary target segment in India",
    "positioning": "Positioning for Indian consumer mindset"
  }},
  "uvp": "India-specific unique value proposition",
  "four_ps": {{
    "product": "Product with Indian localization",
    "price": "India-specific pricing strategy",
    "place": "Indian distribution channels",
    "promotion": "India-specific promotion strategy"
  }},
  "digital_marketing": {{
    "seo_strategy": "Regional language SEO approach for India",
    "sem_strategy": "Google/Bing PPC for Indian keywords",
    "social_media": "Platform strategy for India (WhatsApp, YouTube, Instagram)",
    "content_marketing": "Video-first, regional language content for India",
    "influencer_strategy": "Indian micro-influencer approach"
  }}
}}"""

GROWTH_STRATEGY_PROMPT = """Define the growth strategy for scaling across the INDIAN market.

Opportunity: {opportunity}
Domain: {domain}
Target Market (India): {target_market}
Marketing Plan: {marketing_plan}

1. BHARAT EXPANSION STRATEGY:
   - Tier-2/3/4 city penetration plan
   - Rural India strategy (where applicable)
   - Regional language rollout roadmap
   - Pricing adaptation for smaller cities
   - Distribution challenges in Bharat

2. STRATEGIC ALLIANCES:
   - Potential Indian partners (corporate, government, NGO)
   - Channel partnerships for distribution
   - Technology partnerships relevant to India
   - University/research institution collaborations

3. SCALING ROADMAP:
   - Phase 1: Launch in target city/state (months 1-6)
   - Phase 2: Regional expansion (months 7-18)
   - Phase 3: Pan-India presence (months 19-36)
   - Phase 4: International expansion from India base
   - Key hires and team growth for Indian operations

4. EXIT STRATEGIES (India-specific):
   - Acquisition by Indian company (Tata, Reliance, etc.)
   - Acquisition by global MNC expanding in India
   - IPO on Indian exchanges (BSE SME, NSE Emerge)
   - Strategic sale to PE firm
   - ESOP liquidity for Indian employees

Return as JSON:
{{
  "bharat_expansion": {{
    "tier_2_3_4_strategy": "Strategy for Indian small cities",
    "rural_strategy": "Rural India approach (if applicable)",
    "language_rollout": "Regional language implementation plan",
    "pricing_for_small_cities": "Adapted pricing for tier 2/3 cities",
    "distribution_challenges": "Logistics and distribution in Bharat"
  }},
  "strategic_alliances": [
    {{"partner_type": "Corporate/NGO/Govt", "potential_partners": ["name1"], "synergy": "Why this partnership works in India"}}
  ],
  "scaling_roadmap": {{
    "phase_1_launch": "Months 1-6: Launch plan for India",
    "phase_2_regional": "Months 7-18: Regional expansion",
    "phase_3_pan_india": "Months 19-36: Pan-India presence",
    "phase_4_global": "International expansion from India",
    "team_growth": "Hiring plan for Indian operations"
  }},
  "exit_strategies": [
    {{"type": "Acquisition/IPO/PE Sale", "description": "Exit path in Indian ecosystem", "likelihood": "high/medium/low"}}
  ]
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


async def run_business_architect_multi(
    opportunity: str,
    domain: str,
    target_market: str,
    user_inputs: str,
    llm: LLMClient,
    on_step: Optional[Callable] = None,
) -> Dict[str, Any]:
    if len(opportunity) > 2500:
        opportunity = opportunity[:2500] + "...[truncated]"
    system = SYSTEM_BASE

    if on_step:
        await on_step("Executive Summary & Company Description")
        await on_step("Market Analysis")
    step1, step2 = await asyncio.gather(
        _run_step(llm, EXEC_SUMMARY_PROMPT.format(
            opportunity=opportunity, domain=domain, target_market=target_market,
            user_inputs=user_inputs or "Standard Indian assumptions"
        ), system, None, None),
        _run_step(llm, MARKET_ANALYSIS_PROMPT.format(
            opportunity=opportunity, domain=domain, target_market=target_market
        ), system, None, None),
    )

    step3 = await _run_step(llm, STRATEGIC_ANALYSIS_PROMPT.format(
        opportunity=opportunity, domain=domain, target_market=target_market,
        market_analysis=summarize_context(step2)
    ), system, "Strategic Analysis", on_step)

    step4 = await _run_step(llm, MARKETING_PLAN_PROMPT.format(
        opportunity=opportunity, domain=domain, target_market=target_market,
        strategic_context=summarize_context(step3)
    ), system, "Marketing Plan", on_step)

    step5 = await _run_step(llm, GROWTH_STRATEGY_PROMPT.format(
        opportunity=opportunity, domain=domain, target_market=target_market,
        marketing_plan=summarize_context(step4)
    ), system, "Growth Strategy", on_step)

    result = {
        "business_plan": {
            "executive_summary": step1.get("executive_summary", ""),
            "company_description": step1.get("company_description", {}),
            "market_analysis": step2,
        },
        "strategic_analysis": step3,
        "marketing_plan": step4,
        "growth_strategy": step5,
    }
    return result
