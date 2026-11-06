import hashlib
import json

from fastapi import HTTPException

from db import get_product

FREE_SHIPPING_FROM_CENTS = 10000
SHIPPING_CENTS = 800
MAX_CART_LINES = 50


def _whole_number(value: object) -> int | None:
    """Reads a JSON number as an int. JSON has one number type, so 1.0 and 1e2 count as whole."""
    if isinstance(value, bool):  # bool is a subclass of int in Python
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return None


def parse_cart_items(data: object) -> list[dict]:
    """Rejects anything that isn't a list of { slug, quantity } before it reaches the database."""
    invalid = HTTPException(400, "Invalid cart items")
    if not isinstance(data, list) or len(data) > MAX_CART_LINES:
        raise invalid
    items = []
    for item in data:
        if not isinstance(item, dict) or not isinstance(item.get("slug"), str):
            raise invalid
        quantity = _whole_number(item.get("quantity"))
        if quantity is None or quantity <= 0:
            raise invalid
        items.append({"slug": item["slug"], "quantity": quantity})
    return items


def _fingerprint(lines: list[dict], shipping: int) -> str:
    """Identifies what the shopper is agreeing to buy, so checkout can spot any change."""
    order = sorted((line["slug"], line["quantity"], line["priceCents"]) for line in lines)
    return hashlib.sha256(json.dumps([order, shipping]).encode()).hexdigest()


def build_quote(items: list[dict]) -> dict:
    """
    Prices the cart from the database so the client's numbers are never trusted.
    Repeated products are combined before quantities are capped to stock. Anything that can't be
    sold as requested is left out or reduced, and reported in `changes`.
    """
    requested: dict[str, int] = {}
    for item in items:
        requested[item["slug"]] = requested.get(item["slug"], 0) + item["quantity"]

    lines = []
    changes = []
    for slug, wanted in requested.items():
        product = get_product(slug)
        name = product["name"] if product else None
        available = min(wanted, product["stock"]) if product else 0
        if available < wanted:
            reason = "unavailable" if not product else "sold_out" if not available else "reduced"
            changes.append(
                {
                    "slug": slug,
                    "name": name,
                    "reason": reason,
                    "requestedQuantity": wanted,
                    "availableQuantity": available,
                }
            )
        if not available:
            continue
        lines.append(
            {
                "slug": product["slug"],
                "sku": product["sku"],
                "name": product["name"],
                "tagline": product["tagline"],
                "priceCents": product["priceCents"],
                "stock": product["stock"],
                "categorySlug": product["categorySlug"],
                "categoryName": product["categoryName"],
                "image": product["image"],
                "imageAlt": product["imageAlt"],
                "quantity": available,
                "lineTotalCents": available * product["priceCents"],
            }
        )
    subtotal = sum(line["lineTotalCents"] for line in lines)
    shipping = 0 if subtotal == 0 or subtotal >= FREE_SHIPPING_FROM_CENTS else SHIPPING_CENTS
    return {
        "lines": lines,
        "changes": changes,
        "subtotalCents": subtotal,
        "shippingCents": shipping,
        "totalCents": subtotal + shipping,
        "fingerprint": _fingerprint(lines, shipping),
    }
