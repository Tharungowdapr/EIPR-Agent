import json
import re
import logging
import asyncio
from typing import Dict, Any, Callable, Optional
from core.llm_client import LLMClient
from agents._utils import summarize_context

logger = logging.getLogger(__name__)

SYSTEM_BASE = """You are a Financial Analyst AI specialized in entrepreneurship finance for the INDIAN market.
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
Return structured JSON."""

STARTUP_COSTS_PROMPT = """Estimate startup costs for the INDIAN market.

Opportunity: {opportunity}
Business Model: {business_model}
Market Size: {market_size}
User Inputs: {user_inputs}

IMPORTANT: All figures in INR (₹). Use India-specific benchmarks:
- Indian developer salaries: ₹6-25 LPA depending on experience
- Indian co-working spaces: ₹5,000-15,000 per seat/month
- Indian digital marketing costs: CPC ₹5-30 on Google/Facebook
- Indian cloud hosting: AWS India/Mumbai region pricing
- Indian legal/CA fees: ₹5,000-50,000 for registration
- Indian patent filing: ₹8,000-40,000 (with startup discount)

1. DEVELOPMENT/TECHNOLOGY COSTS:
   - Website/app development (Indian dev rates)
   - Software licenses and tools
   - Cloud infrastructure (first year)
   - Technology stack costs in India

2. MARKETING & SALES COSTS:
   - Digital marketing budget (Indian CPC benchmarks)
   - Content creation costs (Indian content creator rates)
   - Sales team costs (Indian salary benchmarks)
   - PR and branding costs

3. OPERATIONS & PERSONNEL COSTS:
   - Team salaries by role (Indian salary benchmarks)
   - EPFO/ESIC/PT contributions
   - Office/co-working costs
   - Administrative expenses

4. LEGAL & IP COSTS:
   - Company registration (ROC fees + CA/ lawyer)
   - IP filing costs (patent, trademark — with startup discounts)
   - GST registration and compliance
   - Annual compliance costs

Return as JSON:
{{
  "development_costs": {{
    "total": "₹X",
    "breakdown": [{{"item": "description", "amount": "₹X", "notes": "Indian market context"}}]
  }},
  "marketing_costs": {{
    "total": "₹X",
    "breakdown": [{{"item": "description", "amount": "₹X", "notes": "Indian market context"}}]
  }},
  "operations_personnel": {{
    "total": "₹X",
    "breakdown": [{{"role": "title", "count": 1, "annual_cost": "₹X", "notes": "Indian salary benchmark"}}]
  }},
  "legal_ip_costs": {{
    "total": "₹X",
    "breakdown": [{{"item": "Company registration/IP filing", "amount": "₹X", "notes": "India-specific costs"}}]
  }},
  "office_infrastructure": {{
    "total": "₹X",
    "breakdown": [{{"item": "Co-working/Office", "amount": "₹X", "notes": "Indian rental rates"}}]
  }},
  "total_initial_investment": "₹X",
  "monthly_burn_rate": "₹X",
  "cost_summary": "Summary of all costs in Indian context"
}}"""

REVENUE_PROJECTIONS_PROMPT = """Project revenue for Years 1-3 in the INDIAN market.

Opportunity: {opportunity}
Business Model: {business_model}
Market Size: {market_size}

IMPORTANT: All figures in INR. Use India-specific assumptions:
- Indian consumers have lower willingness to pay but higher volume potential
- Tier-1 cities first, expanding to tier-2/3
- Indian pricing typically 30-50% of US-equivalent pricing
- Freemium and micro-transaction models work well in India
- Seasonal variations (festival seasons boost Q3)

1. YEAR 1 PROJECTION:
   - Monthly recurring revenue (MRR) in INR
   - Primary revenue streams with amounts
   - Quarterly breakdown
   - Key milestones for revenue generation
   - Customer acquisition targets for India

2. YEAR 2 PROJECTION:
   - MRR and ARR in INR
   - Growth drivers in Indian market
   - Expansion revenue from tier-2 cities
   - New revenue streams

3. YEAR 3 PROJECTION:
   - MRR and ARR in INR
   - Path to profitability in Indian context
   - Scale economics in India

4. KEY ASSUMPTIONS:
   - Growth rate for Indian market
   - Churn rate assumptions (typically higher in India)
   - Pricing elasticity for Indian consumers
   - Market penetration assumptions

Return as JSON:
{{
  "year_1": {{
    "mrr": "₹X",
    "arr": "₹X",
    "primary_revenue_streams": [{{"stream": "name", "amount": "₹X", "description": "India context"}}],
    "quarterly_breakdown": [{{"q": "Q1", "revenue": "₹X", "customers": 100}}],
    "customer_targets": {{"total_customers": 500, "tier_1": 300, "tier_2": 150, "tier_3": 50}}
  }},
  "year_2": {{
    "mrr": "₹X",
    "arr": "₹X",
    "growth_drivers": ["driver1 for India"],
    "new_revenue_streams": [{{"stream": "name", "amount": "₹X"}}]
  }},
  "year_3": {{
    "mrr": "₹X",
    "arr": "₹X",
    "path_to_profitability": "How India margins improve with scale"
  }},
  "key_assumptions": {{
    "growth_rate_pct": 100,
    "monthly_churn_pct": 5,
    "pricing_strategy": "India value pricing",
    "market_penetration_assumptions": "Realistic India adoption curve"
  }}
}}"""

BREAK_EVEN_PROMPT = """Perform break-even analysis for the INDIAN market.

Opportunity: {opportunity}
Revenue Projections: {revenue_projections}

IMPORTANT: All figures in INR.

1. FIXED COSTS (Monthly in INR):
   - Personnel fixed costs
   - Office/Infrastructure
   - Software subscriptions
   - Marketing fixed costs
   - Administrative

2. VARIABLE COSTS:
   - Cost per unit/customer in INR
   - Payment gateway fees (2-3% in India)
   - Customer support cost per user
   - Infrastructure cost per user

3. UNIT ECONOMICS:
   - Unit price (or average revenue per user)
   - Variable cost per unit
   - Contribution margin per unit in INR
   - Gross margin percentage

4. BREAK-EVEN CALCULATION:
   - Monthly fixed costs
   - Contribution margin per unit
   - Break-even units per month
   - Break-even monthly revenue in INR
   - Break-even timeline (months from launch)
   - Cumulative cash needed until break-even

Return as JSON:
{{
  "fixed_costs_monthly": {{
    "total": "₹X",
    "breakdown": [{{"category": "name", "amount": "₹X"}}]
  }},
  "variable_costs": {{
    "per_unit": "₹X",
    "details": [{{"item": "name", "cost": "₹X", "notes": "India context"}}]
  }},
  "unit_economics": {{
    "average_revenue_per_user": "₹X",
    "variable_cost_per_user": "₹X",
    "contribution_margin": "₹X",
    "gross_margin_pct": 70
  }},
  "break_even": {{
    "monthly_fixed_costs": "₹X",
    "contribution_margin_per_unit": "₹X",
    "break_even_units_monthly": 1000,
    "break_even_monthly_revenue": "₹X",
    "break_even_timeline_months": 18,
    "cumulative_cash_needed": "₹X"
  }}
}}"""

FUNDING_STRATEGY_PROMPT = """Define funding strategy using INDIAN funding sources.

Opportunity: {opportunity}
Break-even Analysis: {break_even_analysis}

1. TOTAL FUNDING REQUIREMENT:
   - Seed capital needed in INR
   - Break-even funding requirement
   - Growth capital requirement for pan-India expansion

2. FUNDING MIX RECOMMENDATION:
   - Bootstrap percentage (self-funding / friends & family)
   - Indian Angel Network / individual angel percentage
   - Indian VC funding percentage
   - Debt / SIDBI / CGTMSE loan percentage
   - Government grants percentage

3. FUNDING ROADMAP:
   - Pre-seed (friends & family, bootstrapping) — Month 0-6
   - Seed (Indian angels, Startup India Seed Fund) — Month 6-12
   - Series A (Indian VC) — Month 12-24
   - Series B+ (growth funding) — Month 24-36

4. INDIAN GRANT ELIGIBILITY:
   - Startup India Seed Fund Scheme
   - BIRAC (biotech/life sciences)
   - DST NIDHI (deep tech)
   - MeitY (IT/software)
   - State government startup policies
   - MSME subsidies

5. RECOMMENDED INVESTORS:
   - Indian Angel Network (IAN)
   - Mumbai Angels
   - LetsVenture
   - Specific VC firms relevant to the domain
   - Corporate venture arms (Tata, Reliance, etc.)

Return as JSON:
{{
  "total_funding_requirement": {{
    "seed": "₹X",
    "growth_break_even": "₹X",
    "pan_india_expansion": "₹X",
    "total": "₹X"
  }},
  "recommended_mix": {{
    "bootstrap_pct": 20,
    "angel_network_pct": 30,
    "venture_capital_pct": 30,
    "debt_sidbi_pct": 10,
    "government_grants_pct": 10
  }},
  "funding_roadmap": [
    {{"stage": "Pre-seed", "months": "0-6", "source": "Friends, Family, Bootstrapping", "amount": "₹X", "milestone": "MVP launch in India"}},
    {{"stage": "Seed", "months": "6-12", "source": "Angel Network / Startup India Seed Fund", "amount": "₹X", "milestone": "Product-market fit in India"}},
    {{"stage": "Series A", "months": "12-24", "source": "Indian VC", "amount": "₹X", "milestone": "Pan-India expansion"}},
    {{"stage": "Series B+", "months": "24-36", "source": "Growth VC / PE", "amount": "₹X", "milestone": "Profitability and scale"}}
  ],
  "indian_grant_eligibility": [
    {{"scheme": "Startup India Seed Fund", "eligibility": "DPIIT recognized startup", "amount": "up to ₹20L", "notes": "For proof of concept, prototype, or product development"}}
  ],
  "recommended_investors": [
    {{"name": "Investor/Network", "stage": "Seed/Series A", "rationale": "Why they fit this Indian venture"}}
  ],
  "investor_readiness_score": 7
}}"""

FINANCIAL_METRICS_PROMPT = """Calculate key financial metrics for the INDIAN market.

Opportunity: {opportunity}
Startup Costs: {startup_costs}
Revenue Projections: {revenue_projections}
Break-even Analysis: {break_even_analysis}
Funding Strategy: {funding_strategy}

IMPORTANT: All figures in INR.

1. GROSS MARGIN:
   - Revenue minus COGS
   - Gross margin percentage
   - Comparison with Indian industry benchmarks

2. NET PROFIT MARGINS (Year 1-3):
   - Year 1: Typically negative for Indian startups
   - Year 2: Path to positive (if applicable)
   - Year 3: Target profitability for India
   - Expense ratio analysis

3. CUSTOMER METRICS:
   - CAC (Customer Acquisition Cost in INR)
   - LTV (Lifetime Value in INR)
   - LTV:CAC ratio
   - Payback period in months
   - Typical Indian benchmarks comparison

4. ROI PROJECTION:
   - 3-year ROI projection
   - Break-even ROI timeline
   - Internal Rate of Return estimate
   - Comparison with Indian market returns

5. TAX CONSIDERATIONS:
   - GST registration requirements
   - Corporate tax rate applicable (22-30%)
   - Startup tax holiday eligibility (Section 80-IAC)
   - Angel tax (Section 56(2)(viib)) considerations
   - TDS obligations

Return as JSON:
{{
  "gross_margin": {{
    "percentage": 70,
    "revenue": "₹X",
    "cogs": "₹X",
    "industry_benchmark": "Typical margin for this sector in India"
  }},
  "net_margins": {{
    "year_1": {{
      "net_margin_pct": -20,
      "net_income": "₹X",
      "expenses": "₹X"
    }},
    "year_2": {{"net_margin_pct": 10, "net_income": "₹X"}},
    "year_3": {{"net_margin_pct": 25, "net_income": "₹X"}}
  }},
  "customer_metrics": {{
    "cac": "₹X",
    "ltv": "₹X",
    "ltv_cac_ratio": 3.5,
    "payback_period_months": 12,
    "industry_benchmark_cac": "₹X typical for this sector in India",
    "industry_benchmark_ltv_cac": "3-5x typical for Indian startups"
  }},
  "roi_projection": {{
    "three_year_roi_pct": 150,
    "break_even_roi_month": 18,
    "irr_estimate_pct": 35,
    "comparable_indian_returns": "Typical returns in Indian startup ecosystem"
  }},
  "tax_considerations": {{
    "gst_registration": "Required/Not Required with threshold details",
    "corporate_tax_rate": "22-30% based on turnover",
    "startup_tax_holiday": "Eligible under Section 80-IAC",
    "angel_tax_applicability": "Section 56(2)(viib) considerations",
    "tds_obligations": "TDS on salary, contractor payments, rent"
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


async def run_financial_analyst_multi(
    opportunity: str,
    business_model: str,
    market_size: str,
    user_inputs: str,
    llm: LLMClient,
    on_step: Optional[Callable] = None,
) -> Dict[str, Any]:
    if len(opportunity) > 2500:
        opportunity = opportunity[:2500] + "...[truncated]"
    if len(business_model) > 1500:
        business_model = business_model[:1500] + "...[truncated]"
    if len(market_size) > 1500:
        market_size = market_size[:1500] + "...[truncated]"
    system = SYSTEM_BASE

    if on_step:
        await on_step("Startup Cost Estimation")
        await on_step("Revenue Projections")
    step1, step2 = await asyncio.gather(
        _run_step(llm, STARTUP_COSTS_PROMPT.format(
            opportunity=opportunity, business_model=business_model or "Subscription-based SaaS for India",
            market_size=market_size or "Growing Indian market",
            user_inputs=user_inputs or "Standard Indian market assumptions"
        ), system, None, None),
        _run_step(llm, REVENUE_PROJECTIONS_PROMPT.format(
            opportunity=opportunity, business_model=business_model or "Subscription-based SaaS for India",
            market_size=market_size or "Growing Indian market"
        ), system, None, None),
    )

    step3 = await _run_step(llm, BREAK_EVEN_PROMPT.format(
        opportunity=opportunity, revenue_projections=summarize_context(step2)
    ), system, "Break-even Analysis", on_step)

    step4 = await _run_step(llm, FUNDING_STRATEGY_PROMPT.format(
        opportunity=opportunity, break_even_analysis=summarize_context(step3)
    ), system, "Funding Strategy", on_step)

    step5 = await _run_step(llm, FINANCIAL_METRICS_PROMPT.format(
        opportunity=opportunity,
        startup_costs=summarize_context(step1),
        revenue_projections=summarize_context(step2),
        break_even_analysis=summarize_context(step3),
        funding_strategy=summarize_context(step4),
    ), system, "Financial Metrics", on_step)

    result = {
        "startup_costs": step1,
        "revenue_projections": step2,
        "break_even_analysis": step3,
        "funding_strategy": step4,
        "financial_metrics": step5,
    }
    return result
