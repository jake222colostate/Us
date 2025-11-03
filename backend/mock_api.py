from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

# Home/feed list — MUST be an array so data.map(...) works
@app.get("/api/feed")
def feed():
    return [
        {"id": 1, "name": "Avery", "age": 27, "bio": "Hikes, coffee, dogs"},
        {"id": 2, "name": "Maya",  "age": 25, "bio": "Bouldering + books"},
        {"id": 3, "name": "Sam",   "age": 29, "bio": "Road trips + film"},
    ]

# add a couple of other array endpoints your UI might hit later
@app.get("/api/matches")
def matches():
    return [{"id": "m1", "userId": 2}, {"id": "m2", "userId": 3}]

@app.get("/api/likes")
def likes():
    return [{"id": "l1", "userId": 3}]
