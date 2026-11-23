from functools import lru_cache
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from engine import chart, evaluate, house_edge_breakdown

Rank = Literal['A', '2', '3', '4', '5', '6', '7', '8', '9', '10']
DIST = Path(__file__).parent / 'dist'


class Rules(BaseModel):
    decks: int = Field(ge=1, le=8)
    hitSoft17: bool
    doubleAfterSplit: bool
    lateSurrender: bool
    blackjackPays: float
    dealerPeeks: bool
    allowDoubleDown: bool
    doubleDownRestriction: Literal['any', 'hard9to11', 'hard10or11', 'hard9to11AndSoft']
    maxSplits: int = Field(ge=0, le=3)
    allowResplitAces: bool
    allowDrawAfterSplitAces: bool


class EvalRequest(BaseModel):
    player: list[Rank] = Field(min_length=2, max_length=11)
    dealerUp: Rank
    shoe: list[int] = Field(min_length=10, max_length=10)
    rules: Rules
    splitsAlreadyTaken: int = Field(0, ge=0, le=3)


app = FastAPI(docs_url=None, redoc_url=None)


# ponytail: sync CPU-bound endpoint (worst hands take seconds); requests queue under load.
# Add a result cache or worker processes if traffic ever matters.
@app.post('/api/evaluate')
def api_evaluate(req: EvalRequest):
    shoe = [max(0, min(n, 128)) for n in req.shoe]
    return evaluate(req.player, req.dealerUp, shoe, req.rules.model_dump(), req.splitsAlreadyTaken)


@lru_cache(maxsize=512)
def _chart(rules: tuple):
    return chart(dict(rules))


@app.post('/api/chart')
def api_chart(rules: Rules):
    # blackjackPays never changes a decision, so it's dropped to share cache entries.
    return _chart(tuple(sorted(rules.model_dump(exclude={'blackjackPays'}).items())))


@app.post('/api/house-edge')
def api_house_edge(rules: Rules):
    # Base game, each rule's effect, and the total. engine caches every intermediate rule set.
    return house_edge_breakdown(rules.model_dump())


if DIST.exists():
    app.mount('/assets', StaticFiles(directory=DIST / 'assets'), name='assets')

    @app.get('/{path:path}')
    def spa(path: str):
        f = (DIST / path).resolve()
        if path and f.is_file() and DIST.resolve() in f.parents:
            return FileResponse(f)
        return FileResponse(DIST / 'index.html')  # client-side routes like /simulator
