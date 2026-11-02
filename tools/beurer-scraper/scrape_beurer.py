#!/usr/bin/env python3
"""Scrape the product list of beurer.tn into an Excel file.

Output columns: Product name | Short description | Long description | URL

Strategy (first one that returns products wins):
  1. WooCommerce Store API   (/wp-json/wc/store/v1/products)
  2. Shopify JSON            (/products.json)
  3. Generic HTML crawl      (sitemaps -> product pages, JSON-LD + common selectors)

Usage:
    pip install -r requirements.txt
    python scrape_beurer.py                 # writes beurer_products.xlsx
    python scrape_beurer.py -o out.xlsx --base https://beurer.tn
"""
import argparse
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}
DELAY = 0.5  # seconds between requests, be polite

session = requests.Session()
session.headers.update(HEADERS)


def get(url, **kw):
    for attempt in range(3):
        try:
            r = session.get(url, timeout=30, **kw)
            return r
        except requests.RequestException as e:
            if attempt == 2:
                print(f"  ! {url}: {e}", file=sys.stderr)
                return None
            time.sleep(2 ** attempt)


def html_to_text(html):
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for tag in soup.find_all(["p", "li", "h1", "h2", "h3", "h4", "tr", "div"]):
        tag.append("\n")
    text = soup.get_text()
    text = re.sub(r"[ \t\xa0]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return text.strip()


# ---------------------------------------------------------------- 1. WooCommerce
def scrape_woocommerce(base):
    url = urljoin(base, "/wp-json/wc/store/v1/products")
    r = get(url, params={"per_page": 1})
    if not r or r.status_code != 200 or not r.headers.get("content-type", "").startswith("application/json"):
        return []
    print("Detected WooCommerce Store API")
    products, page = [], 1
    while True:
        r = get(url, params={"per_page": 100, "page": page})
        if not r or r.status_code != 200:
            break
        batch = r.json()
        if not batch:
            break
        for p in batch:
            products.append({
                "name": BeautifulSoup(p.get("name", ""), "html.parser").get_text().strip(),
                "short": html_to_text(p.get("short_description")),
                "long": html_to_text(p.get("description")),
                "url": p.get("permalink", ""),
            })
        print(f"  page {page}: {len(batch)} products")
        total_pages = int(r.headers.get("X-WP-TotalPages", page))
        if page >= total_pages:
            break
        page += 1
        time.sleep(DELAY)
    return products


# ---------------------------------------------------------------- 2. Shopify
def scrape_shopify(base):
    url = urljoin(base, "/products.json")
    r = get(url, params={"limit": 1})
    if not r or r.status_code != 200 or "products" not in r.text[:50]:
        return []
    print("Detected Shopify")
    products, page = [], 1
    while True:
        r = get(url, params={"limit": 250, "page": page})
        batch = r.json().get("products", []) if r and r.status_code == 200 else []
        if not batch:
            break
        for p in batch:
            long = html_to_text(p.get("body_html"))
            products.append({
                "name": p.get("title", "").strip(),
                "short": long.split("\n")[0] if long else "",
                "long": long,
                "url": urljoin(base, f"/products/{p.get('handle')}"),
            })
        page += 1
        time.sleep(DELAY)
    return products


# ---------------------------------------------------------------- 3. Generic HTML
def sitemap_urls(base):
    seen, todo, out = set(), [], []
    r = get(urljoin(base, "/robots.txt"))
    if r and r.status_code == 200:
        todo += re.findall(r"(?im)^sitemap:\s*(\S+)", r.text)
    todo += [urljoin(base, p) for p in ("/sitemap.xml", "/sitemap_index.xml", "/product-sitemap.xml",
                                        "/wp-sitemap.xml", "/1_index_sitemap.xml")]
    while todo:
        sm = todo.pop(0)
        if sm in seen:
            continue
        seen.add(sm)
        r = get(sm)
        if not r or r.status_code != 200 or b"<" not in r.content[:200]:
            continue
        try:
            root = ET.fromstring(r.content)
        except ET.ParseError:
            continue
        locs = [e.text.strip() for e in root.iter() if e.tag.endswith("loc") and e.text]
        if root.tag.endswith("sitemapindex"):
            todo += locs
        else:
            out += locs
    return list(dict.fromkeys(out))


PRODUCT_URL_HINT = re.compile(r"/(produit|product|products|p)/|\.html$|-\d+\.html", re.I)


def parse_product_page(url):
    r = get(url)
    if not r or r.status_code != 200:
        return None
    soup = BeautifulSoup(r.text, "html.parser")

    # JSON-LD Product
    ld = {}
    for s in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(s.string or "")
        except Exception:
            continue
        items = data if isinstance(data, list) else data.get("@graph", [data])
        for it in items:
            t = it.get("@type") if isinstance(it, dict) else None
            if t == "Product" or (isinstance(t, list) and "Product" in t):
                ld = it
                break
    is_product = bool(ld) or soup.select_one(
        ".product_title, .product-title, [itemtype*='schema.org/Product'], #product, .single-product")
    if not is_product:
        return None

    def first(*sels):
        for sel in sels:
            el = soup.select_one(sel)
            if el and el.get_text(strip=True):
                return el
        return None

    name_el = first("h1.product_title", "h1.product-title", "h1[itemprop=name]", ".product-name h1", "h1")
    name = ld.get("name") or (name_el.get_text(strip=True) if name_el else "")

    short_el = first(".woocommerce-product-details__short-description", "#description-short",
                     ".product-description-short", "[id^=product-description-short]",
                     ".product-short-description", ".short-description", "[itemprop=description]")
    long_el = first("#tab-description", ".woocommerce-Tabs-panel--description", "#description .product-description",
                    ".product-description", "#description", ".product-long-description", ".rte")

    short = html_to_text(str(short_el)) if short_el else ""
    long = html_to_text(str(long_el)) if long_el else ""
    if not short:
        meta = soup.find("meta", attrs={"name": "description"})
        short = (ld.get("description") or (meta.get("content") if meta else "") or "").strip()
    return {"name": BeautifulSoup(name, "html.parser").get_text().strip(), "short": short, "long": long, "url": url}


def scrape_generic(base):
    print("Falling back to generic HTML crawl via sitemaps")
    host = urlparse(base).netloc
    urls = [u for u in sitemap_urls(base) if urlparse(u).netloc.endswith(host.replace("www.", ""))]
    cand = [u for u in urls if PRODUCT_URL_HINT.search(u)] or urls
    print(f"  {len(urls)} URLs in sitemaps, {len(cand)} candidate product pages")
    products = []
    for i, u in enumerate(cand, 1):
        p = parse_product_page(u)
        if p and p["name"]:
            products.append(p)
        if i % 25 == 0:
            print(f"  {i}/{len(cand)} pages checked, {len(products)} products")
        time.sleep(DELAY)
    return products


# ---------------------------------------------------------------- Excel
def write_excel(products, path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Products"
    headers = ["#", "Product name", "Short description", "Long description", "URL"]
    ws.append(headers)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="C8102E")
        c.alignment = Alignment(vertical="center")
    for i, p in enumerate(products, 1):
        ws.append([i, p["name"], p["short"][:32000], p["long"][:32000], p["url"]])
    for col, w in zip("ABCDE", (6, 40, 60, 100, 50)):
        ws.column_dimensions[col].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "B2"
    ws.auto_filter.ref = ws.dimensions
    wb.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://beurer.tn")
    ap.add_argument("-o", "--output", default="beurer_products.xlsx")
    args = ap.parse_args()
    base = args.base.rstrip("/") + "/"

    products = scrape_woocommerce(base) or scrape_shopify(base) or scrape_generic(base)
    # de-duplicate by URL / name
    uniq = {}
    for p in products:
        uniq.setdefault(p["url"] or p["name"], p)
    products = sorted(uniq.values(), key=lambda p: p["name"].lower())
    if not products:
        sys.exit("No products found - the site structure may need custom selectors.")
    write_excel(products, args.output)
    print(f"Saved {len(products)} products to {args.output}")


if __name__ == "__main__":
    main()
