from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import Basemodel

import os



app = FastAPI()
@app.get("/")
def check():
    return {"status": "Backend running"}
    



