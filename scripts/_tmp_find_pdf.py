import re
import urllib.request

for u in (
    "https://sorcerytcg.com/news/sorcery-contested-realm-december-2025-rulebook-update",
    "https://sorcerytcg.com/news/july-2025-rulebook-update",
    "https://sorcerytcg.com/news/sorcery-contested-realm-rulebook-2024",
):
    h = urllib.request.urlopen(u, timeout=20).read().decode("utf-8", "replace")
    pdfs = set(re.findall(r"https?://[^\"'\s<>]+\.pdf[^\"'\s<>]*", h, re.I))
    print(u, "->", pdfs or "(none)")
