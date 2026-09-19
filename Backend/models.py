"""Request models for the API."""
from pydantic import BaseModel


class BattleRequest(BaseModel):
    leftId: str
    rightId: str


class RecordBattleRequest(BaseModel):
    leftId: str
    rightId: str
    winnerId: str
    leftTotal: int
    rightTotal: int
    winnerShare: float


class PickRequest(BaseModel):
    memeName: str


class StartRequest(BaseModel):
    leftName: str
    rightName: str


class WinnerRequest(BaseModel):
    winnerName: str
    pct: int
