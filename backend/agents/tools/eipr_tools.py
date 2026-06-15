from typing import List, Dict, Any
from agents.tools.web_search import search_web, scrape_page, research_topic
from core.mcp_client import MCPOrchestrator
import logging

logger = logging.getLogger(__name__)
mcp = MCPOrchestrator()


async def web_research_tool(topic: str) -> str:
    data = await research_topic(topic)
    if not data["search_results"]:
        return f"No web results found for: {topic}"
    lines = [f"## Web Research: {topic}", ""]
    for i, r in enumerate(data["search_results"], 1):
        lines.append(f"{i}. {r['title']}")
        lines.append(f"   URL: {r['url']}")
        lines.append(f"   {r['snippet']}")
        lines.append("")
    if data["scraped_content"]:
        lines.append("### Detailed Content:")
        for s in data["scraped_content"]:
            lines.append(f"\n**{s['title']}** ({s['url']}):")
            lines.append(s["content"][:2000])
    return "\n".join(lines)


async def market_research_tool(domain: str, industry: str = "") -> str:
    topic = f"{industry} {domain} market analysis 2025 2026 trends"
    return await web_research_tool(topic)


async def competitor_analysis_tool(domain: str) -> str:
    topic = f"top competitors in {domain} market analysis"
    return await web_research_tool(topic)


async def ip_patent_search_tool(innovation: str) -> str:
    topic = f"patents related to {innovation} intellectual property"
    return await web_research_tool(topic)


async def company_info_tool(company_name: str) -> str:
    topic = f"{company_name} company overview funding technology"
    return await web_research_tool(topic)


async def funding_research_tool(industry: str) -> str:
    topic = f"{industry} startup funding venture capital 2025 2026"
    return await web_research_tool(topic)


async def mcp_patent_search_tool(query: str) -> str:
    try:
        results = await mcp.patent.search_patents(query)
        if results:
            lines = [f"## MCP Patent Search: {query}", ""]
            for r in results[:5]:
                lines.append(f"- {r.get('title', 'N/A')}")
                lines.append(f"  Status: {r.get('status', 'N/A')}")
            return "\n".join(lines)
    except Exception as e:
        logger.warning(f"MCP patent search failed: {e}")
    return "MCP patent service unavailable, using web search instead."