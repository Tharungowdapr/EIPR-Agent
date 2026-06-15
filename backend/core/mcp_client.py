import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class MCPClient:
    def __init__(self, server_url: str, api_key: Optional[str] = None):
        self.server_url = server_url.rstrip("/")
        self.api_key = api_key

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        payload = {"name": tool_name, "arguments": arguments}
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{self.server_url}/mcp", json=payload, headers=headers)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning(f"MCP call {tool_name} failed: {e}")
            return {"error": str(e), "tool": tool_name}


class PatentMCP:
    def __init__(self, server_url: str = "https://mcp.patentclient.com/mcp"):
        self.client = MCPClient(server_url)

    async def search_patents(self, query: str, limit: int = 20) -> list:
        result = await self.client.call_tool("search_patents_global", {"query": query, "limit": limit})
        return result.get("results", [])

    async def get_patent_details(self, patent_id: str) -> dict:
        result = await self.client.call_tool("get_patent_details", {"patent_id": patent_id})
        return result

    async def search_by_assignee(self, assignee: str) -> list:
        result = await self.client.call_tool("search_by_assignee", {"assignee": assignee})
        return result.get("results", [])

    async def analyze_technology_trends(self, cpc_code: str, years: int = 5) -> dict:
        result = await self.client.call_tool("analyze_technology_trends", {"cpc_code": cpc_code, "years": years})
        return result

    async def check_freedom_to_operate(self, technology_description: str) -> dict:
        result = await self.client.call_tool("freedom_to_operate", {"description": technology_description})
        return result


class TrademarkMCP:
    def __init__(self, server_url: str = "https://mcp.patentclient.com/mcp"):
        self.client = MCPClient(server_url)

    async def search_trademarks(self, query: str, jurisdiction: str = "US") -> list:
        result = await self.client.call_tool("trademark_search", {"query": query, "jurisdiction": jurisdiction})
        return result.get("results", [])

    async def check_trademark_availability(self, mark: str, class_code: str) -> dict:
        result = await self.client.call_tool("trademark_availability", {"mark": mark, "class_code": class_code})
        return result


class MarketIntelMCP:
    def __init__(self, server_url: str = ""):
        self.competlab = MCPClient(server_url or "https://api.competlab.com/mcp")

    async def get_competitive_landscape(self, industry: str, company: str) -> dict:
        result = await self.competlab.call_tool("get_competitive_landscape", {"industry": industry, "company": company})
        return result

    async def get_market_trends(self, sector: str) -> dict:
        result = await self.competlab.call_tool("get_market_trends", {"sector": sector})
        return result


class BusinessIntelMCP:
    def __init__(self, server_url: str = ""):
        self.client = MCPClient(server_url or "https://api.bizintel.com/mcp")

    async def get_company_profile(self, company_name: str) -> dict:
        result = await self.client.call_tool("get_company_profile", {"company_name": company_name})
        return result

    async def get_industry_report(self, industry: str) -> dict:
        result = await self.client.call_tool("get_industry_report", {"industry": industry})
        return result


class MCPOrchestrator:
    def __init__(self):
        self.patent = PatentMCP()
        self.trademark = TrademarkMCP()
        self.market_intel = MarketIntelMCP()
        self.business_intel = BusinessIntelMCP()

    async def comprehensive_ip_search(self, domain: str, keywords: list) -> dict:
        patent_results = await self.patent.search_patents(" ".join(keywords))
        trademark_results = await self.trademark.search_trademarks(domain)
        return {"patents": patent_results, "trademarks": trademark_results}

    async def competitive_analysis(self, industry: str, company: str) -> dict:
        landscape = await self.market_intel.get_competitive_landscape(industry, company)
        trends = await self.market_intel.get_market_trends(industry)
        return {"landscape": landscape, "trends": trends}
