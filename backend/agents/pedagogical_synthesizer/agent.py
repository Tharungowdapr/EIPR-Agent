import json
import re
import logging
from typing import Dict, Any
from core.llm_client import LLMClient

logger = logging.getLogger(__name__)

PEDAGOGICAL_SYSTEM = """You are an EIPR Curriculum Synthesizer AI for INDIAN universities.
Your role is to map all entrepreneurial analysis to the EIPR syllabus as taught in Indian BBA/B.Com/MBA programs and produce publishable educational content.
Cover: All 5 units of EIPR curriculum with focus on Indian regulatory framework, Indian case law, and Indian entrepreneurship ecosystem.
Always include references to:
- Indian Patents Act 1970, Trade Marks Act 1999, Copyright Act 1957
- Startup India, Make in India, Atmanirbhar Bharat
- Indian case studies and examples
- Indian government policies and schemes
- Indian landmark IP cases"""

TEMPLATE_INSTRUCTIONS = {
    "academic": "Focus on pedagogical value. Include detailed EIPR curriculum mapping, learning outcomes, discussion questions for Indian BBA/MBA classrooms, and references to Indian case law. Write in a formal academic style suitable for university submission.",
    "investor": "Focus on commercial viability. Highlight market opportunity size (INR), revenue projections, competitive advantage, IP moat, funding strategy, and exit potential. Write in a concise, persuasive style for angel investors and VCs. Emphasize traction, unit economics, and scalability in India.",
    "classroom": "Focus on teaching utility. Include simplified explanations of concepts, real-world Indian examples, role-play scenarios, group discussion prompts, and takeaway summaries for each section. Write in an engaging, accessible style for undergraduate students.",
}

PEDAGOGICAL_PROMPT = """Synthesize all analysis into a comprehensive EIPR case study/report for INDIAN {template_label} context:

Domain: {domain}
Opportunity Analysis: {opportunity_analysis}
IP Strategy: {ip_strategy}
Business Strategy: {business_strategy}
Financial Analysis: {financial_analysis}
Template Style: {template_instruction}

Generate a comprehensive EIPR case study with these sections, ALL based on Indian context:

1. INTRODUCTION (Unit I - Entrepreneurship):
   - Type of entrepreneur analysis (Innovative/Imitative/Fabian in Indian context)
   - Entrepreneurial characteristics needed for Indian market
   - Role in Indian economic development (GDP contribution, employment generation)
   - Myths vs reality of Indian entrepreneurship
   - Alignment with Startup India and Make in India initiatives

2. OPPORTUNITY EVALUATION (Unit II - Indian Market):
   - Market opportunity identification in Indian context
   - Feasibility analysis for Indian market (technical, market, financial, regulatory)
   - Business planning approach for Indian registration
   - SWOC analysis with Porter's strategies for Indian competition
   - Indian regulatory compliance requirements

3. MARKETING & FINANCE (Unit III - India Strategy):
   - 4Ps / STP / UVP adapted for Indian consumers
   - Digital marketing strategy for Indian audience
   - Funding strategy (Indian sources — SIDBI, Startup India Seed Fund, angel networks)
   - Financial feasibility in INR
   - Risk management for Indian market conditions

4. PATENTS & IP (Unit IV - Indian IP Law):
   - Patent strategy under Indian Patents Act 1970
   - Patentability analysis with Section 3 considerations
   - Trademark protection under Indian Trade Marks Act 1999
   - IP portfolio recommendations for Indian filing
   - Indian IP enforcement mechanisms

5. COPYRIGHT & OTHER IP (Unit V - Indian IP):
   - Copyright protection under Indian Copyright Act 1957
   - Trade secret protection under Indian Contract Act
   - Design registration under Indian Design Act 2000
   - IP commercialization plan for Indian market

6. ACADEMIC CASE STUDY:
   - Learning objectives aligned with Indian EIPR syllabus
   - Discussion questions for Indian classroom
   - Key takeaways for Indian entrepreneurs
   - References to Indian IP cases and examples

Return as JSON:
{{
  "title": "Case Study Title (India-focused)",
  "abstract": "Brief abstract for Indian academic journal",
  "eipr_mapping": [
    {{"unit": "I", "topic": "Entrepreneurship Introduction", "coverage": "India-specific text", "indian_examples": ["example1"]}},
    {{"unit": "II", "topic": "Opportunity Evaluation", "coverage": "India-market focused text", "indian_examples": ["example1"]}},
    {{"unit": "III", "topic": "Marketing & Finance", "coverage": "India strategy text", "indian_examples": ["example1"]}},
    {{"unit": "IV", "topic": "Patents & Trademarks", "coverage": "Indian IP law text", "indian_law_references": ["Patents Act 1970"]}},
    {{"unit": "V", "topic": "Copyright & Other IP", "coverage": "Indian IP law text", "indian_law_references": ["Copyright Act 1957"]}}
  ],
  "case_study": {{
    "introduction": "Full introduction with Indian context and socioeconomic relevance",
    "opportunity_analysis": "India-market opportunity analysis",
    "business_strategy": "India-specific business and marketing strategy",
    "ip_strategy": "IP strategy under Indian law",
    "conclusion": "Conclusion with India growth potential"
  }},
  "learning_outcomes": ["India-specific outcome1"],
  "discussion_questions": ["q1 for Indian classroom"],
  "key_takeaways": ["India-specific takeaway1"],
  "government_scheme_alignment": ["Startup India", "Make in India"],
  "indian_legal_references": ["Patents Act 1970, Section 3", "Trade Marks Act 1999"],
  "indian_case_references": ["Relevant Indian IP cases"],
  "references": ["Indian govt scheme ref1"],
  "keywords": ["keyword1", "EIPR", "Indian Entrepreneurship", "Startup India"]
}}
"""


async def run_pedagogical_synthesizer(
    domain: str,
    opportunity_analysis: dict,
    ip_strategy: dict,
    business_strategy: dict,
    financial_analysis: dict,
    llm: LLMClient,
    template: str = "academic",
) -> Dict[str, Any]:
    template_label = {"academic": "academic", "investor": "investor", "classroom": "classroom"}.get(template, "academic")
    prompt = PEDAGOGICAL_PROMPT.format(
        template_label=template_label,
        template_instruction=TEMPLATE_INSTRUCTIONS.get(template, TEMPLATE_INSTRUCTIONS["academic"]),
        domain=domain,
        opportunity_analysis=json.dumps(opportunity_analysis, indent=2)[:3000],
        ip_strategy=json.dumps(ip_strategy, indent=2)[:3000],
        business_strategy=json.dumps(business_strategy, indent=2)[:3000],
        financial_analysis=json.dumps(financial_analysis, indent=2)[:2000],
    )
    raw = await llm.complete(prompt, system=PEDAGOGICAL_SYSTEM, json_mode=True)
    result = _parse_json(raw)
    if not result:
        raise ValueError("LLM returned invalid report")
    return result


def _parse_json(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    return json.loads(clean)
