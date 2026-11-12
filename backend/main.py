import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent / ".env")

PLACEHOLDER_PREFIX = "여기에_"


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name, default).strip()
    return "" if value.startswith(PLACEHOLDER_PREFIX) else value


TMDB_API_KEY = _env("TMDB_API_KEY")
TMDB_TOKEN = _env("TMDB_READ_ACCESS_TOKEN")
LANGUAGE = _env("TMDB_LANGUAGE", "ko-KR")
REGION = _env("TMDB_REGION", "KR")
FRONTEND_ORIGIN = _env("FRONTEND_ORIGIN", "http://localhost:5173")

TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p"

client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global client
    headers = {"accept": "application/json"}
    if TMDB_TOKEN:
        headers["Authorization"] = f"Bearer {TMDB_TOKEN}"
    client = httpx.AsyncClient(base_url=TMDB_BASE, headers=headers, timeout=10)
    yield
    await client.aclose()


app = FastAPI(title="Movie API (TMDB)", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


async def tmdb(path: str, **params) -> dict:
    if not TMDB_TOKEN and not TMDB_API_KEY:
        raise HTTPException(500, "backend/.env 에 TMDB_API_KEY 또는 TMDB_READ_ACCESS_TOKEN 을 설정하세요.")
    params.setdefault("language", LANGUAGE)
    if not TMDB_TOKEN:
        params["api_key"] = TMDB_API_KEY
    try:
        res = await client.get(path, params=params)
    except httpx.HTTPError as e:
        raise HTTPException(502, f"TMDB 연결 실패: {e}") from e
    if res.status_code == 401:
        raise HTTPException(401, "TMDB 인증 실패: .env 의 키를 확인하세요.")
    if res.status_code == 404:
        raise HTTPException(404, "콘텐츠를 찾을 수 없습니다.")
    if res.is_error:
        raise HTTPException(res.status_code, res.text)
    return res.json()


def img(path: str | None, size: str) -> str | None:
    return f"{IMG_BASE}/{size}{path}" if path else None


def normalize(item: dict, media_type: str | None = None) -> dict:
    mt = item.get("media_type") or media_type or ("tv" if "first_air_date" in item else "movie")
    return {
        "id": item["id"],
        "media_type": mt,
        "title": item.get("title") or item.get("name") or "",
        "original_title": item.get("original_title") or item.get("original_name") or "",
        "overview": item.get("overview") or "",
        "poster": img(item.get("poster_path"), "w342"),
        "backdrop": img(item.get("backdrop_path"), "w1280"),
        "backdrop_original": img(item.get("backdrop_path"), "original"),
        "rating": round(item.get("vote_average") or 0, 1),
        "date": item.get("release_date") or item.get("first_air_date") or "",
        "adult": item.get("adult", False),
    }


SECTIONS = [
    # id, title, media type, tmdb path, extra params, style
    ("top", "오늘의 TOP 20", None, "/trending/all/day", {}, "rank"),
    ("now_playing", "지금 극장에서 상영 중", "movie", "/movie/now_playing", {"region": REGION}, "poster"),
    ("popular_tv", "지금 뜨는 시리즈", "tv", "/tv/popular", {}, "poster"),
    ("popular_movie", "인기 영화", "movie", "/movie/popular", {"region": REGION}, "landscape"),
    ("korean_tv", "K-드라마 & 예능", "tv", "/discover/tv",
     {"with_original_language": "ko", "sort_by": "popularity.desc"}, "poster"),
    ("top_rated", "평점이 높은 명작 영화", "movie", "/movie/top_rated", {}, "poster"),
    ("upcoming", "개봉 예정작", "movie", "/movie/upcoming", {"region": REGION}, "landscape"),
    ("korean_movie", "한국 영화", "movie", "/discover/movie",
     {"with_original_language": "ko", "sort_by": "popularity.desc"}, "poster"),
    ("animation", "애니메이션", "movie", "/discover/movie",
     {"with_genres": "16", "sort_by": "popularity.desc"}, "poster"),
    ("top_rated_tv", "평점이 높은 시리즈", "tv", "/tv/top_rated", {}, "poster"),
]


@app.get("/api/health")
async def health():
    return {"ok": True, "auth": "token" if TMDB_TOKEN else ("api_key" if TMDB_API_KEY else None)}


@app.get("/api/home")
async def home():
    results = await asyncio.gather(
        tmdb("/trending/all/week"),
        *(tmdb(path, **params) for _, _, _, path, params, _ in SECTIONS),
    )
    hero_items = [normalize(i) for i in results[0]["results"] if i.get("media_type") in ("movie", "tv")]
    hero = [i for i in hero_items if i["backdrop"] and i["overview"]][:8]

    sections = []
    for (sid, title, mt, _, _, style), data in zip(SECTIONS, results[1:]):
        items = [normalize(i, mt) for i in data.get("results", [])]
        items = [i for i in items if i["media_type"] in ("movie", "tv") and i["poster"]]
        sections.append({
            "id": sid, "title": title, "media_type": mt or "all", "style": style,
            "items": items[:20],
        })
    return {"hero": hero, "sections": sections}


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1), page: int = 1):
    data = await tmdb("/search/multi", query=q, page=page, include_adult="false")
    items = [normalize(i) for i in data["results"] if i.get("media_type") in ("movie", "tv")]
    return {"page": data["page"], "total_pages": data["total_pages"], "results": items}


@app.get("/api/{media_type}/{item_id}")
async def detail(media_type: str, item_id: int):
    if media_type not in ("movie", "tv"):
        raise HTTPException(400, "media_type 은 movie 또는 tv 여야 합니다.")
    d, videos_en = await asyncio.gather(
        tmdb(f"/{media_type}/{item_id}", append_to_response="videos,credits,similar"),
        tmdb(f"/{media_type}/{item_id}/videos", language="en-US"),
    )
    videos = d.get("videos", {}).get("results", []) + videos_en.get("results", [])
    trailer = next(
        (v for v in videos if v["site"] == "YouTube" and v["type"] in ("Trailer", "Teaser")), None
    )
    base = normalize(d, media_type)
    base.update({
        "tagline": d.get("tagline") or "",
        "genres": [g["name"] for g in d.get("genres", [])],
        "runtime": d.get("runtime") or (d.get("episode_run_time") or [None])[0],
        "seasons": d.get("number_of_seasons"),
        "episodes": d.get("number_of_episodes"),
        "status": d.get("status"),
        "trailer_key": trailer["key"] if trailer else None,
        "cast": [
            {"name": c["name"], "character": c.get("character", ""), "profile": img(c.get("profile_path"), "w185")}
            for c in d.get("credits", {}).get("cast", [])[:12]
        ],
        "directors": [c["name"] for c in d.get("credits", {}).get("crew", []) if c.get("job") == "Director"]
        or [c["name"] for c in d.get("created_by", [])],
        "similar": [
            normalize(i, media_type) for i in d.get("similar", {}).get("results", []) if i.get("poster_path")
        ][:12],
    })
    return base
