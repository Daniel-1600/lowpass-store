import pytest
from fastapi.testclient import TestClient

import quote as quote_module
from main import app
from quote import FREE_SHIPPING_FROM_CENTS, SHIPPING_CENTS, build_quote

client = TestClient(app)
SHOPPER = {"name": "Ada", "email": "ada@example.com", "address": "1 Test St"}


def post_quote(*items):
    response = client.post("/api/cart/quote", json={"items": list(items)})
    assert response.status_code == 200
    return response.json()


def item(slug, quantity):
    return {"slug": slug, "quantity": quantity}


def checkout(items, fingerprint):
    return client.post(
        "/api/checkout", json={**SHOPPER, "items": items, "reviewedFingerprint": fingerprint}
    )


def patch_catalogue(monkeypatch, **overrides):
    """Changes a product's fields as if the catalogue moved on. Use None to delete the product."""
    real = quote_module.get_product

    def fake(slug):
        if slug in overrides:
            return None if overrides[slug] is None else {**real(slug), **overrides[slug]}
        return real(slug)

    monkeypatch.setattr(quote_module, "get_product", fake)


class TestDuplicateSlugs:
    def test_combined_quantity_is_capped_to_stock(self):
        quote = post_quote(item("arc-one", 18), item("arc-one", 18))
        assert [(line["slug"], line["quantity"]) for line in quote["lines"]] == [("arc-one", 18)]
        assert quote["subtotalCents"] == 18 * 24900

    def test_quantities_combine_when_within_stock(self):
        quote = post_quote(item("arc-one", 2), item("pad-2", 1), item("arc-one", 3))
        assert [(line["slug"], line["quantity"]) for line in quote["lines"]] == [
            ("arc-one", 5),
            ("pad-2", 1),
        ]
        assert quote["changes"] == []

    def test_reduction_reports_the_combined_request(self):
        quote = post_quote(item("arc-one", 18), item("arc-one", 18))
        assert quote["changes"] == [
            {
                "slug": "arc-one",
                "name": "Arc One",
                "reason": "reduced",
                "requestedQuantity": 36,
                "availableQuantity": 18,
            }
        ]


class TestUnavailableProducts:
    def test_sold_out_product_is_dropped_and_reported(self):
        quote = post_quote(item("arc-studio", 1), item("pad-2", 1))
        assert [line["slug"] for line in quote["lines"]] == ["pad-2"]
        assert quote["changes"] == [
            {
                "slug": "arc-studio",
                "name": "Arc Studio",
                "reason": "sold_out",
                "requestedQuantity": 1,
                "availableQuantity": 0,
            }
        ]

    def test_missing_product_is_dropped_and_reported(self):
        quote = post_quote(item("nope", 2))
        assert quote["lines"] == []
        assert quote["changes"] == [
            {
                "slug": "nope",
                "name": None,
                "reason": "unavailable",
                "requestedQuantity": 2,
                "availableQuantity": 0,
            }
        ]


class TestInvalidCarts:
    @pytest.mark.parametrize("quantity", [0, -1, 1.5, "1", True, None])
    def test_invalid_quantities_are_rejected(self, quantity):
        response = client.post("/api/cart/quote", json={"items": [item("pad-2", quantity)]})
        assert response.status_code == 400
        assert response.json()["statusMessage"] == "Invalid cart items"

    @pytest.mark.parametrize("quantity", [1.0, 1e0])
    def test_whole_number_floats_are_accepted(self, quantity):
        assert post_quote(item("pad-2", quantity))["lines"][0]["quantity"] == 1

    @pytest.mark.parametrize("items", ["x", None, [None], [{"slug": 1, "quantity": 1}]])
    def test_malformed_items_are_rejected(self, items):
        assert client.post("/api/cart/quote", json={"items": items}).status_code == 400

    def test_line_limit(self):
        assert client.post("/api/cart/quote", json={"items": [item("pad-2", 1)] * 50}).is_success
        too_many = client.post("/api/cart/quote", json={"items": [item("pad-2", 1)] * 51})
        assert too_many.status_code == 400

    def test_malformed_json_is_rejected(self):
        assert client.post("/api/cart/quote", content=b"{nope").status_code == 400


class TestShipping:
    @pytest.mark.parametrize(
        ("subtotal", "shipping"),
        [
            (FREE_SHIPPING_FROM_CENTS - 1, SHIPPING_CENTS),
            (FREE_SHIPPING_FROM_CENTS, 0),
            (FREE_SHIPPING_FROM_CENTS + 1, 0),
        ],
    )
    def test_free_shipping_threshold(self, monkeypatch, subtotal, shipping):
        patch_catalogue(monkeypatch, **{"pad-2": {"priceCents": subtotal}})
        quote = build_quote([item("pad-2", 1)])
        assert quote["shippingCents"] == shipping
        assert quote["totalCents"] == subtotal + shipping

    def test_empty_cart_has_no_shipping(self):
        quote = post_quote()
        assert (quote["shippingCents"], quote["totalCents"]) == (0, 0)


class TestCheckoutReconciliation:
    def test_reviewed_order_completes(self):
        items = [item("arc-one", 1)]
        reviewed = post_quote(*items)
        response = checkout(items, reviewed["fingerprint"])
        assert response.status_code == 200
        order = response.json()
        assert order["totalCents"] == reviewed["totalCents"]
        assert order["email"] == SHOPPER["email"]
        assert order["orderNumber"].startswith("LP-")

    def test_missing_fingerprint_is_not_accepted(self):
        response = client.post("/api/checkout", json={**SHOPPER, "items": [item("arc-one", 1)]})
        assert response.status_code == 409
        assert response.json()["data"]["quote"]["lines"][0]["slug"] == "arc-one"

    def test_stock_drop_after_review_returns_updated_quote(self, monkeypatch):
        items = [item("arc-one", 5)]
        reviewed = post_quote(*items)
        patch_catalogue(monkeypatch, **{"arc-one": {"stock": 2}})

        response = checkout(items, reviewed["fingerprint"])

        assert response.status_code == 409
        updated = response.json()["data"]["quote"]
        assert updated["lines"][0]["quantity"] == 2
        assert updated["changes"][0]["reason"] == "reduced"

    def test_price_change_after_review_returns_updated_quote(self, monkeypatch):
        items = [item("arc-one", 1)]
        reviewed = post_quote(*items)
        patch_catalogue(monkeypatch, **{"arc-one": {"priceCents": 30000}})

        response = checkout(items, reviewed["fingerprint"])

        assert response.status_code == 409
        updated = response.json()["data"]["quote"]
        assert updated["totalCents"] == 30000
        assert updated["fingerprint"] != reviewed["fingerprint"]

    def test_confirming_the_updated_quote_completes(self, monkeypatch):
        reviewed = post_quote(item("arc-one", 5))
        patch_catalogue(monkeypatch, **{"arc-one": {"stock": 2}})
        updated = checkout([item("arc-one", 5)], reviewed["fingerprint"]).json()["data"]["quote"]

        response = checkout([item("arc-one", 2)], updated["fingerprint"])

        assert response.status_code == 200
        assert response.json()["totalCents"] == updated["totalCents"]

    def test_uncorrected_cart_is_refused_even_with_matching_fingerprint(self):
        items = [item("arc-one", 99)]
        quote = post_quote(*items)
        response = checkout(items, quote["fingerprint"])
        assert response.status_code == 409
        assert response.json()["data"]["quote"]["changes"][0]["reason"] == "reduced"

    def test_product_removed_after_review_is_reported(self, monkeypatch):
        items = [item("arc-one", 1), item("pad-2", 1)]
        reviewed = post_quote(*items)
        patch_catalogue(monkeypatch, **{"arc-one": None})

        updated = checkout(items, reviewed["fingerprint"]).json()["data"]["quote"]

        assert [line["slug"] for line in updated["lines"]] == ["pad-2"]
        assert updated["changes"][0]["reason"] == "unavailable"

    def test_nothing_left_to_buy_is_reported_with_the_quote(self):
        response = checkout([item("arc-studio", 1)], "anything")
        assert response.status_code == 409
        assert response.json()["statusMessage"] == "Your cart has no items available to buy"
        assert response.json()["data"]["quote"]["changes"][0]["reason"] == "sold_out"

    def test_empty_cart_cannot_check_out(self):
        assert checkout([], "anything").status_code == 409

    @pytest.mark.parametrize(
        "override",
        [{"name": " "}, {"address": ""}, {"email": "bad"}, {"email": "a@b.co\n"}, {"name": 1}],
    )
    def test_invalid_shopper_details_are_rejected(self, override):
        body = {**SHOPPER, **override, "items": [item("arc-one", 1)]}
        assert client.post("/api/checkout", json=body).status_code == 422


def test_unknown_product_is_a_404():
    response = client.get("/api/products/nope")
    assert response.status_code == 404
    assert response.json()["statusMessage"] == "Product not found"
