import os
from typing import List, Optional, Literal, Union

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

ModelInputType = Optional[Literal["query", "passage"]]

class EmbedRequest(BaseModel):
    input: Union[str, List[str]] = Field(..., description="Text or list of texts to embed")
    input_type: ModelInputType = Field(
        None,
        description="Optional input type for models that support query/passage prefixes",
    )

class EmbedItem(BaseModel):
    index: int
    embedding: List[float]
    tokens: int

class EmbedResponse(BaseModel):
    model: str
    data: List[EmbedItem]
    usage: dict

app = FastAPI(title="Orca Memory Embeddings", version="0.1.0")

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "intfloat/e5-base-v2")
MAX_BATCH = int(os.getenv("EMBEDDING_MAX_BATCH", "32"))

model = SentenceTransformer(MODEL_NAME)
tokenizer = model.tokenizer


def apply_prefix(text: str, input_type: ModelInputType) -> str:
    if input_type == "query":
        return f"query: {text}"
    if input_type == "passage":
        return f"passage: {text}"
    return text


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": MODEL_NAME}


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    if isinstance(request.input, str):
        texts = [request.input]
    else:
        texts = request.input

    if not texts:
        raise HTTPException(status_code=400, detail="input cannot be empty")

    if len(texts) > MAX_BATCH:
        raise HTTPException(status_code=413, detail="batch too large")

    prepared = [apply_prefix(t, request.input_type) for t in texts]
    vectors = model.encode(prepared, normalize_embeddings=True)
    token_counts = [
        len(tokenizer(text, add_special_tokens=True)["input_ids"])
        for text in prepared
    ]

    data = [
        EmbedItem(index=i, embedding=vec.tolist(), tokens=token_counts[i])
        for i, vec in enumerate(vectors)
    ]

    return EmbedResponse(
        model=MODEL_NAME,
        data=data,
        usage={"total_tokens": sum(token_counts)},
    )
