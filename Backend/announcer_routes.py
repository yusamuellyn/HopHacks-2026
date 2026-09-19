"""ElevenLabs text-to-speech announcer endpoints."""
import os

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import APIRouter
from fastapi.responses import Response

from models import PickRequest, StartRequest, WinnerRequest

load_dotenv()

router = APIRouter(prefix="/api")

elevenlabs_client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
VOICE_ID = os.environ["ELEVENLABS_VOICE_ID"]


def generate_speech(text: str) -> bytes:
    audio_stream = elevenlabs_client.text_to_speech.convert(
        text=text,
        voice_id=VOICE_ID,
        model_id="eleven_turbo_v2_5",
        output_format="mp3_44100_128",
    )
    return b"".join(audio_stream)


@router.post("/announce-pick")
def announce_pick(payload: PickRequest):
    audio = generate_speech(payload.memeName.upper() + "!")
    return Response(content=audio, media_type="audio/mpeg")


@router.post("/announce-start")
def announce_start(payload: StartRequest):
    text = f"{payload.leftName} versus {payload.rightName}! Fight!"
    audio = generate_speech(text)
    return Response(content=audio, media_type="audio/mpeg")


@router.post("/announce-winner")
def announce_winner(payload: WinnerRequest):
    text = f"{payload.winnerName} wins! {payload.pct} percent meme dominance!"
    audio = generate_speech(text)
    return Response(content=audio, media_type="audio/mpeg")
