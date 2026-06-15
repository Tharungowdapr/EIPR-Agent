import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus
import json
import logging

logger = logging.getLogger(__name__)

async def search_web(query: str, num_results: int = 8) -> List[Dict[str, str]]:
    urls = [
        f"https://html.duckduckgo.com/html/?q={quote_plus(query)}",
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    for url in urls:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "lxml")
                results = []
                for item in soup.select(".result")[:num_results]:
                    title_el = item.select_one(".result__title a")
                    snippet_el = item.select_one(".result__snippet")
                    if title_el:
                        href = title_el.get("href", "")
                        if "uddg=" in href:
                            from urllib.parse import parse_qs, urlparse
                            parsed = urlparse(href)
                            qs = parse_qs(parsed.query)
                            href = qs.get("uddg", [href])[0]
                        results.append({
                            "title": title_el.get_text(strip=True),
                            "url": href,
                            "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
                        })
                if results:
                    return results
        except Exception as e:
            logger.warning(f"DuckDuckGo search failed: {e}")
    return []

async def scrape_page(url: str, max_chars: int = 5000) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            return text[:max_chars]
    except Exception as e:
        logger.warning(f"Scraping {url} failed: {e}")
        return None

async def research_topic(topic: str) -> Dict[str, Any]:
    results = await search_web(topic)
    scraped = []
    for r in results[:3]:
        content = await scrape_page(r["url"])
        if content:
            scraped.append({"url": r["url"], "title": r["title"], "content": content})
    return {"search_results": results, "scraped_content": scraped}