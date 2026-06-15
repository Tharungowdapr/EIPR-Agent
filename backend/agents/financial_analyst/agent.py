import json
import re
import logging
from typing import Dict, Any
from core.llm_client import LLMClient

logger = logging.getLogger(__name__)

FINANCIAL_SYSTEM = """You are a Financial Analyst AI specialized in entrepreneurship finance for the INDIAN market.
Cover: Indian startup cost estimation, INR revenue projection, break-even analysis, Indian funding sources.
Always reference:
1. Indian funding ecosystem — Startup India Seed Fund, SIDBI, SBI, CGTMSE, MUDRA
2. Indian angel networks — Indian Angel Network, Mumbai Angels, LetsVenture
3. Indian VC landscape — Sequoia India, Accel, Matrix, Blume, Kalaari
4. Indian tax structure — GST (5/12/18/28%), Corporate Tax (22-30%), Startup Tax Holiday
5. Indian payroll costs — EPFO (12%), ESIC, Professional Tax, TDS
6. Indian operational costs in INR (₹)
7. Indian government grants — BIRAC, DST, MeitY, DBT
8. Indian financial metrics benchmarks
Always return structured JSON."""

FINANCIAL_PROMPT = """Perform financial feasibility analysis for the INDIAN market:

Opportunity: {opportunity}
Business Model: {business_model}
Market Size: {market_size}
User Inputs: {user_inputs}

IMPORTANT: All figures in INR (₹). Use India-specific benchmarks:
- Indian startup salary ranges, rental costs, operational expenses
- Indian customer acquisition costs (CAC) — lower than US but expanding
- Indian payment gateway costs, cloud hosting costs (AWS India, Azure India)
- Indian legal and compliance costs (ROC filing, GST filing, CA fees)
- Indian funding sizes typical for each stage
- Indian valuation benchmarks

Generate:

1. STARTUP COST ESTIMATION (INR):
   - Development/technology costs (Indian developer rates)
   - Marketing & sales costs (India-specific digital marketing costs)
   - Operations & personnel costs (Indian salary benchmarks)
   - Legal & IP costs (Indian registration + patent filing costs)
   - Office/infrastructure costs (Indian co-working, rental rates)
   - Total initial investment

2. REVENUE PROJECTIONS (Year 1-3 in INR):
   - Revenue streams breakdown
   - Monthly recurring revenue (MRR) in INR
   - Annual recurring revenue (ARR) in INR
   - Growth rate assumptions for Indian market

3. BREAK-EVEN ANALYSIS:
   - Fixed costs per month in INR
   - Variable costs per unit in INR
   - Unit contribution margin
   - Break-even units and time (months)

4. FUNDING REQUIREMENTS & SOURCES (India-specific):
   - Total funding needed in INR
   - Recommended funding mix (bootstrapping vs Indian angel/VC vs debt)
   - Bootstrap vs angel network vs VC assessment for India
   - Indian government grant eligibility (Startup India, BIRAC, DST)
   - SIDBI and CGTMSE loan eligibility

5. FINANCIAL METRICS:
   - Gross margin
   - Net profit margin (Year 1-3)
   - CAC (Customer Acquisition Cost in INR)
   - LTV (Lifetime Value in INR)
   - LTV:CAC ratio
   - Payback period
   - ROI projection
   - Indian tax considerations

Return as JSON:
{{
  "startup_costs": {{
    "development": ₹X,
    "marketing": ₹X,
    "operations": ₹X,
    "legal_ip": ₹X,
    "office_infrastructure": ₹X,
    "total_initial_investment": ₹X,
    "monthly_burn_rate": ₹X,
    "cost_breakdown": [{{"category": "name", "amount": ₹X, "notes": "Indian context"}}]
  }},
  "revenue_projections": {{
    "year_1": {{
      "mrr": ₹X,
      "arr": ₹X,
      "primary_revenue_streams": [{{"stream": "name", "amount": ₹X}}],
      "quarterly_breakdown": [{{"q": "Q1", "revenue": ₹X}}]
    }},
    "year_2": {{"mrr": ₹X, "arr": ₹X}},
    "year_3": {{"mrr": ₹X, "arr": ₹X}},
    "key_assumptions": ["India-specific assumption1"],
    "growth_rate_pct": 100
  }},
  "break_even_analysis": {{
    "fixed_costs_monthly": ₹X,
    "variable_costs_per_unit": ₹X,
    "unit_price": ₹X,
    "contribution_margin": ₹X,
    "break_even_units_monthly": 1000,
    "break_even_months": 18,
    "break_even_revenue": ₹X
  }},
  "funding_strategy": {{
    "total_funding_needed": ₹X,
    "recommended_mix": {{
      "bootstrap": "X%",
      "angel_network": "X%",
      "venture_capital": "X%",
      "debt_sidbi": "X%",
      "government_grants": "X%"
    }},
    "funding_roadmap": "India funding roadmap with stages",
    "investor_readiness_score": 7,
    "indian_grant_eligibility": ["Startup India", "BIRAC", "DST"],
    "recommended_investors": ["Indian Angel Network", "specific VC firms"]
  }},
  "financial_metrics": {{
    "gross_margin_pct": 70,
    "net_margin_year_1": -20,
    "net_margin_year_2": 10,
    "net_margin_year_3": 25,
    "cac": ₹X,
    "ltv": ₹X,
    "ltv_cac_ratio": 3.5,
    "payback_period_months": 12,
    "roi_year_3_pct": 150,
    "tax_considerations": "GST, Corporate Tax implications"
  }}
}}
"""


async def run_financial_analyst(
    opportunity: str,
    business_model: str,
    market_size: str,
    user_inputs: str,
    llm: LLMClient,
) -> Dict[str, Any]:
    prompt = FINANCIAL_PROMPT.format(
        opportunity=opportunity,
        business_model=business_model or "Subscription-based SaaS for India",
        market_size=market_size or "Growing Indian market",
        user_inputs=user_inputs or "Standard Indian market assumptions",
    )
    raw = await llm.complete(prompt, system=FINANCIAL_SYSTEM, json_mode=True)
    result = _parse_json(raw)
    if not result:
        raise ValueError("LLM returned invalid financial analysis")
    return result


def _parse_json(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    return json.loads(clean)
