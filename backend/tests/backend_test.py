"""
Backend regression tests for Cosmopolitan Xccessories (Next.js API).
Focus of this iteration: cart-clear-after-order bug.
"""
import os
import subprocess
import time
import pytest
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "https://cosmoxs.com").rstrip("/")

CUSTOMER_EMAIL = "customer@example.com"
CUSTOMER_PASSWORD = "User@123"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin@123"
TEST_PRODUCT_SLUG = "test-bakhoor-burner"
PUBLIC_TRACKING_ORDER_ID = "6a626cab81c467b16d15419d"


# ---------- helpers ----------

def _mongo(js):
    """Run a mongosh eval and return stdout (stripped)."""
    out = subprocess.check_output(
        ["mongosh", "cosmopolitan_shop", "--quiet", "--eval", js],
        stderr=subprocess.STDOUT,
        timeout=15,
    )
    return out.decode().strip()


def _fetch_latest_otp(email):
    js = (
        f'const d = db.otps.find({{email:"{email}"}}).sort({{createdAt:-1}}).limit(1).toArray()[0];'
        f'print(d ? d.otp : "");'
    )
    return _mongo(js)


def _fetch_product_id(slug=TEST_PRODUCT_SLUG):
    js = f'print(db.products.findOne({{slug:"{slug}"}})._id.toString());'
    return _mongo(js)


def _login_and_verify(session, email, password):
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    # give mongo a moment to persist OTP
    time.sleep(0.4)
    otp = _fetch_latest_otp(email)
    assert otp, f"could not fetch OTP for {email}"
    r2 = session.post(
        f"{BASE_URL}/api/auth/verify-otp",
        json={"email": email, "otp": otp},
        timeout=20,
    )
    assert r2.status_code == 200, f"verify-otp failed {r2.status_code} {r2.text}"
    return r2.json()


# ---------- fixtures ----------

@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login_and_verify(s, CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login_and_verify(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    return s


@pytest.fixture(scope="module")
def anon_session():
    return requests.Session()


@pytest.fixture(scope="module")
def product_id():
    return _fetch_product_id()


# ---------- Existing endpoints (regression) ----------

class TestPublicEndpoints:
    def test_products_list(self):
        r = requests.get(f"{BASE_URL}/api/products", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert body.get("data") is not None

    def test_categories_list(self):
        r = requests.get(f"{BASE_URL}/api/categories", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True

    def test_order_track_public(self):
        r = requests.get(
            f"{BASE_URL}/api/orders/track",
            params={"orderId": PUBLIC_TRACKING_ORDER_ID},
            timeout=20,
        )
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True


# ---------- SEO ----------

class TestSEO:
    def test_robots_txt(self):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=20)
        assert r.status_code == 200
        assert "text/plain" in r.headers.get("content-type", "").lower()
        assert "Sitemap" in r.text or "sitemap" in r.text

    def test_sitemap_xml(self):
        r = requests.get(f"{BASE_URL}/sitemap.xml", timeout=30)
        assert r.status_code == 200
        ctype = r.headers.get("content-type", "").lower()
        assert "xml" in ctype
        assert BASE_URL in r.text or "cosmoxs.com" in r.text
        assert "<urlset" in r.text


# ---------- Cart clear after order (THE bug in focus) ----------

class TestCartClearAfterOrder:
    def _add_to_cart(self, session, pid, qty=1):
        r = session.post(
            f"{BASE_URL}/api/cart",
            json={"productId": pid, "qty": qty, "variant": {}},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        return r.json()

    def _get_cart(self, session):
        r = session.get(f"{BASE_URL}/api/cart", timeout=20)
        assert r.status_code == 200, r.text
        return r.json().get("data") or {}

    def test_cart_cleared_after_cod_order(self, customer_session, product_id):
        # Ensure a clean cart
        customer_session.delete(f"{BASE_URL}/api/cart?clear=true", timeout=20)

        # Add item
        self._add_to_cart(customer_session, product_id, qty=1)
        cart_before = self._get_cart(customer_session)
        assert len(cart_before.get("items", [])) >= 1, "item must be in cart before order"

        addr = {
            "name": "Test Buyer",
            "phone": "9999999999",
            "address": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "email": CUSTOMER_EMAIL,
        }
        payload = {
            "items": [
                {
                    "productId": product_id,
                    "name": "Test Bakhoor Burner",
                    "image": "",
                    "price": 2499,
                    "qty": 1,
                }
            ],
            "shippingAddress": addr,
            "billingAddress": addr,
            "paymentMethod": "COD",
            "hasGiftWrap": False,
        }
        r = customer_session.post(f"{BASE_URL}/api/orders", json=payload, timeout=40)
        assert r.status_code == 201, f"order create failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("ok") is True
        assert body["data"]["orderId"]
        order_id = body["data"]["orderId"]

        # Server-side cart must be empty
        cart_after = self._get_cart(customer_session)
        items_after = cart_after.get("items", [])
        assert items_after == [] or len(items_after) == 0, (
            f"BUG: cart still contains items after order: {items_after}"
        )

        # Verify in Mongo directly
        js = (
            'const u = db.users.findOne({email:"customer@example.com"});'
            'const c = db.carts.findOne({user: u._id});'
            'print(c ? c.items.length : -1);'
        )
        length = _mongo(js).splitlines()[-1].strip()
        assert length in ("0", "-1"), f"Mongo cart not empty (items={length})"

        # Stash order id for other tests
        pytest.customer_order_id = order_id

    def test_explicit_cart_clear_via_delete(self, customer_session, product_id):
        self._add_to_cart(customer_session, product_id, qty=1)
        r = customer_session.delete(f"{BASE_URL}/api/cart?clear=true", timeout=20)
        assert r.status_code == 200
        cart = self._get_cart(customer_session)
        assert len(cart.get("items", [])) == 0


# ---------- Owner-only PDF download ----------

class TestOrderDownload:
    def test_unauth_returns_401(self, anon_session):
        oid = getattr(pytest, "customer_order_id", PUBLIC_TRACKING_ORDER_ID)
        r = anon_session.get(f"{BASE_URL}/api/orders/{oid}/download", timeout=20)
        assert r.status_code == 401

    def test_owner_gets_pdf(self, customer_session):
        oid = getattr(pytest, "customer_order_id", None)
        if not oid:
            pytest.skip("no customer order id from previous test")
        r = customer_session.get(f"{BASE_URL}/api/orders/{oid}/download", timeout=30)
        assert r.status_code == 200, r.text[:400]
        assert "application/pdf" in r.headers.get("content-type", "").lower()
        assert r.content[:4] == b"%PDF"

    def test_other_user_forbidden(self, admin_session):
        """Admin (a different user from owner) should still be able to
        access via /api/orders/[id]/download because route allows admin.
        A pure 'different customer' would 403, but we don't have another
        customer here. So we just verify admin CAN access (isAdmin branch)."""
        oid = getattr(pytest, "customer_order_id", None)
        if not oid:
            pytest.skip("no customer order id")
        r = admin_session.get(f"{BASE_URL}/api/orders/{oid}/download", timeout=30)
        # Admin allowed by code (isAdmin branch)
        assert r.status_code == 200


# ---------- Admin-only PDF download ----------

class TestAdminOrderDownload:
    def test_unauth_401_or_403(self, anon_session):
        oid = getattr(pytest, "customer_order_id", PUBLIC_TRACKING_ORDER_ID)
        r = anon_session.get(f"{BASE_URL}/api/admin/orders/{oid}/download", timeout=20)
        assert r.status_code in (401, 403)

    def test_customer_forbidden(self, customer_session):
        oid = getattr(pytest, "customer_order_id", PUBLIC_TRACKING_ORDER_ID)
        r = customer_session.get(f"{BASE_URL}/api/admin/orders/{oid}/download", timeout=20)
        assert r.status_code in (401, 403)

    def test_admin_gets_pdf(self, admin_session):
        oid = getattr(pytest, "customer_order_id", PUBLIC_TRACKING_ORDER_ID)
        r = admin_session.get(f"{BASE_URL}/api/admin/orders/{oid}/download", timeout=30)
        assert r.status_code == 200, r.text[:400]
        assert "application/pdf" in r.headers.get("content-type", "").lower()
        assert r.content[:4] == b"%PDF"
