SCHEMA = """
  CREATE TABLE categories (
    slug        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    position    INTEGER NOT NULL
  );

  CREATE TABLE products (
    slug          TEXT PRIMARY KEY,
    sku           TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    tagline       TEXT NOT NULL,
    description   TEXT NOT NULL,
    price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
    stock         INTEGER NOT NULL CHECK (stock >= 0),
    category_slug TEXT NOT NULL REFERENCES categories (slug),
    image_alt     TEXT NOT NULL,
    specs         TEXT NOT NULL,
    featured      INTEGER NOT NULL DEFAULT 0,
    updated_at    TEXT NOT NULL
  );

  CREATE INDEX products_category ON products (category_slug);
"""

CATEGORIES = [
    {
        "slug": "headphones",
        "name": "Headphones",
        "description": "Over-ear and in-ear headphones tuned for long sessions: comfortable, repairable "
        "and honest about what they do.",
    },
    {
        "slug": "speakers",
        "name": "Speakers",
        "description": "Powered speakers and radios for desks, shelves and kitchens. Plug them in and "
        "they sound right, no separate amp needed.",
    },
    {
        "slug": "desk-gear",
        "name": "Desk gear",
        "description": "Mechanical keyboards, macro pads and a USB DAC. The small, satisfying things "
        "your hands and ears touch all day.",
    },
    {
        "slug": "power",
        "name": "Power",
        "description": "GaN chargers, power banks and wireless stands that keep everything topped up "
        "without a tangle of cables.",
    },
]

PRODUCTS = [
    {
        "slug": "arc-one",
        "sku": "LP-HP-001",
        "name": "Arc One",
        "tagline": "Closed-back headphones for focused work",
        "description": "The Arc One seals out the office and keeps your music to yourself. Its 40 mm "
        "dynamic drivers have a warm, even tuning that stays comfortable through a full "
        "working day, and the memory-foam pads and steel headband can be replaced with a "
        "single screwdriver when they eventually wear out.",
        "priceCents": 24900,
        "stock": 18,
        "categorySlug": "headphones",
        "imageAlt": "Arc One closed-back headphones in matte black with orange accents on the ear cups",
        "featured": True,
        "specs": {
            "Driver": "40 mm dynamic",
            "Design": "Closed-back, over-ear",
            "Impedance": "32 Ω",
            "Connection": "Bluetooth 5.3, 3.5 mm",
            "Battery": "Up to 45 hours",
            "Weight": "268 g",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "arc-studio",
        "sku": "LP-HP-002",
        "name": "Arc Studio",
        "tagline": "Open-back headphones for mixing and critical listening",
        "description": "The Arc Studio has an open-back design that gives recordings room to breathe, "
        "with a wide stereo image and a neutral response you can trust when mixing. It "
        "runs from most audio interfaces without an extra amp, and the detachable cable "
        "means a snag never ends in a repair.",
        "priceCents": 34900,
        "stock": 0,
        "categorySlug": "headphones",
        "imageAlt": "Arc Studio open-back headphones in moss green with perforated metal grilles",
        "featured": False,
        "specs": {
            "Driver": "50 mm dynamic",
            "Design": "Open-back, over-ear",
            "Impedance": "80 Ω",
            "Connection": "Detachable 3.5 mm cable",
            "Frequency response": "8 Hz – 32 kHz",
            "Weight": "310 g",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "pebble-buds",
        "sku": "LP-HP-003",
        "name": "Pebble Buds",
        "tagline": "Pocketable noise-cancelling earbuds",
        "description": "Pebble Buds pair adaptive noise cancelling with a small, rounded case that slips "
        "into any pocket. Three tip sizes give a secure fit, six microphones keep calls "
        "clear, and an IPX4 rating means rain and workouts are no problem.",
        "priceCents": 12900,
        "stock": 42,
        "categorySlug": "headphones",
        "imageAlt": "Pebble Buds wireless earbuds in off-white above their rounded charging case",
        "featured": True,
        "specs": {
            "Driver": "10 mm dynamic",
            "Noise cancelling": "Adaptive hybrid ANC",
            "Connection": "Bluetooth 5.3, multipoint",
            "Battery": "8 hours + 24 in case",
            "Water resistance": "IPX4",
            "Weight": "5 g per bud",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "cube-3",
        "sku": "LP-SP-001",
        "name": "Cube 3",
        "tagline": "Powered bookshelf speakers in solid walnut",
        "description": "Cube 3 is a complete hi-fi in two walnut cabinets. Built-in amplification, a "
        "phono stage and Bluetooth mean you can connect a turntable, TV or phone "
        "directly, and the 5-inch woofers deliver real low end without needing a "
        "subwoofer.",
        "priceCents": 39900,
        "stock": 9,
        "categorySlug": "speakers",
        "imageAlt": "A pair of Cube 3 bookshelf speakers with walnut cabinets and black driver baffles",
        "featured": True,
        "specs": {
            "Drivers": "5 in woofer, 1 in silk-dome tweeter",
            "Power": "120 W total",
            "Inputs": "Bluetooth, RCA, phono, optical",
            "Frequency response": "48 Hz – 22 kHz",
            "Cabinet": "Solid walnut veneer",
            "Size (each)": "265 × 165 × 210 mm",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "monitor-2",
        "sku": "LP-SP-002",
        "name": "Monitor 2",
        "tagline": "Compact monitor speakers for your desktop",
        "description": "Monitor 2 brings near-field sound to a small desk. The angled stands aim the "
        "tweeters at your ears, USB-C audio connects with one cable, and a rear switch "
        "tailors the bass for placement close to a wall.",
        "priceCents": 21900,
        "stock": 3,
        "categorySlug": "speakers",
        "imageAlt": "A pair of Monitor 2 desktop speakers in off-white on angled black stands",
        "featured": False,
        "specs": {
            "Drivers": "3.5 in woofer, 0.75 in tweeter",
            "Power": "60 W total",
            "Inputs": "USB-C audio, 3.5 mm, Bluetooth",
            "Frequency response": "62 Hz – 20 kHz",
            "Size (each)": "180 × 115 × 140 mm",
            "Weight": "2.8 kg (pair)",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "room-radio",
        "sku": "LP-SP-003",
        "name": "Room Radio",
        "tagline": "A portable FM and Bluetooth radio with real dials",
        "description": "Room Radio is the simplest way to fill a kitchen with sound. Turn the big dial "
        "to tune, with no app or account in sight, then carry it to the garden and get 20 "
        "hours from a charge. Its 3-inch driver sounds far bigger than the cabinet "
        "suggests.",
        "priceCents": 17900,
        "stock": 27,
        "categorySlug": "speakers",
        "imageAlt": "Room Radio portable radio in signal orange with a carry handle, speaker grille and "
        "tuning dial",
        "featured": True,
        "specs": {
            "Driver": "3 in full-range",
            "Power": "15 W",
            "Inputs": "FM, Bluetooth 5.2, 3.5 mm",
            "Battery": "Up to 20 hours",
            "Charging": "USB-C",
            "Weight": "1.4 kg",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "tactile-75",
        "sku": "LP-DG-001",
        "name": "Tactile 75",
        "tagline": "A gasket-mounted 75% mechanical keyboard",
        "description": "Tactile 75 keeps the function row and arrows while freeing up space on your "
        "desk. Its gasket mount and foam layers give each press a soft, rounded sound, "
        "and the hot-swap sockets let you change switches without ever picking up a "
        "soldering iron.",
        "priceCents": 16900,
        "stock": 14,
        "categorySlug": "desk-gear",
        "imageAlt": "Tactile 75 mechanical keyboard with off-white keycaps, grey modifiers and orange "
        "accent keys",
        "featured": True,
        "specs": {
            "Layout": "75% ANSI, 82 keys",
            "Switches": "Hot-swap, 5-pin, linear",
            "Mount": "Gasket with dual foam layers",
            "Connection": "USB-C, Bluetooth, 2.4 GHz",
            "Battery": "4,000 mAh",
            "Software": "VIA compatible",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "macro-9",
        "sku": "LP-DG-002",
        "name": "Macro 9",
        "tagline": "Nine keys and a knob for the shortcuts you use most",
        "description": "Macro 9 puts your most-used shortcuts under one hand. Map keys to edits, scenes "
        "or app launchers, and use the aluminium knob for volume, zoom or timeline "
        "scrubbing. Layouts are stored on the device, so they follow it to any computer.",
        "priceCents": 6900,
        "stock": 31,
        "categorySlug": "desk-gear",
        "imageAlt": "Macro 9 macro pad in moss green with nine keycaps and a large metal knob",
        "featured": False,
        "specs": {
            "Keys": "9 hot-swap mechanical",
            "Encoder": "Clicky aluminium knob",
            "Layers": "4 onboard",
            "Connection": "USB-C",
            "Software": "VIA compatible",
            "Weight": "340 g",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "bridge-dac",
        "sku": "LP-DG-003",
        "name": "Bridge DAC",
        "tagline": "A USB DAC and headphone amp for your desk",
        "description": "Bridge DAC replaces your computer’s headphone jack with something much cleaner. "
        "It drives everything from sensitive earbuds to demanding studio cans with a "
        "silent background, and the sample-rate display and hefty volume knob make it a "
        "pleasure to use.",
        "priceCents": 13900,
        "stock": 11,
        "categorySlug": "desk-gear",
        "imageAlt": "Bridge DAC in black with an orange sample-rate display, headphone jack and large "
        "volume knob",
        "featured": True,
        "specs": {
            "Sample rate": "Up to 32-bit / 384 kHz",
            "Output": "6.35 mm and 3.5 mm",
            "Output power": "1.2 W into 32 Ω",
            "Line out": "RCA stereo",
            "Input": "USB-C, driverless",
            "Size": "130 × 110 × 42 mm",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "brick-65",
        "sku": "LP-PW-001",
        "name": "Brick 65",
        "tagline": "A 65 W three-port GaN wall charger",
        "description": "Brick 65 charges a laptop, tablet and phone from one small block. "
        "Gallium-nitride components keep it cool and compact, and power is shared "
        "automatically between ports, so each device gets the fastest rate it can safely "
        "take.",
        "priceCents": 4900,
        "stock": 64,
        "categorySlug": "power",
        "imageAlt": "Brick 65 wall charger in off-white with three ports, one in orange, and metal "
        "prongs",
        "featured": False,
        "specs": {
            "Total output": "65 W",
            "Ports": "2 × USB-C, 1 × USB-A",
            "Fast charging": "USB PD 3.1, PPS",
            "Input": "100–240 V",
            "Size": "52 × 52 × 30 mm",
            "Weight": "112 g",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "cell-20",
        "sku": "LP-PW-002",
        "name": "Cell 20",
        "tagline": "A 20,000 mAh power bank that can charge a laptop",
        "description": "Cell 20 stores enough energy to recharge a phone about four times or give a "
        "14-inch laptop a full top-up. It delivers 100 W over USB-C, recharges itself in "
        "about 90 minutes and stays within the limits for carry-on luggage.",
        "priceCents": 7900,
        "stock": 22,
        "categorySlug": "power",
        "imageAlt": "Cell 20 power bank in matte black with four orange charge indicator lights",
        "featured": False,
        "specs": {
            "Capacity": "20,000 mAh / 72 Wh",
            "Output": "100 W USB-C PD",
            "Ports": "2 × USB-C, 1 × USB-A",
            "Recharge": "About 90 minutes",
            "Flight safe": "Yes, under 100 Wh",
            "Weight": "430 g",
        },
        "updatedAt": "2026-11-02",
    },
    {
        "slug": "pad-2",
        "sku": "LP-PW-003",
        "name": "Pad 2",
        "tagline": "A wireless charging stand for your phone",
        "description": "Pad 2 holds your phone upright and charges it the moment you set it down, so "
        "notifications and video calls stay easy to see. A weighted base keeps it "
        "planted, and the magnets line up compatible phones perfectly in portrait or "
        "landscape.",
        "priceCents": 5900,
        "stock": 38,
        "categorySlug": "power",
        "imageAlt": "Pad 2 wireless charging stand in off-white with concentric rings on a black "
        "weighted base",
        "featured": False,
        "specs": {
            "Output": "15 W Qi2",
            "Alignment": "Magnetic",
            "Input": "USB-C (charger not included)",
            "Base": "Weighted steel",
            "Angle": "Fixed at 70°",
            "Weight": "290 g",
        },
        "updatedAt": "2026-11-02",
    },
]
