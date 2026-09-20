#!/usr/bin/env python3
"""Download canonical Know Your Meme icons for each fighter."""

from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "assets" / "memes"
OUT.mkdir(parents=True, exist_ok=True)

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)
CTX = ssl.create_default_context()

# Primary KYM slugs, then fallbacks if the first 404s.
SLUGS = {
    "tung-tung-tung-sahur": ["tung-tung-tung-sahur"],
    "skibidi-toilet": ["skibidi-toilet"],
    "ohio": ["cant-even-x-in-ohio-only-in-ohio", "ohio"],
    "sixty-seven": ["67-meme-six-seven"],
    "tralalero-tralala": ["tralalero-tralala"],
    "bombardino-crocodilo": ["bombardiro-crocodilo-italian-brainrot", "bombardiro-crocodilo"],
    "labubu": ["subcultures/labubu-toys"],
    "chill-guy": ["just-a-chill-guy-my-new-character"],
    "rizz": ["rizz"],
    "sigma": ["what-the-sigma", "sigma-male"],
    "gyatt": ["gyatt"],
    "fanum-tax": ["fanum-tax"],
    "very-demure": ["very-demure-very-mindful", "very-demure"],
    "brat": ["brat-summer"],
    "hawk-tuah": ["hawk-tuah"],
    "mewing": ["mewing"],
    "crawly-gnome": ["tiny-green-mall-wizard-wizard-gnome"],
    "john-pork": ["john-pork"],
    "english-or-spanish": ["english-or-spanish"],
    "caseoh": ["caseoh"],
    "smurf-cat": ["smurf-cat"],
    "pedro-raccoon": ["raccoon-dancing-in-a-circle-pedro-pedro-pedro"],
    "costco-guys": ["were-costco-guys"],
    "sad-hamster": ["sad-hamster"],
    "aura-points": ["aura-points"],
    "low-taper-fade": ["imagine-if-ninja-got-a-low-taper-fade"],
    "fresh-avocado": ["freshavocado-fresh-avocado"],
    "jones-bbq": ["jones-bbq-and-foot-massage"],
    "rickroll": ["rickroll"],
    "nyan-cat": ["nyan-cat"],
    "trollface": ["trollface"],
    "doge": ["doge"],
    "pepe-the-frog": ["pepe-the-frog"],
    "keyboard-cat": ["keyboard-cat"],
    "grumpy-cat": ["grumpy-cat"],
    "harlem-shake": ["harlem-shake"],
    "gangnam-style": ["gangnam-style"],
    "success-kid": ["success-kid-i-hate-sandcastles"],
    "bad-luck-brian": ["bad-luck-brian"],
    "this-is-fine-dog": ["this-is-fine"],
    "distracted-boyfriend": ["distracted-boyfriend"],
    "big-chungus": ["big-chungus"],
    "shooting-stars": ["shooting-stars"],
    "aura-farming": ["indonesian-boat-racing-kid"],
    "sigma-boy": ["sigma-boy", "sigma-sigma-boy"],
    "steal-a-brainrot": ["subcultures/steal-a-brainrot"],
    "sprunki": ["subcultures/sprunki"],
    "chicken-jockey": ["chicken-jockey-minecraft-movie"],
    "kpop-demon-hunters": ["kpop-demon-hunters"],
    "clanker": ["clanker"],
    "rage-bait": ["rage-bait-ragebait"],
    "ghibli-ai": ["studio-ghibli-ai-generator"],
    "ai-action-figure": ["ai-action-figures"],
    "silksong": ["hollow-knight-silksong", "silksong-steam-server-crash"],
    "dubai-chocolate": ["labubu-matcha-dubai-chocolate", "dubai-chocolate"],
    "ambatukam": ["ambatukam"],
    "jet2-holiday": ["nothing-beats-a-jet2-holiday", "jet2-holiday"],
    "apt-apt": ["apt-by-rose-bruno-mars"],
    "pesto-penguin": ["pesto-the-penguin"],
    "justice-for-peanut": ["peanut-the-squirrel-pnut"],
    "crashout": ["crashout-crash-out"],
    "yapper": ["yap-yapping-yapper"],
    "duolingo-owl": ["evil-duolingo-owl"],
}

SEARCH_TERMS = {
    "tung-tung-tung-sahur": "tung tung tung sahur",
    "skibidi-toilet": "skibidi toilet",
    "ohio": "only in ohio",
    "sixty-seven": "6 7 six seven meme",
    "tralalero-tralala": "tralalero tralala",
    "bombardino-crocodilo": "bombardiro crocodilo",
    "labubu": "labubu",
    "chill-guy": "chill guy meme",
    "rizz": "rizz meme",
    "sigma": "sigma male meme",
    "gyatt": "gyatt meme",
    "fanum-tax": "fanum tax",
    "very-demure": "very demure very mindful",
    "brat": "brat charli xcx",
    "hawk-tuah": "hawk tuah",
    "mewing": "mewing meme",
    "crawly-gnome": "crawly gnome",
    "john-pork": "john pork",
    "english-or-spanish": "english or spanish meme",
    "caseoh": "caseoh",
    "smurf-cat": "smurf cat",
    "pedro-raccoon": "pedro pedro pedro raccoon",
    "costco-guys": "costco guys",
    "sad-hamster": "sad hamster",
    "aura-points": "aura points",
    "low-taper-fade": "low taper fade ninja",
    "fresh-avocado": "fresh avocado annoying orange",
    "jones-bbq": "jones bbq and foot massage",
    "rickroll": "rickroll",
    "nyan-cat": "nyan cat",
    "trollface": "trollface",
    "doge": "doge",
    "pepe-the-frog": "pepe the frog",
    "keyboard-cat": "keyboard cat",
    "grumpy-cat": "grumpy cat",
    "harlem-shake": "harlem shake meme",
    "gangnam-style": "gangnam style",
    "success-kid": "success kid",
    "bad-luck-brian": "bad luck brian",
    "this-is-fine-dog": "this is fine dog",
    "distracted-boyfriend": "distracted boyfriend",
    "big-chungus": "big chungus",
    "shooting-stars": "shooting stars meme",
    "aura-farming": "aura farming pacu jalur",
    "sigma-boy": "sigma boy meme",
    "steal-a-brainrot": "steal a brainrot",
    "sprunki": "sprunki incredibox",
    "chicken-jockey": "chicken jockey minecraft movie",
    "kpop-demon-hunters": "kpop demon hunters",
    "clanker": "clanker meme",
    "rage-bait": "rage bait ragebait",
    "ghibli-ai": "chatgpt ghibli style",
    "ai-action-figure": "ai action figure",
    "silksong": "hollow knight silksong",
    "dubai-chocolate": "dubai chocolate",
    "ambatukam": "ambatukam meme",
    "jet2-holiday": "nothing beats a jet2 holiday",
    "apt-apt": "apt rose bruno mars",
    "pesto-penguin": "pesto the penguin",
    "justice-for-peanut": "peanut the squirrel",
    "crashout": "crashing out meme",
    "yapper": "yapper meme",
    "duolingo-owl": "duolingo owl",
}


def fetch(url: str) -> tuple[int, bytes, str]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "*/*",
            "Referer": "https://knowyourmeme.com/",
        },
    )
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=30) as resp:
            return resp.status, resp.read(), resp.geturl()
    except urllib.error.HTTPError as err:
        return err.code, err.read() if err.fp else b"", url


def og_image(html: str) -> str | None:
    match = re.search(r"property=['\"]og:image['\"]\s+content=['\"]([^'\"]+)['\"]", html)
    if match:
        return match.group(1)
    match = re.search(r"content=['\"]([^'\"]+)['\"]\s+property=['\"]og:image['\"]", html)
    return match.group(1) if match else None


def search_kym(query: str) -> str | None:
    url = "https://knowyourmeme.com/search?" + urllib.parse.urlencode({"q": query})
    status, body, _ = fetch(url)
    if status != 200:
        return None
    html = body.decode("utf-8", "replace")
    # Prefer meme entry cards over news/editorials.
    for href in re.findall(r'href="(/memes/[^"?#]+)"', html):
        if href.startswith("/memes/people/") or href.endswith("/meme-man"):
            continue
        if href.count("/") == 2:
            return "https://knowyourmeme.com" + href
    return None


def ext_for(url: str, content_type: str) -> str:
    path = urllib.parse.urlparse(url).path.lower()
    for ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"
    if "gif" in content_type:
        return ".gif"
    return ".jpg"


def save_image(meme_id: str, image_url: str) -> Path | None:
    status, body, final_url = fetch(image_url)
    if status != 200 or not body:
        print(f"  image fail {status} {image_url}")
        return None
    # Prefer original KYM icons over tiny mobile thumbs.
    if "/icons/mobile/" in image_url:
        original = image_url.replace("/icons/mobile/", "/icons/original/")
        st2, body2, final2 = fetch(original)
        if st2 == 200 and body2:
            body, final_url = body2, final2
    ctype = ""
    dest_ext = ext_for(final_url or image_url, ctype)
    dest = OUT / f"{meme_id}{dest_ext}"
    dest.write_bytes(body)
    print(f"  saved {dest.name} ({len(body)} bytes) from {final_url}")
    return dest


def resolve_entry(meme_id: str) -> str | None:
    for slug in SLUGS.get(meme_id, [meme_id]):
        url = f"https://knowyourmeme.com/memes/{slug}"
        status, body, final = fetch(url)
        if status == 200:
            html = body.decode("utf-8", "replace")
            image = og_image(html)
            if image:
                print(f"  entry {url}")
                return image
        print(f"  miss {url} ({status})")
        time.sleep(0.3)
    query = SEARCH_TERMS.get(meme_id, meme_id.replace("-", " "))
    found = search_kym(query)
    if found:
        print(f"  search hit {found}")
        status, body, _ = fetch(found)
        if status == 200:
            return og_image(body.decode("utf-8", "replace"))
    return None


def existing_photo_ids() -> set[str]:
    return {
        path.stem.lower()
        for path in OUT.iterdir()
        if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    }


def main() -> None:
    report = {}
    already = existing_photo_ids()
    for meme_id in SLUGS:
        if meme_id in already:
            report[meme_id] = "EXISTS"
            continue
        print(f"\n{meme_id}")
        image = resolve_entry(meme_id)
        if not image:
            report[meme_id] = "NO IMAGE"
            print("  FAILED")
            continue
        path = save_image(meme_id, image)
        report[meme_id] = str(path) if path else "DOWNLOAD FAIL"
        time.sleep(0.4)
    print("\n=== REPORT ===")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
