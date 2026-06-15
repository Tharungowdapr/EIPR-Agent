import json
import re
import logging
from typing import Dict, Any, Callable, Optional
from core.llm_client import LLMClient

logger = logging.getLogger(__name__)

SYSTEM_BASE = """You are an EIPR Curriculum Synthesizer AI for INDIAN universities.
Your role is to produce publishable educational content mapped to the EIPR syllabus as taught in Indian BBA/B.Com/MBA programs.
All content must be India-specific with references to:
- Indian regulatory framework (Patents Act 1970, Trade Marks Act 1999, Copyright Act 1957)
- Indian government initiatives (Startup India, Make in India, Atmanirbhar Bharat, Digital India)
- Indian landmark IP cases and real Indian startup examples
- Indian socioeconomic context and market realities

Write in a formal academic style. Each section must be 300-500 words with substantive detail, Indian examples, and analytical depth."""

TITLE_ABSTRACT_PROMPT = """Generate a title and abstract for an EIPR case study report based on the following analysis data.

Domain: {domain}
Project Description: {description}
User Context: {context}

Opportunities Summary:
{opportunities_summary}

Business Strategy Highlights:
{business_highlights}

IP Strategy Highlights:
{ip_highlights}

Financial Highlights:
{financial_highlights}

Generate:
1. A compelling, specific title (not generic) that reflects the Indian context
2. A comprehensive abstract (200-250 words) covering all analysis dimensions
3. 8-12 relevant keywords covering entrepreneurship, IP, and the specific domain

Return as JSON:
{{
  "title": "Case Study Title",
  "abstract": "Full abstract text...",
  "keywords": ["keyword1", "keyword2"]
}}"""

INTRODUCTION_PROMPT = """Write the INTRODUCTION section for an EIPR case study report in the Indian context.

Domain: {domain}
Project Description: {description}
User Context: {context}

Opportunity Analysis Data:
{opportunity_data}

Write a comprehensive introduction (400-500 words) covering:
1. Background of the entrepreneurial opportunity in India — relevance to Indian economy and society
2. Type of entrepreneur analysis — classify as innovative/imitative/fabian with Indian context reasoning
3. Entrepreneurial characteristics needed specifically for the Indian market
4. Role of this venture in Indian economic development (GDP contribution, employment, social impact)
5. Alignment with national initiatives: Startup India, Make in India, Atmanirbhar Bharat, Digital India
6. Indian entrepreneurship ecosystem context — how this venture fits
7. Myths vs realities of Indian entrepreneurship relevant to this case

Write in formal academic style with India-specific data points and references. Return as a JSON object with a single key "introduction" containing the full text."""

OPPORTUNITY_ANALYSIS_PROMPT = """Write the OPPORTUNITY ANALYSIS section for an EIPR case study report.

Domain: {domain}

Complete Opportunity Data:
{opportunity_data}

Complete Business Strategy Data:
{business_data}

Write a comprehensive opportunity analysis (500-600 words) covering:
1. Market opportunity identification in the Indian context — TAM, SAM, SOM with India-specific numbers
2. Detailed feasibility analysis across four dimensions:
   a) Technical feasibility — technology readiness, infrastructure needs in India
   b) Market feasibility — Indian consumer behavior, adoption patterns, pricing sensitivity
   c) Financial feasibility — investment requirements, revenue potential in INR
   d) Regulatory feasibility — Indian compliance requirements, sector-specific regulations
3. Detailed SWOC analysis for the Indian market:
   - Strengths (India-specific advantages like demographic dividend, cost benefits)
   - Weaknesses (Indian challenges like infrastructure gaps, skill availability)
   - Opportunities (India-specific tailwinds, policy support, market gaps)
   - Challenges (Indian regulatory hurdles, competition, execution risks)
4. Porter's Five Forces analysis tailored to Indian competitive dynamics
5. Government policy analysis — which Indian schemes apply and how
6. Risk assessment specific to Indian market conditions

Write in formal academic style with India-specific data, examples, and analytical rigor. Return as JSON with key "opportunity_analysis"."""

BUSINESS_STRATEGY_PROMPT = """Write the BUSINESS STRATEGY section for an EIPR case study report in the Indian market.

Domain: {domain}
Target Customer: {target_customer}

Complete Business Strategy Data:
{business_data}

Complete Opportunities Data:
{opportunity_data}

Write a comprehensive business strategy section (500-600 words) covering:
1. Business Model Canvas adapted for India:
   - Value proposition for Indian customers
   - Revenue streams suited to Indian willingness-to-pay
   - Key partnerships including Indian suppliers, distributors
   - Cost structure with Indian cost benchmarks
2. STP Strategy for Indian market:
   - Segmentation of Indian consumers (geographic, demographic, psychographic, behavioral)
   - Target segment selection with rationale
   - Positioning strategy for Indian competitive landscape
3. 4Ps/7Ps Marketing Mix adapted for India:
   - Product strategy with Indian localization needs
   - Pricing strategy for price-sensitive Indian market (value pricing, tiered pricing)
   - Place/Distribution strategy leveraging Indian channels (online + offline, D2C, retail)
   - Promotion strategy using India-specific media (regional language, digital penetration)
   - People, Process, Physical Evidence for service delivery in India
4. Digital Marketing strategy for Indian audience:
   - India-specific platforms (WhatsApp Business, ShareChat, Moj, regional platforms)
   - Indian language content strategy
   - Social media approach for Indian consumers
5. Growth Strategy for India:
   - Organic growth levers in Indian market
   - Strategic alliances suited to Indian business ecosystem
   - Scaling roadmap for Indian cities (tier 1 → tier 2/3 → rural)
   - Exit strategies relevant to Indian M&A and IPO landscape
6. Operations plan for Indian context:
   - Supply chain considerations for India
   - Talent acquisition in Indian job market
   - Technology infrastructure decisions (India cloud regions, India-specific compliance)

Write in formal academic style with India-specific examples and benchmarks. Return as JSON with key "business_strategy"."""

IP_STRATEGY_PROMPT = """Write the IP STRATEGY section for an EIPR case study report under Indian IP law.

Domain: {domain}

Complete IP Analysis Data:
{ip_data}

Complete Opportunities Data:
{opportunity_data}

Write a comprehensive IP strategy section (600-700 words) covering:

1. PATENT ANALYSIS (under Indian Patents Act 1970):
   - Patentability assessment in India — novelty, inventive step, industrial application
   - Section 3 considerations — exclusions that may apply in the Indian context
   - Patent filing strategy for India:
     * Type of filing (provisional vs complete specification)
     * Timeline for Indian patent office prosecution
     * Startup fee discounts under Indian patent rules (80% fee reduction for startups)
   - Estimated costs for Indian patent filing (INR)
   - Patent portfolio roadmap for Indian and international filing (PCT route)

2. TRADEMARK ANALYSIS (under Trade Marks Act 1999):
   - Protectable elements in Indian context (brand name, logo, tagline, trade dress)
   - Trademark class selection under Nice Classification relevant to this venture
   - Registration strategy for Indian trademark registry
   - Clearance search importance in Indian context
   - Well-known trademark protection possibilities

3. COPYRIGHT ANALYSIS (under Copyright Act 1957):
   - Copyrightable elements (software code, documentation, creative content, database)
   - Ownership considerations under Indian Copyright Act (work-for-hire, assignment)
   - Licensing strategy for Indian market
   - Registration benefits in India

4. TRADE SECRET PROTECTION (under Indian Contract Act):
   - Trade secret identification for this venture
   - Protection measures suitable for Indian legal framework
   - NDA and confidentiality agreement best practices in India
   - Limitations of trade secret protection in Indian courts

5. IP COMMERCIALIZATION & ENFORCEMENT:
   - IP monetization strategy for Indian market (licensing, assignment, sale)
   - Budget estimate for complete IP protection in India (INR)
   - IP enforcement mechanisms in India (civil, criminal, administrative)
   - Customs recordal for border enforcement
   - IP portfolio value estimation

6. FREEDOM TO OPERATE:
   - FTO analysis for Indian market launch
   - Third-party patent risks in the Indian context
   - Mitigation strategies (invalidation, licensing, design-around)

Write in formal legal/academic style citing specific sections of Indian IP statutes. Return as JSON with key "ip_strategy"."""

CONCLUSION_PROMPT = """Write the CONCLUSION for an EIPR case study report in the Indian context.

Domain: {domain}
Project Description: {description}

Complete Analysis Summary:
- Opportunities: {opportunities_summary}
- Business Strategy: {business_highlights}
- IP Strategy: {ip_highlights}
- Financial Overview: {financial_highlights}

Write a comprehensive conclusion (400-500 words) covering:
1. Synthesis of all analysis — integrating opportunity, strategy, IP, and financial dimensions
2. Overall assessment of venture viability in the Indian market
3. Most critical success factors for the Indian entrepreneur
4. Recommendations for next steps (regulatory, funding, IP filing timeline)
5. India growth potential — scalability across Indian market segments
6. EIPR curriculum relevance — how this case study demonstrates all 5 units of learning
7. Concluding remarks on the entrepreneurial journey in India

Write in formal academic style with forward-looking analysis. Return as JSON with key "conclusion"."""

CURRICULUM_MAPPING_PROMPT = """Generate EIPR CURRICULUM MAPPING for this case study report.

Domain: {domain}

Opportunities Summary: {opportunities_summary}
Business Strategy: {business_highlights}
IP Strategy: {ip_highlights}
Financial Overview: {financial_highlights}

Generate comprehensive EIPR curriculum mapping covering all 5 units as taught in Indian universities:

UNIT I — Entrepreneurship: Concept, Types, and Indian Ecosystem
UNIT II — Opportunity Identification and Business Planning
UNIT III — Marketing and Financial Strategy for Indian Ventures
UNIT IV — Patents and Trademarks (Indian IP Law)
UNIT V — Copyright, Trade Secrets, Design, and IP Management

For each unit, provide:
- Topic name
- Detailed coverage text (150-200 words) showing how the case study demonstrates this unit
- 3-5 Indian examples relevant to the unit
- For Units IV-V: specific Indian law references with section numbers

Also generate:
- 8-10 learning outcomes (measurable, specific to this case study)
- 6-8 discussion questions for Indian classroom settings
- 5-6 key takeaways for Indian entrepreneurs
- 4-5 government schemes aligned with this venture
- 5-6 Indian legal references with specific statutes and sections
- 4-5 relevant Indian IP case references
- 8-10 references (Indian government reports, academic papers, news articles)

Return as JSON with keys: eipr_mapping (array), learning_outcomes (array), discussion_questions (array), key_takeaways (array), government_scheme_alignment (array), indian_legal_references (array), indian_case_references (array), references (array)."""


def _extract_json(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    return json.loads(clean)


def _summarize(obj: Any, max_chars: int = 1500) -> str:
    text = json.dumps(obj, indent=2) if isinstance(obj, dict) else str(obj)
    return text[:max_chars] + ("..." if len(text) > max_chars else "")


async def _run_section(
    llm: LLMClient,
    prompt: str,
    system: str,
    section_name: str,
    on_step: Optional[Callable] = None,
) -> dict:
    if on_step:
        await on_step(section_name)
    raw = await llm.complete(prompt, system=system, json_mode=True)
    result = _extract_json(raw)
    return result


async def run_report_generator(
    domain: str,
    description: str,
    context: str,
    opportunities: dict,
    ip_analysis: dict,
    business_plan: dict,
    financial: dict,
    llm: LLMClient,
    on_step: Optional[Callable] = None,
) -> Dict[str, Any]:
    opportunities_str = _summarize(opportunities, 4000)
    ip_str = _summarize(ip_analysis, 4000)
    bp_str = _summarize(business_plan, 4000)
    fin_str = _summarize(financial, 3000)

    opps_list = opportunities.get("opportunities", [])
    opps_summary = json.dumps([{
        "title": o.get("title", ""),
        "description": o.get("description", "")[:200],
        "feasibility": o.get("feasibility_score"),
        "market_gap": o.get("market_gap"),
        "target_customer": o.get("target_customer"),
        "tam": o.get("tam"),
        "entrepreneur_type": o.get("entrepreneur_type"),
    } for o in opps_list], indent=2)

    target_customer = ""
    if opps_list:
        target_customer = opps_list[0].get("target_customer", "")

    bp_highlights = _summarize(business_plan.get("business_plan", business_plan), 1200)
    ip_highlights = _summarize(ip_analysis, 1200)
    fin_highlights = _summarize(financial, 1000)

    system = SYSTEM_BASE

    step1 = await _run_section(llm, TITLE_ABSTRACT_PROMPT.format(
        domain=domain, description=description, context=context or "N/A",
        opportunities_summary=opps_summary, business_highlights=bp_highlights,
        ip_highlights=ip_highlights, financial_highlights=fin_highlights,
    ), system, "Title & Abstract", on_step)
    title = step1.get("title", "EIPR Case Study Report")
    abstract = step1.get("abstract", "")
    keywords = step1.get("keywords", [])

    step2 = await _run_section(llm, INTRODUCTION_PROMPT.format(
        domain=domain, description=description, context=context or "N/A",
        opportunity_data=opportunities_str,
    ), system, "Introduction", on_step)

    step3 = await _run_section(llm, OPPORTUNITY_ANALYSIS_PROMPT.format(
        domain=domain,
        opportunity_data=opportunities_str,
        business_data=bp_str,
    ), system, "Opportunity Analysis", on_step)

    step4 = await _run_section(llm, BUSINESS_STRATEGY_PROMPT.format(
        domain=domain, target_customer=target_customer,
        business_data=bp_str,
        opportunity_data=opportunities_str,
    ), system, "Business Strategy", on_step)

    step5 = await _run_section(llm, IP_STRATEGY_PROMPT.format(
        domain=domain,
        ip_data=ip_str,
        opportunity_data=opportunities_str,
    ), system, "IP Strategy", on_step)

    step6 = await _run_section(llm, CONCLUSION_PROMPT.format(
        domain=domain, description=description,
        opportunities_summary=opps_summary, business_highlights=bp_highlights,
        ip_highlights=ip_highlights, financial_highlights=fin_highlights,
    ), system, "Conclusion", on_step)

    step7 = await _run_section(llm, CURRICULUM_MAPPING_PROMPT.format(
        domain=domain,
        opportunities_summary=opps_summary, business_highlights=bp_highlights,
        ip_highlights=ip_highlights, financial_highlights=fin_highlights,
    ), system, "Curriculum Mapping & Outcomes", on_step)

    report = {
        "title": title,
        "abstract": abstract,
        "case_study": {
            "introduction": step2.get("introduction", ""),
            "opportunity_analysis": step3.get("opportunity_analysis", ""),
            "business_strategy": step4.get("business_strategy", ""),
            "ip_strategy": step5.get("ip_strategy", ""),
            "conclusion": step6.get("conclusion", ""),
        },
        "eipr_mapping": step7.get("eipr_mapping", []),
        "learning_outcomes": step7.get("learning_outcomes", []),
        "discussion_questions": step7.get("discussion_questions", []),
        "key_takeaways": step7.get("key_takeaways", []),
        "government_scheme_alignment": step7.get("government_scheme_alignment", []),
        "indian_legal_references": step7.get("indian_legal_references", []),
        "indian_case_references": step7.get("indian_case_references", []),
        "references": step7.get("references", []),
        "keywords": keywords,
    }

    return report
