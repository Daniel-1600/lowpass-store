import json
import sqlite3

from seed import CATEGORIES, PRODUCTS, SCHEMA


def _build_database() -> sqlite3.Connection:
    # The catalogue is read-only at runtime, so each server instance builds its own
    # in-memory SQLite database from the seed on startup. See README for the trade-off.
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    conn.executemany(
        "INSERT INTO categories (slug, name, description, position) VALUES (?, ?, ?, ?)",
        [(c["slug"], c["name"], c["description"], i) for i, c in enumerate(CATEGORIES)],
    )
    conn.executemany(
        """
        INSERT INTO products (slug, sku, name, tagline, description, price_cents, stock,
                              category_slug, image_alt, specs, featured, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                p["slug"],
                p["sku"],
                p["name"],
                p["tagline"],
                p["description"],
                p["priceCents"],
                p["stock"],
                p["categorySlug"],
                p["imageAlt"],
                json.dumps(p["specs"]),
                1 if p["featured"] else 0,
                p["updatedAt"],
            )
            for p in PRODUCTS
        ],
    )
    return conn


_db = _build_database()

_PRODUCT_COLUMNS = """
  p.slug, p.sku, p.name, p.tagline, p.description, p.price_cents, p.stock,
  p.category_slug, c.name AS category_name, p.image_alt, p.specs, p.updated_at"""
_FROM_PRODUCTS = "FROM products p JOIN categories c ON c.slug = p.category_slug"


def _to_summary(row: sqlite3.Row) -> dict:
    return {
        "slug": row["slug"],
        "sku": row["sku"],
        "name": row["name"],
        "tagline": row["tagline"],
        "priceCents": row["price_cents"],
        "stock": row["stock"],
        "categorySlug": row["category_slug"],
        "categoryName": row["category_name"],
        "image": f"/images/products/{row['slug']}.webp",
        "imageAlt": row["image_alt"],
    }


def list_products(category: str | None = None, featured: bool = False) -> list[dict]:
    where: list[str] = []
    params: list[str] = []
    if category:
        where.append("p.category_slug = ?")
        params.append(category)
    if featured:
        where.append("p.featured = 1")
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    rows = _db.execute(
        f"SELECT {_PRODUCT_COLUMNS} {_FROM_PRODUCTS} {clause} ORDER BY c.position, p.rowid",
        params,
    ).fetchall()
    return [_to_summary(row) for row in rows]


def get_product(slug: str) -> dict | None:
    row = _db.execute(
        f"SELECT {_PRODUCT_COLUMNS} {_FROM_PRODUCTS} WHERE p.slug = ?", (slug,)
    ).fetchone()
    if row is None:
        return None
    return {
        **_to_summary(row),
        "description": row["description"],
        "specs": json.loads(row["specs"]),
        "updatedAt": row["updated_at"],
    }


def list_categories() -> list[dict]:
    rows = _db.execute(
        """
        SELECT c.slug, c.name, c.description, COUNT(p.slug) AS product_count
        FROM categories c LEFT JOIN products p ON p.category_slug = c.slug
        GROUP BY c.slug ORDER BY c.position
        """
    ).fetchall()
    return [
        {
            "slug": c["slug"],
            "name": c["name"],
            "description": c["description"],
            "productCount": c["product_count"],
        }
        for c in rows
    ]


def get_sitemap_entries() -> list[sqlite3.Row]:
    return _db.execute("SELECT slug, updated_at FROM products ORDER BY rowid").fetchall()
