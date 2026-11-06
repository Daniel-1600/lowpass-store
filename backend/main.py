import json
import os
import re
import secrets
from xml.sax.saxutils import escape

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from db import get_product, get_sitemap_entries, list_categories, list_products
from quote import build_quote, parse_cart_items

EMAIL = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")

app = FastAPI(title="Lowpass API", redirect_slashes=False)


class OrderChanged(HTTPException):
    """The order can't be completed as reviewed. Carries the updated quote for the shopper."""

    def __init__(self, message: str, quote: dict) -> None:
        super().__init__(409, message)
        self.quote = quote


def _site_url() -> str:
    vercel_url = os.getenv("VERCEL_PROJECT_PRODUCTION_URL") or os.getenv("VERCEL_URL")
    fallback = f"https://{vercel_url}" if vercel_url else "http://localhost:3000"
    return (os.getenv("NUXT_PUBLIC_SITE_URL") or fallback).rstrip("/")


@app.exception_handler(StarletteHTTPException)
async def error_response(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    # The frontend reads statusMessage from this body. Custom HTTP reason phrases aren't an
    # option: ASGI servers can't send them and HTTP/2 doesn't have them.
    body = {
        "error": True,
        "url": request.url.path,
        "statusCode": exc.status_code,
        "statusMessage": exc.detail,
        "message": exc.detail,
    }
    if isinstance(exc, OrderChanged):
        body["data"] = {"quote": exc.quote}
    return JSONResponse(body, status_code=exc.status_code)


async def _read_json(request: Request) -> dict:
    """Validation happens by hand so that error responses keep the API's own format."""
    raw = await request.body()
    if not raw.strip():
        return {}
    try:
        data = json.loads(raw)
        # Rejects lone surrogates like "\ud800", which can't be stored or sent back as UTF-8.
        json.dumps(data, ensure_ascii=False).encode()
    except (ValueError, RecursionError) as exc:
        raise HTTPException(400, "Invalid JSON body") from exc
    return data if isinstance(data, dict) else {}


@app.get("/api/categories")
async def categories() -> list[dict]:
    return list_categories()


@app.get("/api/products")
@app.get("/api/products/")
async def products(request: Request) -> list[dict]:
    # A repeated parameter (?category=a&category=b) is ignored rather than guessed at.
    category = request.query_params.getlist("category")
    featured = request.query_params.getlist("featured")
    return list_products(
        category=category[0] if len(category) == 1 else None,
        featured=featured == ["true"],
    )


@app.get("/api/products/{slug}")
async def product(slug: str) -> dict:
    found = get_product(slug)
    if found is None:
        raise HTTPException(404, "Product not found")
    return found


@app.post("/api/cart/quote")
async def cart_quote(request: Request) -> dict:
    body = await _read_json(request)
    return build_quote(parse_cart_items(body.get("items")))


# Mock checkout: validates and re-prices the order but takes no payment and stores nothing.
# It only completes the exact order the shopper reviewed, identified by the quote's fingerprint.
@app.post("/api/checkout")
async def checkout(request: Request) -> dict:
    body = await _read_json(request)
    name, email, address = body.get("name"), body.get("email"), body.get("address")
    if (
        not isinstance(name, str)
        or not name.strip()
        or not isinstance(address, str)
        or not address.strip()
        or not isinstance(email, str)
        or not EMAIL.fullmatch(email)
    ):
        raise HTTPException(422, "Please provide a name, a valid email and an address")

    quote = build_quote(parse_cart_items(body.get("items")))
    if not quote["lines"]:
        raise OrderChanged("Your cart has no items available to buy", quote)
    if quote["changes"] or body.get("reviewedFingerprint") != quote["fingerprint"]:
        raise OrderChanged("Your order has changed. Please review the update.", quote)

    return {
        "orderNumber": f"LP-{secrets.token_hex(4).upper()}",
        "email": email,
        "totalCents": quote["totalCents"],
    }


@app.get("/robots.txt")
async def robots() -> Response:
    body = f"User-agent: *\nDisallow: /api/\n\nSitemap: {_site_url()}/sitemap.xml\n"
    return Response(body, media_type="text/plain; charset=utf-8")


@app.get("/sitemap.xml")
async def sitemap() -> Response:
    site = _site_url()
    entries = get_sitemap_entries()
    last_updated = max(p["updated_at"] for p in entries)

    urls = [
        (f"{site}/", last_updated, None),
        (f"{site}/products", last_updated, None),
        *((f"{site}/category/{c['slug']}", last_updated, None) for c in list_categories()),
        *(
            (
                f"{site}/products/{p['slug']}",
                p["updated_at"],
                f"{site}/images/products/{p['slug']}.webp",
            )
            for p in entries
        ),
    ]

    def to_xml(loc: str, lastmod: str, image: str | None) -> str:
        image_xml = (
            f"<image:image><image:loc>{escape(image)}</image:loc></image:image>" if image else ""
        )
        return f"<url><loc>{escape(loc)}</loc><lastmod>{lastmod}</lastmod>{image_xml}</url>"

    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
        ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
        f"{''.join(to_xml(*url) for url in urls)}</urlset>"
    )
    return Response(body, media_type="application/xml; charset=utf-8")
