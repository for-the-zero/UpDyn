import asyncio
from flask import make_response
async def get(host_mid, mode):
    if mode == 'lib':
        from bilibili_api import user
        u = user.User(host_mid)
        dynamics = await u.get_dynamics_new()
        return dynamics

if __name__ == '__main__':
    print(asyncio.run(( get('513066052', 'lib') )))