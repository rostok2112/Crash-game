import asyncio
from websockets import connect

async def hello(uri):
    async with connect(uri) as websocket:
        await websocket.send("Hello world!")
        msg = await websocket.recv()
        await asyncio.sleep(5)

        await websocket.send("Hello world!")
        msg = await websocket.recv()
        print('returned resp', msg)
        await asyncio.sleep(1)


asyncio.run(hello("ws://localhost:8080"))